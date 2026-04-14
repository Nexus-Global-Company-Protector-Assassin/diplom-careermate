import { Test, TestingModule } from '@nestjs/testing';
import { VacanciesService } from './vacancies.service';
import { PrismaService } from '../../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';

// ──────────────────────────────── mock data ──────────────────────────────────
const mockVacancy = {
    id: 'uuid-vac-1',
    hhId: '98765432',
    title: 'Frontend Developer',
    employer: 'Яндекс',
    location: 'Москва',
    salaryLabel: 'от 150 000 до 250 000 ₽',
    salaryFrom: 150000,
    salaryTo: 250000,
    salaryCurrency: 'RUR',
    skills: ['React', 'TypeScript'],
    descriptionPreview: 'Ищем опытного разработчика...',
    experience: 'От 3 до 6 лет',
    schedule: 'Полный день',
    searchQuery: 'Frontend Developer',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
};

// HH search API response (list of vacancies)
const mockHhSearchResponse = {
    data: {
        items: [
            {
                id: '98765432',
                name: 'Frontend Developer',
                employer: { name: 'Яндекс' },
                area: { name: 'Москва' },
            },
        ],
    },
};

// HH vacancy detail API response
const mockHhDetailResponse = {
    data: {
        id: '98765432',
        name: 'Frontend Developer',
        salary: { from: 150000, to: 250000, currency: 'RUR', gross: false },
        key_skills: [{ name: 'React' }, { name: 'TypeScript' }],
        description: '<p>Ищем опытного разработчика</p>',
        experience: { id: 'between3And6', name: 'От 3 до 6 лет' },
        schedule: { id: 'fullDay', name: 'Полный день' },
    },
};

// ─────────────────────────────── mock factories ───────────────────────────────
const makePrisma = () => ({
    vacancy: {
        findMany: jest.fn(),
        upsert: jest.fn(),
    },
});

const makeHttp = () => ({
    get: jest.fn(),
});

// ═════════════════════════════════════════════════════════════════════════════
describe('VacanciesService', () => {
    let service: VacanciesService;
    let prisma: ReturnType<typeof makePrisma>;
    let http: ReturnType<typeof makeHttp>;

    beforeEach(async () => {
        prisma = makePrisma();
        http = makeHttp();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VacanciesService,
                { provide: PrismaService, useValue: prisma },
                { provide: HttpService, useValue: http },
            ],
        }).compile();

        service = module.get<VacanciesService>(VacanciesService);
    });

    afterEach(() => jest.clearAllMocks());

    // ─────────────────────────────── getVacancies ────────────────────────────
    describe('getVacancies', () => {
        it('should return all vacancies from DB when no query given', async () => {
            prisma.vacancy.findMany.mockResolvedValue([mockVacancy]);

            const result = await service.getVacancies();

            expect(result).toEqual([mockVacancy]);
            expect(prisma.vacancy.findMany).toHaveBeenCalledWith({
                where: {},
                orderBy: { createdAt: 'desc' },
                take: 20,
            });
        });

        it('should filter by searchQuery when query is provided', async () => {
            prisma.vacancy.findMany.mockResolvedValue([mockVacancy]);

            await service.getVacancies('Frontend', 10);

            expect(prisma.vacancy.findMany).toHaveBeenCalledWith({
                where: { searchQuery: { contains: 'Frontend', mode: 'insensitive' } },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });
        });

        it('should respect custom limit', async () => {
            prisma.vacancy.findMany.mockResolvedValue([]);

            await service.getVacancies(undefined, 5);

            expect(prisma.vacancy.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ take: 5 }),
            );
        });

        it('should return empty array when DB has no vacancies', async () => {
            prisma.vacancy.findMany.mockResolvedValue([]);
            const result = await service.getVacancies('nonexistent');
            expect(result).toEqual([]);
        });
    });

    // ─────────────────────────────── searchAndSave ───────────────────────────
    describe('searchAndSave', () => {
        beforeEach(() => {
            // Default: search returns 1 item, detail returns full data
            http.get
                .mockReturnValueOnce(of(mockHhSearchResponse))  // HH search
                .mockReturnValueOnce(of(mockHhDetailResponse));  // HH detail
            prisma.vacancy.upsert.mockResolvedValue(mockVacancy);
        });

        it('should call HH search API with correct params', async () => {
            await service.searchAndSave('Frontend Developer', 5);

            expect(http.get).toHaveBeenCalledWith(
                'https://api.hh.ru/vacancies',
                expect.objectContaining({
                    params: expect.objectContaining({
                        text: 'Frontend Developer',
                        per_page: 5,
                        area: 113,
                    }),
                }),
            );
        });

        it('should call HH detail API for each found vacancy', async () => {
            await service.searchAndSave('Frontend Developer', 1);

            expect(http.get).toHaveBeenCalledWith(
                'https://api.hh.ru/vacancies/98765432',
                expect.any(Object),
            );
        });

        it('should upsert vacancy to DB with parsed data', async () => {
            await service.searchAndSave('Frontend Developer', 1);

            expect(prisma.vacancy.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { hhId: '98765432' },
                    create: expect.objectContaining({
                        hhId: '98765432',
                        title: 'Frontend Developer',
                        employer: 'Яндекс',
                        location: 'Москва',
                        skills: ['React', 'TypeScript'],
                        experience: 'От 3 до 6 лет',
                        schedule: 'Полный день',
                        searchQuery: 'Frontend Developer',
                    }),
                }),
            );
        });

        it('should correctly calculate RUR salary label', async () => {
            await service.searchAndSave('Frontend', 1);

            const upsertArg = prisma.vacancy.upsert.mock.calls[0][0];
            expect(upsertArg.create.salaryFrom).toBe(150000);
            expect(upsertArg.create.salaryTo).toBe(250000);
            expect(upsertArg.create.salaryLabel).toBe('от 150\u00a0000 до 250\u00a0000 ₽');
        });

        it('should add "до вычета" when salary.gross is true', async () => {
            http.get
                .mockReset()
                .mockReturnValueOnce(of(mockHhSearchResponse))
                .mockReturnValueOnce(of({
                    data: {
                        ...mockHhDetailResponse.data,
                        salary: { from: 200000, to: null, currency: 'RUR', gross: true },
                    },
                }));

            await service.searchAndSave('Frontend', 1);

            const upsertArg = prisma.vacancy.upsert.mock.calls[0][0];
            expect(upsertArg.create.salaryLabel).toContain('до вычета');
        });

        it('should convert USD salary to RUB (rate 93.5)', async () => {
            http.get
                .mockReset()
                .mockReturnValueOnce(of(mockHhSearchResponse))
                .mockReturnValueOnce(of({
                    data: {
                        ...mockHhDetailResponse.data,
                        salary: { from: 1000, to: 2000, currency: 'USD', gross: false },
                    },
                }));

            await service.searchAndSave('Frontend', 1);

            const upsertArg = prisma.vacancy.upsert.mock.calls[0][0];
            expect(upsertArg.create.salaryFrom).toBe(93500);   // 1000 * 93.5
            expect(upsertArg.create.salaryTo).toBe(187000);    // 2000 * 93.5
        });

        it('should set "Зарплата не указана" when salary is null', async () => {
            http.get
                .mockReset()
                .mockReturnValueOnce(of(mockHhSearchResponse))
                .mockReturnValueOnce(of({
                    data: { ...mockHhDetailResponse.data, salary: null },
                }));

            await service.searchAndSave('Frontend', 1);

            const upsertArg = prisma.vacancy.upsert.mock.calls[0][0];
            expect(upsertArg.create.salaryLabel).toBe('Зарплата не указана');
        });

        it('should strip HTML tags from description', async () => {
            await service.searchAndSave('Frontend', 1);

            const upsertArg = prisma.vacancy.upsert.mock.calls[0][0];
            expect(upsertArg.create.descriptionPreview).not.toContain('<p>');
            expect(upsertArg.create.descriptionPreview).toContain('Ищем опытного разработчика');
        });

        it('should return empty array and throw error when HH search fails', async () => {
            http.get.mockReset().mockReturnValueOnce(
                throwError(() => new Error('Network Error'))
            );

            await expect(service.searchAndSave('Frontend', 1)).rejects.toThrow(
                'HH API недоступен: Network Error',
            );
        });

        it('should skip vacancy if detail API fails and continue with others', async () => {
            const twoItems = {
                data: {
                    items: [
                        { id: '11111', name: 'Dev 1', employer: { name: 'Co1' }, area: { name: 'Msk' } },
                        { id: '22222', name: 'Dev 2', employer: { name: 'Co2' }, area: { name: 'Spb' } },
                    ],
                },
            };

            http.get
                .mockReset()
                .mockReturnValueOnce(of(twoItems))
                .mockReturnValueOnce(throwError(() => new Error('timeout')))   // 1st fails
                .mockReturnValueOnce(of(mockHhDetailResponse));                // 2nd succeeds

            prisma.vacancy.upsert.mockResolvedValue(mockVacancy);

            const result = await service.searchAndSave('Developer', 2);

            // Only 1 saved (second item)
            expect(result).toHaveLength(1);
            expect(prisma.vacancy.upsert).toHaveBeenCalledTimes(1);
        });

        it('should cap per_page at 20 regardless of count param', async () => {
            await service.searchAndSave('Developer', 50);

            const searchCall = http.get.mock.calls[0];
            expect(searchCall[1].params.per_page).toBe(20);
        });
    });
});
