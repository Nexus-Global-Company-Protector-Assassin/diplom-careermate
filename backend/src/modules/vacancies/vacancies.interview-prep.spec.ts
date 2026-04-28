import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AiService } from '../ai/ai.service';
import { SkillsService } from '../skills/skills.service';
import { QuestionGenService } from '../interviews/question-gen/question-gen.service';
import { EmbeddingsService } from '../ai/embeddings/embeddings.service';
import { VacanciesService } from './vacancies.service';
import { UserPreferencesService } from './user-preferences.service';
import { RedisService } from '../redis/redis.service';
import { MlRankingService } from '../ml/ml-ranking.service';
import { QuotaService } from '../quota/quota.service';

describe('VacanciesService interviewPrep', () => {
    let service: VacanciesService;
    let prisma: {
        vacancy: { findUnique: jest.Mock };
        resume: { findUnique: jest.Mock; findFirst: jest.Mock };
    };
    let questionGenService: { generateForVacancy: jest.Mock };

    beforeEach(async () => {
        prisma = {
            vacancy: {
                findUnique: jest.fn(),
            },
            resume: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
            },
        };

        questionGenService = {
            generateForVacancy: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VacanciesService,
                { provide: HttpService, useValue: { get: jest.fn() } },
                { provide: PrismaService, useValue: prisma },
                { provide: ConfigService, useValue: { get: jest.fn() } },
                { provide: AiService, useValue: { evaluateVacancyInDepth: jest.fn(), generateCoverLetter: jest.fn() } },
                { provide: SkillsService, useValue: { extractFromText: jest.fn(), syncVacancySkills: jest.fn() } },
                { provide: EmbeddingsService, useValue: { indexVacancy: jest.fn(), searchSimilar: jest.fn().mockResolvedValue([]) } },
                { provide: QuestionGenService, useValue: questionGenService },
                { provide: UserPreferencesService, useValue: { compute: jest.fn(), extractVacancyFeatures: jest.fn(), computePersonalScore: jest.fn().mockReturnValue(0), invalidateCache: jest.fn() } },
                { provide: RedisService, useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() } },
                { provide: MlRankingService, useValue: { isEnabled: jest.fn().mockReturnValue(false), isShadowMode: jest.fn().mockReturnValue(true), rank: jest.fn().mockResolvedValue(new Map()) } },
                { provide: QuotaService, useValue: { assertAiCall: jest.fn().mockResolvedValue(undefined), commitAiCall: jest.fn().mockResolvedValue(undefined) } },
            ],
        }).compile();

        service = module.get<VacanciesService>(VacanciesService);
    });

    it('should delegate interview preparation to QuestionGenService', async () => {
        const vacancy = {
            id: 'vacancy-1',
            title: 'Backend Developer',
            employer: 'CareerMate',
            descriptionPreview: 'Build APIs',
            skills: ['Node.js'],
            experience: '3+ years',
            schedule: 'Remote',
        };
        const resume = {
            id: 'resume-1',
            content: 'Built integrations and APIs',
        };
        const expected = {
            questions: [],
            candidate_questions: ['How is feedback organized?'],
            tips: 'Prepare metrics',
        };

        prisma.vacancy.findUnique.mockResolvedValue(vacancy);
        prisma.resume.findFirst.mockResolvedValue(resume);
        questionGenService.generateForVacancy.mockResolvedValue(expected);

        const result = await service.interviewPrep('vacancy-1');

        expect(questionGenService.generateForVacancy).toHaveBeenCalledWith(vacancy, resume.content);
        expect(result).toEqual(expected);
    });

    it('should return noResume when no resume is found', async () => {
        prisma.vacancy.findUnique.mockResolvedValue({
            id: 'vacancy-1',
            title: 'Backend Developer',
        });
        prisma.resume.findFirst.mockResolvedValue(null);

        await expect(service.interviewPrep('vacancy-1')).resolves.toEqual({ noResume: true });
        expect(questionGenService.generateForVacancy).not.toHaveBeenCalled();
    });
});
