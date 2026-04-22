import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { LlmProviderService } from './providers/llm-provider.service';

const makeConfig = () => ({ get: jest.fn().mockReturnValue(null) });
const makePrisma = () => ({ profile: { findFirst: jest.fn().mockResolvedValue(null) } });
const makeLlmProvider = () => ({ chat: null }); // null → mock mode

describe('AiService', () => {
    let service: AiService;

    beforeEach(async () => {
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AiService,
                { provide: ConfigService, useValue: makeConfig() },
                { provide: PrismaService, useValue: makePrisma() },
                { provide: LlmProviderService, useValue: makeLlmProvider() },
            ],
        }).compile();

        service = module.get<AiService>(AiService);
    });

    afterEach(() => jest.restoreAllMocks());

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generateResponse (mock mode — no LLM)', () => {
        it('should return resume advice when message contains "резюме"', async () => {
            const result = await service.generateResponse('хочу улучшить резюме');
            expect(result).toContain('Для улучшения резюме');
        });

        it('should return interview advice when message contains "собеседован"', async () => {
            const result = await service.generateResponse('как пройти собеседование');
            expect(result).toContain('Подготовка к собеседованию');
        });

        it('should return vacancy advice when message contains "вакансии"', async () => {
            const result = await service.generateResponse('ищу вакансии');
            expect(result).toContain('На основе вашего профиля');
        });

        it('should return vacancy advice when message contains "работ"', async () => {
            const result = await service.generateResponse('ищу работу');
            expect(result).toContain('На основе вашего профиля');
        });

        it('should return default response for unrecognized messages', async () => {
            const result = await service.generateResponse('что-то непонятное');
            expect(result).toContain('Интересный вопрос!');
        });

        it('should always return a non-empty string', async () => {
            const result = await service.generateResponse('любой текст');
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('evaluateVacancyInDepth (mock mode — no LLM)', () => {
        it('should return mock evaluation object with required fields', async () => {
            const vacancy = { title: 'Backend Dev', employer: 'Acme', createdAt: new Date().toISOString(), salaryLabel: '150k', experience: '3y', schedule: 'Remote', descriptionPreview: 'Build APIs', skills: ['Node.js'] };
            const result = await service.evaluateVacancyInDepth(vacancy, 'resume text', 'Backend', ['Docker']);
            expect(result).toHaveProperty('A_Summary');
            expect(result).toHaveProperty('grade');
            expect(result).toHaveProperty('score');
            expect(result.G_Legitimacy).toHaveProperty('verdict');
        });
    });

    describe('generateInterviewPrep (mock mode — no LLM)', () => {
        it('should return mock prep with questions array', async () => {
            const result = await service.generateInterviewPrep({ title: 'Dev', employer: 'Corp' }, 'my resume');
            expect(Array.isArray(result.questions)).toBe(true);
            expect(Array.isArray(result.candidate_questions)).toBe(true);
        });
    });

    describe('generateCoverLetter (mock mode — no LLM)', () => {
        it('should return mock cover letter object with coverLetter string', async () => {
            const result = await service.generateCoverLetter({ title: 'Dev', employer: 'Corp' }, 'my resume', 'ru');
            expect(typeof result.coverLetter).toBe('string');
            expect(result.coverLetter.length).toBeGreaterThan(0);
        });

        it('should return English mock when language is en', async () => {
            const result = await service.generateCoverLetter({ title: 'Dev', employer: 'Corp' }, 'my resume', 'en');
            expect(result.coverLetter).toContain('[Mock Mode');
        });
    });
});
