# Embeddings / Semantic Vacancy Matching — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Pinecone-backed semantic vacancy search as a re-ranking layer on top of the existing keyword + `calcMatch` recommendations.

**Architecture:** A new `EmbeddingsService` in `ai/embeddings/` handles all Pinecone and embedding-API calls. `VacanciesService` calls it fire-and-forget in `searchAndSave` (indexing) and awaits it in `getRecommendedForProfile` (query + re-rank). Combined score = 60% `calcMatch` + 40% Pinecone cosine similarity.

**Tech Stack:** `@pinecone-database/pinecone@1.1.2`, OpenAI `text-embedding-3-small` via existing `LLM_API_KEY` / `LLM_API_BASE_URL`, NestJS HttpService, Jest for unit tests.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `backend/src/modules/ai/embeddings/embeddings.service.ts` | Pinecone client, embedding API, `indexVacancy`, `searchSimilar` |
| Create | `backend/src/modules/ai/embeddings/embeddings.module.ts` | Exports `EmbeddingsService` |
| Create | `backend/src/modules/ai/embeddings/embeddings.service.spec.ts` | Unit tests for `EmbeddingsService` |
| Modify | `backend/src/modules/vacancies/vacancies.module.ts` | Import `EmbeddingsModule` |
| Modify | `backend/src/modules/vacancies/vacancies.service.ts` | Inject `EmbeddingsService`, call in `searchAndSave` + `getRecommendedForProfile` |
| Modify | `backend/src/modules/vacancies/vacancies.service.spec.ts` | Add `EmbeddingsService` mock to providers |

---

## Task 1: Write failing tests for EmbeddingsService

**Files:**
- Create: `backend/src/modules/ai/embeddings/embeddings.service.spec.ts`

- [ ] **Step 1.1 — Create the test file**

```typescript
// backend/src/modules/ai/embeddings/embeddings.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { EmbeddingsService } from './embeddings.service';
import { of, throwError } from 'rxjs';

// ── Pinecone mock (module-level so it applies to all tests) ──────────────────
const mockUpsert = jest.fn().mockResolvedValue({});
const mockQuery = jest.fn().mockResolvedValue({
    matches: [
        { id: 'vacancy-1', score: 0.95 },
        { id: 'vacancy-2', score: 0.82 },
    ],
});
const mockPineconeIndex = { upsert: mockUpsert, query: mockQuery };

jest.mock('@pinecone-database/pinecone', () => ({
    Pinecone: jest.fn().mockImplementation(() => ({
        index: jest.fn().mockReturnValue(mockPineconeIndex),
    })),
}));

// ── Shared constants ─────────────────────────────────────────────────────────
const MOCK_VECTOR = Array(1536).fill(0.1);

const mockEmbeddingResponse = {
    data: { data: [{ embedding: MOCK_VECTOR }] },
};

// ── Mock factories ───────────────────────────────────────────────────────────
const makeHttp = () => ({
    post: jest.fn().mockReturnValue(of(mockEmbeddingResponse)),
});

const makeConfig = (overrides: Record<string, string> = {}) => ({
    get: jest.fn((key: string) => {
        const defaults: Record<string, string> = {
            PINECONE_API_KEY: 'test-pinecone-key',
            PINECONE_INDEX: 'test-index',
            LLM_API_KEY: 'test-llm-key',
            LLM_API_BASE_URL: 'https://api.openai.com/v1',
        };
        return overrides[key] ?? defaults[key];
    }),
});

// ═════════════════════════════════════════════════════════════════════════════
describe('EmbeddingsService', () => {
    let service: EmbeddingsService;
    let http: ReturnType<typeof makeHttp>;

    beforeEach(async () => {
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
        jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
        jest.clearAllMocks();

        // Restore default implementations after clearAllMocks
        mockUpsert.mockResolvedValue({});
        mockQuery.mockResolvedValue({
            matches: [
                { id: 'vacancy-1', score: 0.95 },
                { id: 'vacancy-2', score: 0.82 },
            ],
        });

        http = makeHttp();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmbeddingsService,
                { provide: HttpService, useValue: http },
                { provide: ConfigService, useValue: makeConfig() },
            ],
        }).compile();

        service = module.get<EmbeddingsService>(EmbeddingsService);
    });

    afterEach(() => jest.restoreAllMocks());

    // ──────────────────────────── indexVacancy ───────────────────────────────
    describe('indexVacancy', () => {
        it('should call embedding API with vacancy text', async () => {
            await service.indexVacancy('vac-123', 'Frontend Developer React TypeScript');

            expect(http.post).toHaveBeenCalledWith(
                'https://api.openai.com/v1/embeddings',
                expect.objectContaining({
                    model: 'text-embedding-3-small',
                    input: 'Frontend Developer React TypeScript',
                }),
                expect.objectContaining({
                    headers: expect.objectContaining({ Authorization: 'Bearer test-llm-key' }),
                }),
            );
        });

        it('should upsert the embedding vector into Pinecone with vacancy id', async () => {
            await service.indexVacancy('vac-123', 'Frontend Developer React TypeScript');

            expect(mockUpsert).toHaveBeenCalledWith([
                { id: 'vac-123', values: MOCK_VECTOR },
            ]);
        });

        it('should not throw when Pinecone upsert fails (fire-and-forget safe)', async () => {
            mockUpsert.mockRejectedValueOnce(new Error('Pinecone network error'));
            await expect(
                service.indexVacancy('vac-123', 'some text'),
            ).resolves.toBeUndefined();
        });

        it('should not throw when embedding API fails', async () => {
            http.post.mockReturnValueOnce(throwError(() => new Error('OpenAI down')));
            await expect(
                service.indexVacancy('vac-123', 'some text'),
            ).resolves.toBeUndefined();
        });
    });

    // ─────────────────────────── searchSimilar ───────────────────────────────
    describe('searchSimilar', () => {
        it('should return vacancy IDs sorted by cosine similarity', async () => {
            const result = await service.searchSimilar('Frontend Developer React', 5);

            expect(mockQuery).toHaveBeenCalledWith(
                expect.objectContaining({ topK: 5, includeValues: false }),
            );
            expect(result).toEqual(['vacancy-1', 'vacancy-2']);
        });

        it('should pass the query vector from the embedding API to Pinecone', async () => {
            await service.searchSimilar('some query text', 10);

            const queryCall = mockQuery.mock.calls[0][0];
            expect(queryCall.vector).toEqual(MOCK_VECTOR);
        });

        it('should return empty array when Pinecone query fails', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Query failed'));
            const result = await service.searchSimilar('some query', 5);
            expect(result).toEqual([]);
        });

        it('should return empty array when embedding API fails', async () => {
            http.post.mockReturnValueOnce(throwError(() => new Error('OpenAI down')));
            const result = await service.searchSimilar('some query', 5);
            expect(result).toEqual([]);
        });
    });

    // ──────────────────────── configuration errors ───────────────────────────
    describe('configuration errors', () => {
        it('should throw when PINECONE_API_KEY is not set', async () => {
            const module = await Test.createTestingModule({
                providers: [
                    EmbeddingsService,
                    { provide: HttpService, useValue: http },
                    { provide: ConfigService, useValue: makeConfig({ PINECONE_API_KEY: '' }) },
                ],
            }).compile();

            const svc = module.get<EmbeddingsService>(EmbeddingsService);
            await expect(svc.indexVacancy('id', 'text')).rejects.toThrow(
                'Pinecone API key is not configured.',
            );
        });

        it('should throw when PINECONE_INDEX is not set', async () => {
            const module = await Test.createTestingModule({
                providers: [
                    EmbeddingsService,
                    { provide: HttpService, useValue: http },
                    { provide: ConfigService, useValue: makeConfig({ PINECONE_INDEX: '' }) },
                ],
            }).compile();

            const svc = module.get<EmbeddingsService>(EmbeddingsService);
            await expect(svc.searchSimilar('text', 5)).rejects.toThrow(
                'Pinecone index name is not configured.',
            );
        });
    });
});
```

- [ ] **Step 1.2 — Run tests to verify they fail (file not found)**

```bash
cd backend && npx jest embeddings.service.spec.ts --no-coverage
```

Expected: `Cannot find module './embeddings.service'`

- [ ] **Step 1.3 — Commit the spec**

```bash
git add backend/src/modules/ai/embeddings/embeddings.service.spec.ts
git commit -m "test(embeddings): add failing tests for EmbeddingsService"
```

---

## Task 2: Implement EmbeddingsService

**Files:**
- Create: `backend/src/modules/ai/embeddings/embeddings.service.ts`

- [ ] **Step 2.1 — Create the service**

```typescript
// backend/src/modules/ai/embeddings/embeddings.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EmbeddingsService {
    private readonly logger = new Logger(EmbeddingsService.name);
    private pineconeIndex: ReturnType<Pinecone['index']> | null = null;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {}

    private getIndex(): ReturnType<Pinecone['index']> {
        const apiKey = this.configService.get<string>('PINECONE_API_KEY');
        const indexName = this.configService.get<string>('PINECONE_INDEX');

        if (!apiKey) throw new Error('Pinecone API key is not configured.');
        if (!indexName) throw new Error('Pinecone index name is not configured.');

        if (!this.pineconeIndex) {
            const pc = new Pinecone({ apiKey });
            this.pineconeIndex = pc.index(indexName);
        }
        return this.pineconeIndex;
    }

    private async getEmbedding(text: string): Promise<number[]> {
        const apiKey = this.configService.get<string>('LLM_API_KEY');
        if (!apiKey) throw new Error('LLM API key is not configured for embeddings.');

        const baseUrl = this.configService.get<string>(
            'LLM_API_BASE_URL',
            'https://api.openai.com/v1',
        );

        const response = await firstValueFrom(
            this.httpService.post(
                `${baseUrl}/embeddings`,
                { model: 'text-embedding-3-small', input: text.slice(0, 8000) },
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                },
            ),
        );

        return response.data.data[0].embedding as number[];
    }

    /**
     * Upsert a vacancy's embedding vector into Pinecone.
     * Config errors (missing API key) propagate. Runtime errors are caught and logged.
     */
    async indexVacancy(id: string, text: string): Promise<void> {
        const index = this.getIndex(); // throws if misconfigured
        try {
            const vector = await this.getEmbedding(text);
            await index.upsert([{ id, values: vector }]);
            this.logger.debug(`Indexed vacancy ${id} in Pinecone`);
        } catch (e: any) {
            this.logger.warn(`Failed to index vacancy ${id}: ${e.message}`);
        }
    }

    /**
     * Find vacancy IDs semantically similar to queryText, sorted by cosine similarity.
     * Config errors propagate. Runtime errors return [].
     */
    async searchSimilar(queryText: string, topK: number): Promise<string[]> {
        const index = this.getIndex(); // throws if misconfigured
        try {
            const vector = await this.getEmbedding(queryText);
            const results = await index.query({ vector, topK, includeValues: false });
            return (results.matches ?? []).map((m: any) => m.id as string);
        } catch (e: any) {
            this.logger.warn(`Semantic search failed: ${e.message}`);
            return [];
        }
    }
}
```

- [ ] **Step 2.2 — Run tests to verify they pass**

```bash
cd backend && npx jest embeddings.service.spec.ts --no-coverage
```

Expected: `Tests: 9 passed, 9 total`

- [ ] **Step 2.3 — Commit the implementation**

```bash
git add backend/src/modules/ai/embeddings/embeddings.service.ts
git commit -m "feat(embeddings): implement EmbeddingsService with Pinecone + OpenAI embeddings"
```

---

## Task 3: Create EmbeddingsModule and wire into VacanciesModule

**Files:**
- Create: `backend/src/modules/ai/embeddings/embeddings.module.ts`
- Modify: `backend/src/modules/vacancies/vacancies.module.ts`

- [ ] **Step 3.1 — Create the module**

```typescript
// backend/src/modules/ai/embeddings/embeddings.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EmbeddingsService } from './embeddings.service';

@Module({
    imports: [HttpModule],
    providers: [EmbeddingsService],
    exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
```

- [ ] **Step 3.2 — Import EmbeddingsModule into VacanciesModule**

Open `backend/src/modules/vacancies/vacancies.module.ts` and replace its content with:

```typescript
// backend/src/modules/vacancies/vacancies.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VacanciesService } from './vacancies.service';
import { VacanciesController } from './vacancies.controller';
import { DatabaseModule } from '../../database/database.module';
import { AiModule } from '../ai/ai.module';
import { SkillsModule } from '../skills/skills.module';
import { EmbeddingsModule } from '../ai/embeddings/embeddings.module';

@Module({
    imports: [DatabaseModule, HttpModule, AiModule, SkillsModule, EmbeddingsModule],
    controllers: [VacanciesController],
    providers: [VacanciesService],
    exports: [VacanciesService],
})
export class VacanciesModule {}
```

- [ ] **Step 3.3 — Build to confirm no TypeScript errors**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3.4 — Commit**

```bash
git add backend/src/modules/ai/embeddings/embeddings.module.ts backend/src/modules/vacancies/vacancies.module.ts
git commit -m "feat(embeddings): create EmbeddingsModule and wire into VacanciesModule"
```

---

## Task 4: Inject EmbeddingsService into VacanciesService + index in searchAndSave

**Files:**
- Modify: `backend/src/modules/vacancies/vacancies.service.ts`

- [ ] **Step 4.1 — Add EmbeddingsService to imports at the top of vacancies.service.ts**

Add after the existing imports:

```typescript
import { EmbeddingsService } from '../ai/embeddings/embeddings.service';
```

- [ ] **Step 4.2 — Add EmbeddingsService to the constructor**

Replace the constructor (lines ~280-287):

```typescript
    constructor(
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly aiService: AiService,
        private readonly skillsService: SkillsService,
        private readonly embeddingsService: EmbeddingsService,
    ) { }
```

- [ ] **Step 4.3 — Add fire-and-forget indexVacancy call in searchAndSave**

Inside `searchAndSave`, after the line `saved.push(upserted);` and the `syncVacancySkills` call, add:

```typescript
                // Index in Pinecone for semantic search (non-blocking, errors caught inside service)
                const embeddingText = [
                    upserted.title,
                    upserted.employer,
                    upserted.descriptionPreview,
                    rawSkills.join(', '),
                ].filter(Boolean).join(' ');
                this.embeddingsService.indexVacancy(upserted.id, embeddingText);
```

The full block around `saved.push` should look like:

```typescript
                saved.push(upserted);

                // Sync normalized skills asynchronously (non-blocking)
                if (rawSkills.length > 0) {
                    this.skillsService.syncVacancySkills(upserted.id, rawSkills)
                        .catch(e => this.logger.warn(`Skills sync failed for vacancy ${upserted.id}: ${e.message}`));
                }

                // Index in Pinecone for semantic search (non-blocking, errors caught inside service)
                const embeddingText = [
                    upserted.title,
                    upserted.employer,
                    upserted.descriptionPreview,
                    rawSkills.join(', '),
                ].filter(Boolean).join(' ');
                this.embeddingsService.indexVacancy(upserted.id, embeddingText);
```

- [ ] **Step 4.4 — Build to confirm no TypeScript errors**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4.5 — Commit**

```bash
git add backend/src/modules/vacancies/vacancies.service.ts
git commit -m "feat(embeddings): inject EmbeddingsService, index vacancy on save"
```

---

## Task 5: Add semantic re-ranking in getRecommendedForProfile

**Files:**
- Modify: `backend/src/modules/vacancies/vacancies.service.ts`

- [ ] **Step 5.1 — Replace the vacancies fetch + ranking block in getRecommendedForProfile**

Find the comment `// Fetch all vacancies related to the position` (around line 367) and replace everything from that comment to the `return ranked;` line with:

```typescript
        // Fetch all vacancies related to the position
        // Clean up expired vacancies
        await this.cleanupExpiredVacancies();

        const dbVacancies: any[] = await this.prisma.vacancy.findMany({
            where: position
                ? { searchQuery: { contains: position, mode: 'insensitive' } }
                : {},
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
            take: 50, // fetch wider set, rank by match
        });

        // ── Semantic re-ranking via Pinecone ─────────────────────────────────
        const queryText = [position, ...profileSkills].filter(Boolean).join(' ');
        const semanticRank = new Map<string, number>(); // vacancyId → normalized score 0–1

        try {
            const semanticIds = await this.embeddingsService.searchSimilar(queryText, 20);

            // Fetch any Pinecone results not already in the keyword set
            const dbIdSet = new Set(dbVacancies.map((v: any) => v.id));
            const extraIds = semanticIds.filter(id => !dbIdSet.has(id));
            if (extraIds.length > 0) {
                const extra = await this.prisma.vacancy.findMany({
                    where: { id: { in: extraIds } },
                });
                dbVacancies.push(...extra);
            }

            // Normalize position → score: rank 0 = 1.0, last rank ≈ 0
            semanticIds.forEach((id, idx) => {
                semanticRank.set(id, 1 - idx / Math.max(semanticIds.length, 1));
            });
        } catch (e: any) {
            this.logger.warn(`[Semantic] Search failed, using keyword-only: ${e.message}`);
        }
        // ─────────────────────────────────────────────────────────────────────

        // Calculate match, archetype, gap, freshness, and combined score for each
        const ranked = dbVacancies
            .map((v: any) => {
                const skills = Array.isArray(v.skills) ? (v.skills as string[]) : [];
                const desc = v.descriptionPreview || '';

                const matchScore = calcMatch(
                    v.title, skills, desc,
                    v.salaryFrom, v.salaryTo, v.salaryCurrency, v.salaryLabel,
                    position, profileSkills, salary
                );

                // Archetype detection (career-ops inspired)
                const archetype = detectArchetype(v.title, desc);

                // Gap analysis — matched vs missing skills
                const normalise = (s: string) => s.toLowerCase().trim();
                const vSkillsNorm = skills.map(normalise);
                const gap = (function () {
                    const allVSet = new Set(vSkillsNorm);
                    const profSet = new Set(profileSkills.map(normalise));
                    const matched: string[] = [], missing: string[] = [];
                    for (const vs of allVSet) (profSet.has(vs) ? matched : missing).push(vs);
                    return {
                        matchedSkills: matched.slice(0, 6),
                        missingSkills: missing.slice(0, 5),
                    };
                })();

                // Freshness (Ghost Job pre-check)
                const freshness = calcVacancyFreshness(v.publishedAt, v.createdAt, v.updatedAt);

                // Hybrid score: 60% keyword match + 40% semantic similarity
                const semanticScore = semanticRank.get(v.id) ?? 0;
                const combinedScore = 0.6 * (matchScore / 100) + 0.4 * semanticScore;

                return { ...v, matchScore, archetype, ...gap, freshness, semanticScore, combinedScore };
            })
            .filter((v: any) => v.matchScore > 20 || v.semanticScore > 0.3)
            .sort((a: any, b: any) => b.combinedScore - a.combinedScore)
            .slice(0, limit);

        return ranked;
```

- [ ] **Step 5.2 — Build to confirm no TypeScript errors**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5.3 — Commit**

```bash
git add backend/src/modules/vacancies/vacancies.service.ts
git commit -m "feat(embeddings): hybrid semantic re-ranking in getRecommendedForProfile"
```

---

## Task 6: Update vacancies.service.spec.ts and run all tests

**Files:**
- Modify: `backend/src/modules/vacancies/vacancies.service.spec.ts`

- [ ] **Step 6.1 — Add EmbeddingsService import and mock factory**

After the existing imports (after line 9 `import { of, throwError } from 'rxjs';`), add:

```typescript
import { EmbeddingsService } from '../ai/embeddings/embeddings.service';
```

After the existing `makeSkillsService` factory, add:

```typescript
const makeEmbeddingsService = () => ({
    indexVacancy: jest.fn().mockResolvedValue(undefined),
    searchSimilar: jest.fn().mockResolvedValue([]),
});
```

- [ ] **Step 6.2 — Add EmbeddingsService to the module in beforeEach**

In the `beforeEach` block inside `Test.createTestingModule({ providers: [...] })`, add `EmbeddingsService` after `SkillsService`:

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
            ],
        }).compile();
```

- [ ] **Step 6.3 — Add EmbeddingsService to the noCredsModule in the "no credentials" test**

In the `'should throw error when ADZUNA_APP_ID is not set'` test, update `noCredsModule`:

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
                ],
            }).compile();
```

- [ ] **Step 6.4 — Run the full test suite**

```bash
cd backend && npx jest --no-coverage
```

Expected:
```
Test Suites: 14 passed, 14 total
Tests:       XX passed, XX total
```

- [ ] **Step 6.5 — Commit**

```bash
git add backend/src/modules/vacancies/vacancies.service.spec.ts
git commit -m "test(vacancies): add EmbeddingsService mock to vacancies.service.spec.ts"
```

---

## Done

All tasks complete when:
- `npx jest --no-coverage` — all suites green including new `embeddings.service.spec.ts`
- `npx tsc --noEmit` — no TypeScript errors
- `PINECONE_API_KEY`, `PINECONE_INDEX`, `LLM_API_KEY` documented in `.env.example` (add manually if file exists)
