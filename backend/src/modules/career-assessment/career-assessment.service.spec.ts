import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CareerAssessmentService } from './career-assessment.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AiService } from '../ai/ai.service';
import { QuotaService } from '../quota/quota.service';

const mockProfile = {
    id: 'profile-uuid-1',
    userId: 'user-uuid-1',
    fullName: 'Иван Иванов',
    desiredPosition: 'Frontend Developer',
    experienceYears: 3,
    skills: { technical: ['React', 'TypeScript'], professional: [] },
    aboutMe: 'Разработчик',
    careerGoals: 'Стать тимлидом',
    workFormatPreference: 'remote',
};

const mockResult = {
    personalitySummary: 'Test summary',
    dominantTraits: ['Аналитический', 'Технический'],
    topPaths: [
        { rank: 1, role: 'Backend Developer', domain: 'it', matchScore: 92, matchReason: 'test', roadmap: [], currentSkillsMatch: [], skillsToLearn: [], salaryRange: '150k', pros: [], cons: [] },
        { rank: 2, role: 'Data Scientist', domain: 'it', matchScore: 85, matchReason: 'test', roadmap: [], currentSkillsMatch: [], skillsToLearn: [], salaryRange: '180k', pros: [], cons: [] },
        { rank: 3, role: 'Solutions Architect', domain: 'it', matchScore: 79, matchReason: 'test', roadmap: [], currentSkillsMatch: [], skillsToLearn: [], salaryRange: '250k', pros: [], cons: [] },
    ],
};

const mockDto = {
    domain: 'it',
    answers: [{ questionId: 'u-1', optionIndex: 0 }],
    dimensionScores: { analytical: 4, technical: 5, social: 1, creative: 2, leadership: 2, structured: 4 },
    topPathRoles: ['Backend Developer', 'Data Scientist', 'Solutions Architect', 'Full-Stack Dev', 'DevOps/SRE'],
};

describe('CareerAssessmentService', () => {
    let service: CareerAssessmentService;
    let mockPrisma: any;
    let mockRedis: any;
    let mockAiService: any;

    beforeEach(async () => {
        mockPrisma = {
            profile: { findFirst: jest.fn().mockResolvedValue(mockProfile) },
            careerAssessment: {
                create: jest.fn().mockResolvedValue({ id: 'assessment-1', ...mockDto, result: mockResult, createdAt: new Date() }),
                findFirst: jest.fn().mockResolvedValue(null),
            },
        };

        mockRedis = {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue('OK'),
        };

        mockAiService = {
            generateCareerPathAnalysis: jest.fn().mockResolvedValue(mockResult),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CareerAssessmentService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: RedisService, useValue: mockRedis },
                { provide: AiService, useValue: mockAiService },
                { provide: QuotaService, useValue: { assertAiCall: jest.fn().mockResolvedValue(undefined), commitAiCall: jest.fn().mockResolvedValue(undefined), assertQuizLimit: jest.fn().mockResolvedValue(undefined) } },
            ],
        }).compile();

        service = module.get<CareerAssessmentService>(CareerAssessmentService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should throw NotFoundException when profile not found', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue(null);
        await expect(service.submitAssessment('user-no-profile', mockDto)).rejects.toThrow(NotFoundException);
    });

    it('should call AI service and store result in DB', async () => {
        await service.submitAssessment('user-uuid-1', mockDto);
        expect(mockAiService.generateCareerPathAnalysis).toHaveBeenCalledTimes(1);
        expect(mockPrisma.careerAssessment.create).toHaveBeenCalledTimes(1);
        expect(mockPrisma.careerAssessment.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ profileId: 'profile-uuid-1', domain: 'it' }),
            }),
        );
    });

    it('should return cached result and skip AI call', async () => {
        mockRedis.get.mockResolvedValue(JSON.stringify(mockResult));
        await service.submitAssessment('user-uuid-1', mockDto);
        expect(mockAiService.generateCareerPathAnalysis).not.toHaveBeenCalled();
        expect(mockPrisma.careerAssessment.create).toHaveBeenCalledTimes(1);
    });

    it('should return null from getLatestAssessment when no profile', async () => {
        mockPrisma.profile.findFirst.mockResolvedValue(null);
        const result = await service.getLatestAssessment('user-no-profile');
        expect(result).toBeNull();
    });

    it('should return null when no assessments exist for profile', async () => {
        mockPrisma.careerAssessment.findFirst.mockResolvedValue(null);
        const result = await service.getLatestAssessment('user-uuid-1');
        expect(result).toBeNull();
    });

    it('should return latest assessment ordered by createdAt desc', async () => {
        const mockAssessment = { id: 'a1', result: mockResult, createdAt: new Date() };
        mockPrisma.careerAssessment.findFirst.mockResolvedValue(mockAssessment);
        const result = await service.getLatestAssessment('user-uuid-1');
        expect(result).toEqual(mockAssessment);
        expect(mockPrisma.careerAssessment.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
        );
    });
});
