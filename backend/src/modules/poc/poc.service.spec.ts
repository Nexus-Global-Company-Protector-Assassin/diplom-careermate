import { Test, TestingModule } from '@nestjs/testing';
import { PocService } from './poc.service';
import { PrismaService } from '../../database/prisma.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';

// ──────────────────────────────── fixtures ────────────────────────────────────
const DEMO_EMAIL = 'demo_poc_user@careermate.ai';

const mockUser = {
    id: 'user-uuid-demo',
    email: DEMO_EMAIL,
    passwordHash: null,
    profile: null,
};

const mockProfile = {
    id: 'profile-uuid-demo',
    userId: 'user-uuid-demo',
    fullName: 'Тест Пользователь',
    desiredPosition: 'React Developer',
    skills: ['React'],
};

const mockAnalysisResponse = {
    score: 82,
    level: 'Middle',
    strengths: ['Отличное знание React'],
    weaknesses: ['Слабый DevOps'],
    skillGaps: ['Docker'],
    recommendations: ['Изучить Docker'],
};

const mockAnalysisResult = {
    id: 'analysis-uuid-1',
    profileId: 'profile-uuid-demo',
    content: { ...mockAnalysisResponse, vacancies: [] },
    createdAt: new Date(),
};

const mockRunDto = {
    fullName: 'Тест Пользователь',
    phone: '+79990000000',
    location: 'Москва',
    desiredPosition: 'React Developer',
    experienceYears: 3,
    skills: ['React', 'TypeScript'],
    education: [],
    workExperience: [],
    aboutMe: 'Опытный разработчик',
};

// ─────────────────────────────── mock factories ───────────────────────────────
const makePrisma = () => ({
    user: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
    profile: {
        upsert: jest.fn(),
    },
    analysisResult: {
        create: jest.fn(),
        findFirst: jest.fn(),
    },
});

const makeHttp = () => ({
    post: jest.fn(),
    get: jest.fn(),
});

// ═════════════════════════════════════════════════════════════════════════════
describe('PocService', () => {
    let service: PocService;
    let prisma: ReturnType<typeof makePrisma>;
    let http: ReturnType<typeof makeHttp>;

    beforeEach(async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        prisma = makePrisma();
        http = makeHttp();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PocService,
                { provide: PrismaService, useValue: prisma },
                { provide: HttpService, useValue: http },
            ],
        }).compile();

        service = module.get<PocService>(PocService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    // ──────────────────────────────── runAnalysis ─────────────────────────────
    describe('runAnalysis', () => {
        beforeEach(() => {
            // Default happy-path mocks
            prisma.user.findUnique.mockResolvedValue(mockUser);
            prisma.profile.upsert.mockResolvedValue(mockProfile);
            prisma.analysisResult.create.mockResolvedValue(mockAnalysisResult);
            // mock returns { data: { data: agentPayload } } because service does response.data.data
            http.post.mockReturnValue(of({ data: { data: mockAnalysisResponse } }));
            // Python HH parser — unavailable by default (skipped gracefully)
            http.get.mockReturnValue(throwError(() => new Error('Connection refused')));
        });

        it('should use existing demo user when found', async () => {
            await service.runAnalysis(mockRunDto as any);

            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: DEMO_EMAIL },
            });
            expect(prisma.user.create).not.toHaveBeenCalled();
        });

        it('should create demo user when not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            prisma.user.create.mockResolvedValue(mockUser);

            await service.runAnalysis(mockRunDto as any);

            expect(prisma.user.create).toHaveBeenCalledWith({
                data: { email: DEMO_EMAIL },
            });
        });

        it('should upsert profile with DTO data', async () => {
            await service.runAnalysis(mockRunDto as any);

            expect(prisma.profile.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: mockUser.id },
                    create: expect.objectContaining({
                        fullName: 'Тест Пользователь',
                        desiredPosition: 'React Developer',
                        experienceYears: 3,
                    }),
                }),
            );
        });

        it('should call Agent service with /ai/poc/run and profileData', async () => {
            await service.runAnalysis(mockRunDto as any);

            expect(http.post).toHaveBeenCalledWith(
                expect.stringContaining('/ai/poc/run'),
                expect.objectContaining({ profileData: mockProfile }),
            );
        });

        it('should save analysis result to DB with agent response', async () => {
            await service.runAnalysis(mockRunDto as any);

            expect(prisma.analysisResult.create).toHaveBeenCalledWith({
                data: {
                    profileId: mockProfile.id,
                    content: mockAnalysisResponse,
                },
            });
        });

        it('should return the saved analysis result', async () => {
            const result = await service.runAnalysis(mockRunDto as any);
            expect(result).toEqual(mockAnalysisResult);
        });

        it('should throw error when Agent service is unavailable', async () => {
            http.post.mockReturnValue(throwError(() => new Error('ECONNREFUSED')));

            await expect(service.runAnalysis(mockRunDto as any)).rejects.toThrow(
                'Failed to run analysis',
            );

            // analysisResult should NOT be saved
            expect(prisma.analysisResult.create).not.toHaveBeenCalled();
        });
    });

    // ────────────────────────────── getLatestResult ───────────────────────────
    describe('getLatestResult', () => {
        it('should return latest analysis result for demo user', async () => {
            prisma.user.findUnique.mockResolvedValue({
                ...mockUser,
                profile: mockProfile,
            });
            prisma.analysisResult.findFirst.mockResolvedValue(mockAnalysisResult);

            const result = await service.getLatestResult();

            expect(result).toEqual(mockAnalysisResult);
            expect(prisma.analysisResult.findFirst).toHaveBeenCalledWith({
                where: { profileId: mockProfile.id },
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should return { content: null } when demo user not found', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const result = await service.getLatestResult();
            expect(result).toEqual({ content: null });
        });

        it('should return { content: null } when user has no profile', async () => {
            prisma.user.findUnique.mockResolvedValue({ ...mockUser, profile: null });

            const result = await service.getLatestResult();
            expect(result).toEqual({ content: null });
        });

        it('should return { content: null } when no analysis results in DB', async () => {
            prisma.user.findUnique.mockResolvedValue({
                ...mockUser,
                profile: mockProfile,
            });
            prisma.analysisResult.findFirst.mockResolvedValue(null);

            const result = await service.getLatestResult();
            expect(result).toEqual({ content: null });
        });
    });
});
