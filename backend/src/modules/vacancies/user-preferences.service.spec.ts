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
