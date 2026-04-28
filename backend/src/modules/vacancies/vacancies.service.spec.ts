import { Test, TestingModule } from '@nestjs/testing';
import { VacanciesService } from './vacancies.service';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { SkillsService } from '../skills/skills.service';
import { of, throwError } from 'rxjs';
import { EmbeddingsService } from '../ai/embeddings/embeddings.service';
import { QuestionGenService } from '../interviews/question-gen/question-gen.service';
import { UserPreferencesService } from './user-preferences.service';
import { RedisService } from '../redis/redis.service';
import { MlRankingService } from '../ml/ml-ranking.service';
import { QuotaService } from '../quota/quota.service';

const makeQuotaService = () => ({
    assertAiCall: jest.fn().mockResolvedValue(undefined),
    commitAiCall: jest.fn().mockResolvedValue(undefined),
    assertResumeLimit: jest.fn().mockResolvedValue(undefined),
});

// ──────────────────────────────── mock data ──────────────────────────────────
const mockVacancy = {
    id: 'uuid-vac-1',
    hhId: '129698749',
    title: 'Frontend Developer',
    employer: 'Acme Ltd',
    location: 'London, UK',
    salaryLabel: 'от 50 000 до 70 000 £',
    salaryFrom: 50000,
    salaryTo: 70000,
    salaryCurrency: 'GBP',
    skills: [],
    descriptionPreview: 'We are looking for an experienced developer...',
    experience: null,
    schedule: 'Полная занятость',
    searchQuery: 'Frontend Developer',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
};

// Adzuna search API response
const mockAdzunaResponse = {
    data: {
        results: [
            {
                id: '129698749',
                title: 'Frontend Developer',
                company: { display_name: 'Acme Ltd' },
                location: { display_name: 'London, UK', area: ['UK', 'London'] },
                salary_min: 50000,
                salary_max: 70000,
                salary_is_predicted: 0,
                description: '<p>We are looking for an experienced developer</p>',
                contract_type: 'permanent',
                contract_time: 'full_time',
                created: '2024-01-01T00:00:00Z',
                redirect_url: 'https://adzuna.co.uk/jobs/land/ad/129698749',
            },
        ],
    },
};

// ─────────────────────────────── mock factories ───────────────────────────────
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

const makeHttp = () => ({
    get: jest.fn(),
});

const makeAiService = () => ({
    evaluateVacancyInDepth: jest.fn().mockResolvedValue({ score: 80, grade: 'B' }),
    generateInterviewPrep: jest.fn().mockResolvedValue({ questions: [] }),
    generateCoverLetter: jest.fn().mockResolvedValue({ coverLetter: 'mock' }),
});

const makeSkillsService = () => ({
    extractFromText: jest.fn().mockResolvedValue([]),
    syncVacancySkills: jest.fn().mockResolvedValue(undefined),
    getExpandedSkillNames: jest.fn().mockResolvedValue([]),
});

const makeEmbeddingsService = () => ({
    indexVacancy: jest.fn().mockResolvedValue(undefined),
    searchSimilar: jest.fn().mockResolvedValue([]),
});

const makeQuestionGenService = () => ({
    generateForVacancy: jest.fn().mockResolvedValue({ questions: [], candidate_questions: [], tips: '' }),
});

const makeUserPreferences = () => ({
    compute: jest.fn().mockResolvedValue({ archetype: {}, salary_band: {}, work_format: {}, seniority: {} }),
    extractVacancyFeatures: jest.fn().mockReturnValue({ archetype: {}, salary_band: {}, work_format: {}, seniority: {} }),
    computePersonalScore: jest.fn().mockReturnValue(0),
    invalidateCache: jest.fn().mockResolvedValue(undefined),
});

const makeMlRanking = () => ({
    isEnabled: jest.fn().mockReturnValue(false),
    isShadowMode: jest.fn().mockReturnValue(true),
    rank: jest.fn().mockResolvedValue(new Map()),
});

const makeRedis = () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
});

const makeConfig = (overrides: Record<string, string> = {}) => ({
    get: jest.fn((key: string) => {
        const defaults: Record<string, string> = {
            ADZUNA_APP_ID: 'test-app-id',
            ADZUNA_APP_KEY: 'test-app-key',
            ADZUNA_COUNTRY: 'gb',
        };
        return overrides[key] ?? defaults[key];
    }),
});

// ═════════════════════════════════════════════════════════════════════════════
describe('VacanciesService', () => {
    let service: VacanciesService;
    let prisma: ReturnType<typeof makePrisma>;
    let http: ReturnType<typeof makeHttp>;
    let config: ReturnType<typeof makeConfig>;

    beforeEach(async () => {
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
        prisma = makePrisma();
        http = makeHttp();
        config = makeConfig();

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
                { provide: MlRankingService, useValue: makeMlRanking() },
                { provide: QuotaService, useValue: makeQuotaService() },
            ],
        }).compile();

        service = module.get<VacanciesService>(VacanciesService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    // ─────────────────────────────── getVacancies ────────────────────────────
    describe('getVacancies', () => {
        it('should return all vacancies from DB when no query given', async () => {
            prisma.vacancy.findMany.mockResolvedValue([mockVacancy]);

            const result = await service.getVacancies();

            expect(result).toEqual([mockVacancy]);
            expect(prisma.vacancy.findMany).toHaveBeenCalledWith({
                where: {},
                orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
                take: 20,
            });
        });

        it('should filter by searchQuery when query is provided', async () => {
            prisma.vacancy.findMany.mockResolvedValue([mockVacancy]);

            await service.getVacancies({ query: 'Frontend', limit: 10 });

            expect(prisma.vacancy.findMany).toHaveBeenCalledWith({
                where: { searchQuery: { contains: 'Frontend', mode: 'insensitive' } },
                orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
                take: 10,
            });
        });

        it('should respect custom limit', async () => {
            prisma.vacancy.findMany.mockResolvedValue([]);

            await service.getVacancies({ limit: 5 });

            expect(prisma.vacancy.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ take: 5 }),
            );
        });

        it('should return empty array when DB has no vacancies', async () => {
            prisma.vacancy.findMany.mockResolvedValue([]);
            const result = await service.getVacancies({ query: 'nonexistent' });
            expect(result).toEqual([]);
        });
    });

    // ─────────────────────────────── searchAndSave ───────────────────────────
    describe('searchAndSave', () => {
        beforeEach(() => {
            http.get.mockReturnValue(of(mockAdzunaResponse));
            prisma.vacancy.upsert.mockResolvedValue(mockVacancy);
        });

        it('should call Adzuna search API with correct params', async () => {
            await service.searchAndSave('Frontend Developer', 5);

            expect(http.get).toHaveBeenCalledWith(
                'https://api.adzuna.com/v1/api/jobs/gb/search/1',
                expect.objectContaining({
                    params: expect.objectContaining({
                        app_id: 'test-app-id',
                        app_key: 'test-app-key',
                        what: 'Frontend Developer',
                        results_per_page: 5,
                    }),
                }),
            );
        });

        it('should make only ONE http call (no detail endpoint)', async () => {
            await service.searchAndSave('Frontend Developer', 1);
            expect(http.get).toHaveBeenCalledTimes(1);
        });

        it('should upsert vacancy to DB with parsed Adzuna data', async () => {
            await service.searchAndSave('Frontend Developer', 1);

            expect(prisma.vacancy.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { hhId: '129698749' },
                    create: expect.objectContaining({
                        hhId: '129698749',
                        title: 'Frontend Developer',
                        employer: 'Acme Ltd',
                        location: 'London, UK',
                        salaryFrom: 50000,
                        salaryTo: 70000,
                        salaryCurrency: 'GBP',
                        searchQuery: 'Frontend Developer',
                    }),
                }),
            );
        });

        it('should correctly build salary label with both min and max', async () => {
            await service.searchAndSave('Frontend Developer', 1);

            const upsertArg = prisma.vacancy.upsert.mock.calls[0][0];
            expect(upsertArg.create.salaryLabel).toContain('50');
            expect(upsertArg.create.salaryLabel).toContain('70');
            expect(upsertArg.create.salaryLabel).toContain('£');
        });

        it('should set "Зарплата не указана" when salary fields are absent', async () => {
            http.get.mockReturnValue(of({
                data: {
                    results: [{
                        id: '999',
                        title: 'Dev',
                        company: { display_name: 'Co' },
                        location: { display_name: 'London' },
                        salary_min: null,
                        salary_max: null,
                        description: 'desc',
                    }],
                },
            }));

            await service.searchAndSave('Dev', 1);

            const upsertArg = prisma.vacancy.upsert.mock.calls[0][0];
            expect(upsertArg.create.salaryLabel).toBe('Зарплата не указана');
        });

        it('should strip HTML tags from description', async () => {
            await service.searchAndSave('Frontend Developer', 1);

            const upsertArg = prisma.vacancy.upsert.mock.calls[0][0];
            expect(upsertArg.create.descriptionPreview).not.toContain('<p>');
            expect(upsertArg.create.descriptionPreview).toContain('experienced developer');
        });

        it('should map contract_type "permanent" to correct schedule label', async () => {
            await service.searchAndSave('Frontend Developer', 1);

            const upsertArg = prisma.vacancy.upsert.mock.calls[0][0];
            expect(upsertArg.create.schedule).toBe('Полная занятость');
        });

        it('should throw error when ADZUNA_APP_ID is not set', async () => {
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
                    { provide: MlRankingService, useValue: makeMlRanking() },
                    { provide: QuotaService, useValue: makeQuotaService() },
                ],
            }).compile();

            const svc = noCredsModule.get<VacanciesService>(VacanciesService);

            await expect(svc.searchAndSave('developer', 3)).rejects.toThrow(
                'Adzuna API credentials are not configured.',
            );
            expect(http.get).not.toHaveBeenCalled();
        });

        it('should throw error when Adzuna API returns an error', async () => {
            http.get.mockReturnValue(throwError(() => ({ message: 'Network Error', response: { status: 503 } })));

            await expect(service.searchAndSave('developer', 3)).rejects.toThrow(
                'Adzuna API request failed',
            );
        });

        it('should skip vacancy if upsert fails and continue with others', async () => {
            http.get.mockReturnValue(of({
                data: {
                    results: [
                        { id: '111', title: 'Dev 1', company: { display_name: 'Co1' }, location: { display_name: 'London' }, description: 'desc' },
                        { id: '222', title: 'Dev 2', company: { display_name: 'Co2' }, location: { display_name: 'London' }, description: 'desc' },
                    ],
                },
            }));

            prisma.vacancy.upsert
                .mockRejectedValueOnce(new Error('DB error'))
                .mockResolvedValueOnce(mockVacancy);

            const result = await service.searchAndSave('Developer', 2);

            expect(result).toHaveLength(1);
        });

        it('should cap results_per_page at 50', async () => {
            await service.searchAndSave('Developer', 100);

            const searchCall = http.get.mock.calls[0];
            expect(searchCall[1].params.results_per_page).toBe(50);
        });
    });

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
            const userPrefs = (service as any).userPreferences;
            await service.recordInteraction('vac-1', 'click', 'user-1');
            expect(prisma.vacancyInteraction.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { profileId_vacancyId_type: { profileId: 'profile-uuid-1', vacancyId: 'vac-1', type: 'click' } },
                    create: expect.objectContaining({ profileId: 'profile-uuid-1', vacancyId: 'vac-1', type: 'click' }),
                }),
            );
            expect(userPrefs.invalidateCache).toHaveBeenCalledWith('profile-uuid-1');
        });
    });

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
});
