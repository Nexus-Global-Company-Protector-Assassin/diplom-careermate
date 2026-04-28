# Phase 1 + 1.5 — Weighted Signals + Decay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded ×1.2 behavioral boost with a decayed weighted preference vector (archetype / salary_band / work_format), fix the profileId bug, and log recommendation impressions for future ML training.

**Architecture:** New `UserPreferencesService` aggregates `VacancyInteraction` rows with exponential decay (half-life 30 days) into a softmax-normalised preference vector cached in Redis (TTL 1h). `VacanciesService` injects it, uses `0.5×match + 0.3×semantic + 0.2×personal` combined score, and logs `RecommendationImpression` non-blockingly after forming TOP-10.

**Tech Stack:** NestJS · Prisma · PostgreSQL · Redis (ioredis) · Jest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `backend/prisma/schema.prisma` | Modify | Add `RecommendationImpression` model |
| `backend/src/modules/vacancies/user-preferences.service.ts` | Create | Decay formula, feature extraction, preference vector, Redis cache |
| `backend/src/modules/vacancies/user-preferences.service.spec.ts` | Create | Unit tests for all above |
| `backend/src/modules/vacancies/vacancies.module.ts` | Modify | Register `UserPreferencesService` |
| `backend/src/modules/vacancies/vacancies.controller.ts` | Modify | Add `@CurrentUser` to `getRecommended` + `trackInteraction` |
| `backend/src/modules/vacancies/vacancies.controller.spec.ts` | Modify | Update tests for userId passing |
| `backend/src/modules/vacancies/vacancies.service.ts` | Modify | Fix profileId bug, inject new service, new score formula, log impressions |
| `backend/src/modules/vacancies/vacancies.service.spec.ts` | Modify | Add mocks + new tests |

---

## Task 1: Prisma — Add RecommendationImpression Model

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Add model to schema.prisma**

Open `backend/prisma/schema.prisma` and append this model at the end (after `VacancySkill`):

```prisma
model RecommendationImpression {
  id           String   @id @default(uuid())
  profileId    String
  vacancyId    String
  position     Int
  score        Float
  modelVersion String   @default("rule-based-v1")
  createdAt    DateTime @default(now())

  @@index([profileId, createdAt])
}
```

- [ ] **Step 2: Run migration**

```bash
cd backend
npx prisma migrate dev --name phase1_recommendation_impression
```

Expected output: `The following migration(s) have been created and applied: migrations/..._phase1_recommendation_impression`

- [ ] **Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected output: `✔ Generated Prisma Client`

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(prisma): add RecommendationImpression model for ML impression logging"
```

---

## Task 2: UserPreferencesService (TDD)

**Files:**
- Create: `backend/src/modules/vacancies/user-preferences.service.spec.ts`
- Create: `backend/src/modules/vacancies/user-preferences.service.ts`
- Modify: `backend/src/modules/vacancies/vacancies.module.ts`

- [ ] **Step 1: Create the failing test file**

Create `backend/src/modules/vacancies/user-preferences.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { UserPreferencesService } from './user-preferences.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';

const makePrisma = () => ({
    vacancyInteraction: { findMany: jest.fn().mockResolvedValue([]) },
});

const makeRedis = () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
});

const makeInteraction = (overrides: Partial<any> = {}): any => ({
    id: 'int-1',
    profileId: 'profile-1',
    vacancyId: 'vac-1',
    type: 'click',
    createdAt: new Date(),
    vacancy: {
        title: 'Backend Developer',
        descriptionPreview: '',
        salaryFrom: 50000,
        salaryTo: 60000,
        schedule: null,
        location: null,
    },
    ...overrides,
});

describe('UserPreferencesService', () => {
    let service: UserPreferencesService;
    let prisma: ReturnType<typeof makePrisma>;
    let redis: ReturnType<typeof makeRedis>;

    beforeEach(async () => {
        prisma = makePrisma();
        redis = makeRedis();
        const module = await Test.createTestingModule({
            providers: [
                UserPreferencesService,
                { provide: PrismaService, useValue: prisma },
                { provide: RedisService, useValue: redis },
            ],
        }).compile();
        service = module.get(UserPreferencesService);
    });

    afterEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); });

    // ─── extractVacancyFeatures ───────────────────────────────────────────
    describe('extractVacancyFeatures', () => {
        it('detects Backend archetype', () => {
            const f = service.extractVacancyFeatures({ title: 'Senior Backend Developer', descriptionPreview: 'node.js api' });
            expect(f.archetype['Backend']).toBe(1);
        });

        it('detects Frontend archetype', () => {
            const f = service.extractVacancyFeatures({ title: 'React Frontend Engineer', descriptionPreview: '' });
            expect(f.archetype['Frontend']).toBe(1);
        });

        it('returns empty archetype object for Unknown role', () => {
            const f = service.extractVacancyFeatures({ title: 'Office Manager', descriptionPreview: '' });
            expect(Object.keys(f.archetype)).toHaveLength(0);
        });

        it('classifies low salary band — avg < 30k GBP', () => {
            const f = service.extractVacancyFeatures({ salaryFrom: 20000, salaryTo: 25000 });
            expect(f.salary_band).toEqual({ low: 1 });
        });

        it('classifies mid salary band — avg 30–70k GBP', () => {
            const f = service.extractVacancyFeatures({ salaryFrom: 40000, salaryTo: 60000 });
            expect(f.salary_band).toEqual({ mid: 1 });
        });

        it('classifies high salary band — avg > 70k GBP', () => {
            const f = service.extractVacancyFeatures({ salaryFrom: 80000, salaryTo: 100000 });
            expect(f.salary_band).toEqual({ high: 1 });
        });

        it('returns empty salary_band when no salary data', () => {
            const f = service.extractVacancyFeatures({ salaryFrom: null, salaryTo: null });
            expect(Object.keys(f.salary_band)).toHaveLength(0);
        });

        it('detects remote via schedule containing "удал"', () => {
            const f = service.extractVacancyFeatures({ schedule: 'Удалённая работа', location: 'Москва' });
            expect(f.work_format).toEqual({ remote: 1 });
        });

        it('detects remote via location containing "удал"', () => {
            const f = service.extractVacancyFeatures({ schedule: 'Полная занятость', location: 'Удалённо' });
            expect(f.work_format).toEqual({ remote: 1 });
        });

        it('defaults to onsite when no remote signals', () => {
            const f = service.extractVacancyFeatures({ schedule: 'Полная занятость', location: 'Москва' });
            expect(f.work_format).toEqual({ onsite: 1 });
        });
    });

    // ─── computePersonalScore ─────────────────────────────────────────────
    describe('computePersonalScore', () => {
        it('returns 0 when all preference dimensions are empty', () => {
            const prefs = { archetype: {}, salary_band: {}, work_format: {} };
            const features = { archetype: { Backend: 1 }, salary_band: { mid: 1 }, work_format: { onsite: 1 } };
            expect(service.computePersonalScore(prefs, features)).toBe(0);
        });

        it('returns preference score for single matching archetype', () => {
            const prefs = { archetype: { Backend: 0.8, Frontend: 0.2 }, salary_band: {}, work_format: {} };
            const features = { archetype: { Backend: 1 }, salary_band: {}, work_format: {} };
            expect(service.computePersonalScore(prefs, features)).toBeCloseTo(0.8);
        });

        it('averages score across available dimensions', () => {
            const prefs = { archetype: { Backend: 0.7 }, salary_band: { mid: 0.9 }, work_format: {} };
            const features = { archetype: { Backend: 1 }, salary_band: { mid: 1 }, work_format: {} };
            expect(service.computePersonalScore(prefs, features)).toBeCloseTo(0.8);
        });

        it('skips dimensions where vacancy has no feature data', () => {
            const prefs = { archetype: { Backend: 0.6 }, salary_band: { mid: 1.0 }, work_format: { onsite: 1.0 } };
            const features = { archetype: { Backend: 1 }, salary_band: {}, work_format: {} };
            expect(service.computePersonalScore(prefs, features)).toBeCloseTo(0.6);
        });
    });

    // ─── compute ─────────────────────────────────────────────────────────
    describe('compute', () => {
        it('returns empty preferences when there are no interactions', async () => {
            prisma.vacancyInteraction.findMany.mockResolvedValue([]);
            const prefs = await service.compute('profile-1');
            expect(prefs).toEqual({ archetype: {}, salary_band: {}, work_format: {} });
        });

        it('returns cached preferences on Redis hit without hitting DB', async () => {
            const cached = { archetype: { Backend: 0.9, Frontend: 0.1 }, salary_band: {}, work_format: {} };
            redis.get.mockResolvedValue(JSON.stringify(cached));
            const prefs = await service.compute('profile-1');
            expect(prefs).toEqual(cached);
            expect(prisma.vacancyInteraction.findMany).not.toHaveBeenCalled();
        });

        it('stores computed preferences in Redis with TTL 3600', async () => {
            prisma.vacancyInteraction.findMany.mockResolvedValue([makeInteraction()]);
            await service.compute('profile-1');
            expect(redis.set).toHaveBeenCalledWith('prefs:v1:profile-1', expect.any(String), 3600);
        });

        it('recent interactions dominate over old ones after decay', async () => {
            const recentDate = new Date(Date.now() - 2 * 86400000);  // 2 days ago
            const oldDate = new Date(Date.now() - 60 * 86400000);    // 60 days ago (2 half-lives)
            prisma.vacancyInteraction.findMany.mockResolvedValue([
                makeInteraction({
                    type: 'click', createdAt: recentDate,
                    vacancy: { title: 'Backend Developer', descriptionPreview: '', salaryFrom: null, salaryTo: null, schedule: null, location: null },
                }),
                makeInteraction({
                    type: 'click', createdAt: oldDate,
                    vacancy: { title: 'React Frontend Developer', descriptionPreview: '', salaryFrom: null, salaryTo: null, schedule: null, location: null },
                }),
            ]);
            const prefs = await service.compute('profile-1');
            expect(prefs.archetype['Backend'] || 0).toBeGreaterThan(prefs.archetype['Frontend'] || 0);
        });

        it('dismiss reduces preference for that archetype vs positive interaction', async () => {
            prisma.vacancyInteraction.findMany.mockResolvedValue([
                makeInteraction({
                    type: 'analyze',
                    vacancy: { title: 'React Frontend Engineer', descriptionPreview: '', salaryFrom: null, salaryTo: null, schedule: null, location: null },
                }),
                makeInteraction({
                    type: 'dismiss',
                    vacancy: { title: 'Backend Developer node.js', descriptionPreview: '', salaryFrom: null, salaryTo: null, schedule: null, location: null },
                }),
            ]);
            const prefs = await service.compute('profile-1');
            expect(prefs.archetype['Frontend'] || 0).toBeGreaterThan(prefs.archetype['Backend'] || 0);
        });

        it('falls through to DB gracefully when Redis get throws', async () => {
            redis.get.mockRejectedValue(new Error('ECONNREFUSED'));
            prisma.vacancyInteraction.findMany.mockResolvedValue([]);
            await expect(service.compute('profile-1')).resolves.toEqual({ archetype: {}, salary_band: {}, work_format: {} });
        });
    });

    // ─── invalidateCache ──────────────────────────────────────────────────
    describe('invalidateCache', () => {
        it('deletes the correct Redis key', async () => {
            await service.invalidateCache('profile-1');
            expect(redis.del).toHaveBeenCalledWith('prefs:v1:profile-1');
        });

        it('does not throw when Redis del throws', async () => {
            redis.del.mockRejectedValue(new Error('ECONNREFUSED'));
            await expect(service.invalidateCache('profile-1')).resolves.toBeUndefined();
        });
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend
npx jest user-preferences.service.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module './user-preferences.service'`

- [ ] **Step 3: Create the implementation**

Create `backend/src/modules/vacancies/user-preferences.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { detectArchetype } from './vacancies.service';

export interface PreferenceVector {
    archetype: Record<string, number>;
    salary_band: Record<string, number>;
    work_format: Record<string, number>;
}

export interface VacancyFeatures {
    archetype: Record<string, number>;
    salary_band: Record<string, number>;
    work_format: Record<string, number>;
}

const WEIGHTS: Record<string, number> = { analyze: 4, apply: 5, favorite: 3, click: 1, dismiss: -6 };
const LAMBDA = Math.log(2) / 30; // half-life 30 days

@Injectable()
export class UserPreferencesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
    ) {}

    async compute(profileId: string): Promise<PreferenceVector> {
        const cacheKey = `prefs:v1:${profileId}`;
        try {
            const cached = await this.redis.get(cacheKey);
            if (cached) return JSON.parse(cached) as PreferenceVector;
        } catch { /* Redis unavailable — fall through */ }

        const interactions = await this.prisma.vacancyInteraction.findMany({
            where: { profileId },
            include: {
                vacancy: {
                    select: {
                        title: true,
                        descriptionPreview: true,
                        salaryFrom: true,
                        salaryTo: true,
                        schedule: true,
                        location: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });

        const raw: PreferenceVector = { archetype: {}, salary_band: {}, work_format: {} };

        for (const i of interactions) {
            if (!i.vacancy) continue;
            const w = this.decayedWeight(i.type, i.createdAt);
            const features = this.extractVacancyFeatures(i.vacancy);
            for (const [k, v] of Object.entries(features.archetype)) {
                raw.archetype[k] = (raw.archetype[k] || 0) + w * v;
            }
            for (const [k, v] of Object.entries(features.salary_band)) {
                raw.salary_band[k] = (raw.salary_band[k] || 0) + w * v;
            }
            for (const [k, v] of Object.entries(features.work_format)) {
                raw.work_format[k] = (raw.work_format[k] || 0) + w * v;
            }
        }

        const prefs: PreferenceVector = {
            archetype: this.softmaxPositive(raw.archetype),
            salary_band: this.softmaxPositive(raw.salary_band),
            work_format: this.softmaxPositive(raw.work_format),
        };

        try {
            await this.redis.set(cacheKey, JSON.stringify(prefs), 3600);
        } catch { /* non-critical */ }

        return prefs;
    }

    extractVacancyFeatures(vacancy: {
        title?: string | null;
        descriptionPreview?: string | null;
        salaryFrom?: number | null;
        salaryTo?: number | null;
        schedule?: string | null;
        location?: string | null;
    }): VacancyFeatures {
        const features: VacancyFeatures = { archetype: {}, salary_band: {}, work_format: {} };

        const arch = detectArchetype(vacancy.title || '', vacancy.descriptionPreview || '');
        if (arch !== 'Unknown') features.archetype[arch] = 1;

        const avg =
            vacancy.salaryFrom != null && vacancy.salaryTo != null
                ? (vacancy.salaryFrom + vacancy.salaryTo) / 2
                : vacancy.salaryFrom ?? vacancy.salaryTo ?? null;
        if (avg !== null) {
            features.salary_band[avg < 30000 ? 'low' : avg <= 70000 ? 'mid' : 'high'] = 1;
        }

        const sched = (vacancy.schedule || '').toLowerCase();
        const loc = (vacancy.location || '').toLowerCase();
        const isRemote =
            sched.includes('удал') || sched.includes('remote') ||
            loc.includes('удал') || loc.includes('remote');
        features.work_format[isRemote ? 'remote' : 'onsite'] = 1;

        return features;
    }

    computePersonalScore(prefs: PreferenceVector, features: VacancyFeatures): number {
        const dims: Array<keyof PreferenceVector> = ['archetype', 'salary_band', 'work_format'];
        const scores: number[] = [];
        for (const dim of dims) {
            if (Object.keys(features[dim]).length === 0 || Object.keys(prefs[dim]).length === 0) continue;
            scores.push(this.dotProduct(prefs[dim], features[dim]));
        }
        if (scores.length === 0) return 0;
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    async invalidateCache(profileId: string): Promise<void> {
        try {
            await this.redis.del(`prefs:v1:${profileId}`);
        } catch { /* non-critical */ }
    }

    private decayedWeight(type: string, createdAt: Date): number {
        const daysAgo = (Date.now() - createdAt.getTime()) / 86400000;
        return (WEIGHTS[type] || 0) * Math.exp(-LAMBDA * daysAgo);
    }

    private softmaxPositive(scores: Record<string, number>): Record<string, number> {
        const hasPositive = Object.values(scores).some(v => v > 0);
        if (!hasPositive) return {};
        const keys = Object.keys(scores);
        const vals = keys.map(k => scores[k]);
        const max = Math.max(...vals);
        const exps = vals.map(v => Math.exp(v - max));
        const sum = exps.reduce((a, b) => a + b, 0);
        return Object.fromEntries(keys.map((k, i) => [k, exps[i] / sum]));
    }

    private dotProduct(a: Record<string, number>, b: Record<string, number>): number {
        return Object.entries(b).reduce((sum, [k, v]) => sum + (a[k] || 0) * v, 0);
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend
npx jest user-preferences.service.spec.ts --no-coverage
```

Expected: PASS — all tests green

- [ ] **Step 5: Register UserPreferencesService in VacanciesModule**

Open `backend/src/modules/vacancies/vacancies.module.ts`. Replace the file content with:

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VacanciesService } from './vacancies.service';
import { VacanciesController } from './vacancies.controller';
import { DatabaseModule } from '../../database/database.module';
import { AiModule } from '../ai/ai.module';
import { SkillsModule } from '../skills/skills.module';
import { EmbeddingsModule } from '../ai/embeddings/embeddings.module';
import { QuestionGenModule } from '../interviews/question-gen/question-gen.module';
import { UserPreferencesService } from './user-preferences.service';

@Module({
    imports: [DatabaseModule, HttpModule, AiModule, SkillsModule, EmbeddingsModule, QuestionGenModule],
    controllers: [VacanciesController],
    providers: [VacanciesService, UserPreferencesService],
    exports: [VacanciesService],
})
export class VacanciesModule { }
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/vacancies/user-preferences.service.ts \
        backend/src/modules/vacancies/user-preferences.service.spec.ts \
        backend/src/modules/vacancies/vacancies.module.ts
git commit -m "feat(vacancies): add UserPreferencesService with decay formula and Redis cache"
```

---

## Task 3: Fix profileId Bug — Controller + recordInteraction

**Files:**
- Modify: `backend/src/modules/vacancies/vacancies.controller.ts`
- Modify: `backend/src/modules/vacancies/vacancies.controller.spec.ts`
- Modify: `backend/src/modules/vacancies/vacancies.service.ts`
- Modify: `backend/src/modules/vacancies/vacancies.service.spec.ts`

- [ ] **Step 1: Add failing controller test for userId passing**

Open `backend/src/modules/vacancies/vacancies.controller.spec.ts`. Replace the test at line 54 (`'should return recommended (stub)'`) with:

```typescript
it('should pass userId from JWT to getRecommendedForProfile', async () => {
    (service.getRecommendedForProfile as jest.Mock).mockResolvedValue([]);
    const result = await controller.getRecommended(mockUser);
    expect(service.getRecommendedForProfile).toHaveBeenCalledWith(
        '',
        [],
        10,
        undefined,
        mockUser.userId,
    );
    expect(Array.isArray(result)).toBe(true);
});
```

Also add a test for `trackInteraction` passing userId (append before the final `}`):

```typescript
it('should pass userId to recordInteraction', async () => {
    const mockRecordInteraction = jest.fn().mockResolvedValue(undefined);
    (service as any).recordInteraction = mockRecordInteraction;
    await controller.trackInteraction(mockUser, 'vacancy-1', { type: 'click' });
    expect(mockRecordInteraction).toHaveBeenCalledWith('vacancy-1', 'click', mockUser.userId);
});
```

- [ ] **Step 2: Run controller tests to verify new ones fail**

```bash
cd backend
npx jest vacancies.controller.spec.ts --no-coverage
```

Expected: FAIL on the two new tests

- [ ] **Step 3: Update the controller**

Open `backend/src/modules/vacancies/vacancies.controller.ts`.

Replace the `getRecommended` method signature and body (currently at line 57):

```typescript
@Get('recommended')
@ApiOperation({ summary: 'Get top-10 recommended vacancies based on user profile' })
@ApiQuery({ name: 'position', required: false, description: 'Desired job position' })
@ApiQuery({ name: 'skills', required: false, description: 'Comma-separated skill list' })
@ApiQuery({ name: 'limit', required: false })
async getRecommended(
    @CurrentUser() user: { userId: string },
    @Query('position') position?: string,
    @Query('skills') skillsRaw?: string,
    @Query('salary') salaryStr?: string,
    @Query('limit') limit?: string,
) {
    const profileSkills = skillsRaw
        ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean)
        : [];
    const pos = position || '';
    const salary = salaryStr ? parseInt(salaryStr, 10) : undefined;
    const lim = limit ? parseInt(limit) : 10;

    const vacancies = await this.vacanciesService.getRecommendedForProfile(pos, profileSkills, lim, salary, user.userId);
```

Replace the `trackInteraction` method (currently at line 112):

```typescript
@Post(':id/interaction')
@HttpCode(HttpStatus.NO_CONTENT)
@ApiOperation({ summary: 'Record behavioral interaction signal for a vacancy' })
@ApiParam({ name: 'id', description: 'Vacancy ID' })
async trackInteraction(
    @CurrentUser() user: { userId: string },
    @Param('id') vacancyId: string,
    @Body() body: { type: string },
): Promise<void> {
    await this.vacanciesService.recordInteraction(vacancyId, body.type, user.userId);
}
```

- [ ] **Step 4: Add failing service test for recordInteraction**

Open `backend/src/modules/vacancies/vacancies.service.spec.ts`.

Replace the `makePrisma` factory (currently lines 56–63) with the expanded version:

```typescript
const makePrisma = () => ({
    vacancy: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        count: jest.fn().mockResolvedValue(0),
    },
    profile: {
        findFirst: jest.fn().mockResolvedValue({ id: 'profile-uuid-1' }),
    },
    vacancyInteraction: {
        upsert: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
    },
    recommendationImpression: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
});
```

Add two new mock factories after `makeQuestionGenService`:

```typescript
const makeUserPreferences = () => ({
    compute: jest.fn().mockResolvedValue({ archetype: {}, salary_band: {}, work_format: {} }),
    extractVacancyFeatures: jest.fn().mockReturnValue({ archetype: {}, salary_band: {}, work_format: {} }),
    computePersonalScore: jest.fn().mockReturnValue(0),
    invalidateCache: jest.fn().mockResolvedValue(undefined),
});

const makeRedis = () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
});
```

In the `beforeEach` block, update the `TestingModule` to include the two new providers:

```typescript
const module: TestingModule = await Test.createTestingModule({
    providers: [
        VacanciesService,
        { provide: PrismaService, useValue: prisma },
        { provide: HttpService, useValue: http },
        { provide: ConfigService, useValue: config },
        { provide: AiService, useValue: makeAiService() },
        { provide: SkillsService, useValue: makeSkillsService() },
        { provide: EmbeddingsService, useValue: makeEmbeddingsService() },
        { provide: QuestionGenService, useValue: makeQuestionGenService() },
        { provide: UserPreferencesService, useValue: makeUserPreferences() },
        { provide: RedisService, useValue: makeRedis() },
    ],
}).compile();
```

Also add the same two providers to the `noCredsModule` test inside `searchAndSave` describe block (the `Test.createTestingModule` call at the bottom of the file):

```typescript
const noCredsModule = await Test.createTestingModule({
    providers: [
        VacanciesService,
        { provide: PrismaService, useValue: prisma },
        { provide: HttpService, useValue: http },
        { provide: ConfigService, useValue: makeConfig({ ADZUNA_APP_ID: '', ADZUNA_APP_KEY: '' }) },
        { provide: AiService, useValue: makeAiService() },
        { provide: SkillsService, useValue: makeSkillsService() },
        { provide: EmbeddingsService, useValue: makeEmbeddingsService() },
        { provide: QuestionGenService, useValue: makeQuestionGenService() },
        { provide: UserPreferencesService, useValue: makeUserPreferences() },
        { provide: RedisService, useValue: makeRedis() },
    ],
}).compile();
```

Add the missing imports at the top of `vacancies.service.spec.ts`:

```typescript
import { UserPreferencesService } from './user-preferences.service';
import { RedisService } from '../redis/redis.service';
```

Append a new `describe('recordInteraction')` block before the final `});`:

```typescript
// ─────────────────────────────── recordInteraction ───────────────────────
describe('recordInteraction', () => {
    it('does nothing for unknown interaction types', async () => {
        await service.recordInteraction('vac-1', 'unknown', 'user-1');
        expect(prisma.vacancyInteraction.upsert).not.toHaveBeenCalled();
    });

    it('does nothing when profile is not found for userId', async () => {
        prisma.profile.findFirst.mockResolvedValue(null);
        await service.recordInteraction('vac-1', 'click', 'user-1');
        expect(prisma.vacancyInteraction.upsert).not.toHaveBeenCalled();
    });

    it('upserts interaction and invalidates cache when profile exists', async () => {
        prisma.profile.findFirst.mockResolvedValue({ id: 'profile-uuid-1' });
        await service.recordInteraction('vac-1', 'click', 'user-1');
        expect(prisma.vacancyInteraction.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { profileId_vacancyId_type: { profileId: 'profile-uuid-1', vacancyId: 'vac-1', type: 'click' } },
                create: expect.objectContaining({ profileId: 'profile-uuid-1', vacancyId: 'vac-1', type: 'click' }),
            }),
        );
    });
});
```

- [ ] **Step 5: Run service tests to verify new ones fail**

```bash
cd backend
npx jest vacancies.service.spec.ts --no-coverage
```

Expected: FAIL on the three new `recordInteraction` tests (method signature mismatch)

- [ ] **Step 6: Update recordInteraction in VacanciesService**

Open `backend/src/modules/vacancies/vacancies.service.ts`.

Add to the constructor (after `questionGenService`):

```typescript
private readonly userPreferences: UserPreferencesService,
```

Add the import at the top of the file:

```typescript
import { UserPreferencesService } from './user-preferences.service';
```

Replace the `recordInteraction` method body entirely:

```typescript
async recordInteraction(vacancyId: string, type: string, userId?: string): Promise<void> {
    const allowed = ['click', 'apply', 'favorite', 'analyze', 'dismiss'];
    if (!allowed.includes(type)) return;

    const profile = userId
        ? await this.prisma.profile.findFirst({ where: { userId }, select: { id: true } })
        : null;
    if (!profile) return;

    await this.prisma.vacancyInteraction.upsert({
        where: { profileId_vacancyId_type: { profileId: profile.id, vacancyId, type } },
        create: { profileId: profile.id, vacancyId, type },
        update: { createdAt: new Date() },
    });

    await this.userPreferences.invalidateCache(profile.id);
    this.logger.log(`[Interaction] type=${type} vacancy=${vacancyId} profile=${profile.id}`);
}
```

- [ ] **Step 7: Run all tests to verify everything passes**

```bash
cd backend
npx jest vacancies.controller.spec.ts vacancies.service.spec.ts --no-coverage
```

Expected: PASS — all tests green

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/vacancies/vacancies.controller.ts \
        backend/src/modules/vacancies/vacancies.controller.spec.ts \
        backend/src/modules/vacancies/vacancies.service.ts \
        backend/src/modules/vacancies/vacancies.service.spec.ts
git commit -m "fix(vacancies): pass userId through controller, fix profileId bug in recordInteraction, invalidate preferences cache"
```

---

## Task 4: Integrate Preference Vector + Impression Logging

**Files:**
- Modify: `backend/src/modules/vacancies/vacancies.service.ts`
- Modify: `backend/src/modules/vacancies/vacancies.service.spec.ts`

- [ ] **Step 1: Add failing tests for the new ranking behaviour**

Open `backend/src/modules/vacancies/vacancies.service.spec.ts`. Append a new describe block before the final `});`:

```typescript
// ──────────────────────── getRecommendedForProfile ───────────────────────
describe('getRecommendedForProfile', () => {
    const makeVacancy = (overrides: Partial<any> = {}): any => ({
        id: 'vac-1',
        hhId: 'hh-1',
        title: 'Backend Developer',
        employer: 'Acme',
        location: 'London',
        salaryFrom: 50000,
        salaryTo: 60000,
        salaryCurrency: 'GBP',
        salaryLabel: '50k-60k £',
        skills: ['node.js', 'typescript'],
        descriptionPreview: 'We need a backend developer with node.js experience.',
        schedule: 'Полная занятость',
        searchQuery: 'Backend Developer',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    });

    beforeEach(() => {
        prisma.vacancy.findMany.mockResolvedValue([makeVacancy()]);
        prisma.vacancy.count.mockResolvedValue(10);
    });

    it('returns empty array when no vacancies match', async () => {
        prisma.vacancy.findMany.mockResolvedValue([]);
        const result = await service.getRecommendedForProfile('Backend', [], 10, undefined, 'user-1');
        expect(Array.isArray(result)).toBe(true);
    });

    it('looks up profile by userId, not by findFirst without filter', async () => {
        await service.getRecommendedForProfile('Backend', [], 10, undefined, 'user-1');
        expect(prisma.profile.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({ where: { userId: 'user-1' } }),
        );
    });

    it('calls userPreferences.compute with the resolved profileId', async () => {
        prisma.profile.findFirst.mockResolvedValue({ id: 'profile-uuid-1' });
        const userPrefs = (service as any).userPreferences;
        await service.getRecommendedForProfile('Backend', [], 10, undefined, 'user-1');
        expect(userPrefs.compute).toHaveBeenCalledWith('profile-uuid-1');
    });

    it('logs RecommendationImpression non-blockingly after returning results', async () => {
        prisma.profile.findFirst.mockResolvedValue({ id: 'profile-uuid-1' });
        prisma.vacancyInteraction.findMany.mockResolvedValue([]);
        await service.getRecommendedForProfile('Backend', [], 10, undefined, 'user-1');
        // Give the non-blocking promise time to settle
        await new Promise(r => setImmediate(r));
        expect(prisma.recommendationImpression.createMany).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.arrayContaining([
                    expect.objectContaining({ profileId: 'profile-uuid-1', modelVersion: 'rule-based-v1' }),
                ]),
            }),
        );
    });

    it('skips impression logging when no userId provided', async () => {
        await service.getRecommendedForProfile('Backend', [], 10);
        await new Promise(r => setImmediate(r));
        expect(prisma.recommendationImpression.createMany).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run tests to verify new ones fail**

```bash
cd backend
npx jest vacancies.service.spec.ts --no-coverage -t "getRecommendedForProfile"
```

Expected: FAIL

- [ ] **Step 3: Update getRecommendedForProfile signature**

Open `backend/src/modules/vacancies/vacancies.service.ts`.

Change the method signature from:

```typescript
async getRecommendedForProfile(
    position: string,
    profileSkills: string[],
    limit = 10,
    salary?: number
): Promise<any[]> {
```

to:

```typescript
async getRecommendedForProfile(
    position: string,
    profileSkills: string[],
    limit = 10,
    salary?: number,
    userId?: string,
): Promise<any[]> {
```

- [ ] **Step 4: Update the initial combinedScore formula**

Inside `getRecommendedForProfile`, find the line:

```typescript
const combinedScore = 0.6 * (matchScore / 100) + 0.4 * semanticScore;
```

Replace with:

```typescript
const combinedScore = 0.5 * (matchScore / 100) + 0.3 * semanticScore;
```

- [ ] **Step 5: Replace the entire behavioral re-ranking block**

Find and replace the entire `// ── Behavioral re-ranking ──` block (from `const profile = await this.prisma.profile.findFirst` to the closing `return ranked.slice(0, limit);`) with:

```typescript
// ── Behavioral re-ranking ────────────────────────────────────────────────
const profile = userId
    ? await this.prisma.profile.findFirst({ where: { userId }, select: { id: true } })
    : null;
const profileId = profile?.id;

if (profileId) {
    const [prefs, dismissed] = await Promise.all([
        this.userPreferences.compute(profileId),
        this.prisma.vacancyInteraction.findMany({
            where: { profileId, type: 'dismiss' },
            select: { vacancyId: true },
        }),
    ]);

    const dismissedIds = new Set(dismissed.map(i => i.vacancyId));

    const reranked = ranked
        .filter((v: any) => !dismissedIds.has(v.id))
        .map((v: any) => {
            const features = this.userPreferences.extractVacancyFeatures(v);
            const personalScore = this.userPreferences.computePersonalScore(prefs, features);
            return {
                ...v,
                personalScore,
                combinedScore: 0.5 * (v.matchScore / 100) + 0.3 * v.semanticScore + 0.2 * personalScore,
            };
        })
        .sort((a: any, b: any) => b.combinedScore - a.combinedScore)
        .slice(0, limit);

    this.prisma.recommendationImpression.createMany({
        data: reranked.map((v: any, idx: number) => ({
            profileId,
            vacancyId: v.id,
            position: idx + 1,
            score: v.combinedScore,
            modelVersion: 'rule-based-v1',
        })),
    }).catch((e: any) => this.logger.warn(`[Impression] Log failed: ${e.message}`));

    return reranked;
}
// ─────────────────────────────────────────────────────────────────────────

return ranked.slice(0, limit);
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd backend
npx jest vacancies.service.spec.ts --no-coverage
```

Expected: PASS — all tests green

- [ ] **Step 7: Run the full test suite**

```bash
cd backend
npx jest --no-coverage
```

Expected: PASS — no regressions

- [ ] **Step 8: Commit**

```bash
git add backend/src/modules/vacancies/vacancies.service.ts \
        backend/src/modules/vacancies/vacancies.service.spec.ts
git commit -m "feat(vacancies): integrate weighted preference vector, fix combined score formula, log RecommendationImpression"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| `computeUserPreferences(profileId)` with decay | Task 2 — `UserPreferencesService.compute()` |
| `weight: analyze=4, apply=5, favorite=3, click=1, dismiss=-6` | Task 2 — `WEIGHTS` constant |
| `decay = exp(-ln(2)/30 × days_ago)` | Task 2 — `decayedWeight()` |
| Softmax normalisation per dimension | Task 2 — `softmaxPositive()` |
| Dimensions: archetype, salary_band, work_format | Task 2 — `extractVacancyFeatures()` |
| GBP thresholds: low<30k, mid 30–70k, high>70k | Task 2 — `extractVacancyFeatures()` |
| Redis cache TTL 1h | Task 2 — `compute()` with TTL 3600 |
| Cache invalidation on recordInteraction | Task 3 — `invalidateCache()` call |
| Replace 1.2 hardcoded boost | Task 4 — new combined score formula |
| `combinedScore = 0.5×match + 0.3×semantic + 0.2×personal` | Task 4 — Step 4 + 5 |
| Fix profileId bug (findFirst without filter) | Task 3 — `{ where: { userId } }` |
| `@CurrentUser` in getRecommended + trackInteraction | Task 3 — controller update |
| `RecommendationImpression` Prisma model | Task 1 |
| Non-blocking impression logging after TOP-10 | Task 4 — Step 5 |
| Skip logging when no profileId | Task 4 — `if (profileId)` guard |

All spec requirements covered. No gaps found.
