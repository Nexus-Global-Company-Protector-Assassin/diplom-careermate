import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { QuestionGenService } from './question-gen.service';

describe('QuestionGenService', () => {
    let service: QuestionGenService;
    let httpService: { post: jest.Mock };
    let configService: { get: jest.Mock };

    beforeEach(async () => {
        httpService = {
            post: jest.fn(),
        };

        configService = {
            get: jest.fn((key: string, defaultValue?: string) => {
                const values: Record<string, string> = {
                    LLM_API_KEY: 'test-api-key',
                    LLM_API_BASE_URL: 'https://example.test/v1',
                    LLM_MODEL_NAME_SMART: 'test-model',
                };

                return values[key] ?? defaultValue;
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuestionGenService,
                { provide: HttpService, useValue: httpService },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        service = module.get<QuestionGenService>(QuestionGenService);
    });

    it('should return mocked result when API key is missing', async () => {
        configService.get.mockImplementation((key: string, defaultValue?: string) => {
            if (key === 'LLM_API_KEY') {
                return '';
            }
            return defaultValue;
        });

        const result = await service.generateForVacancy(
            { title: 'Backend Developer', employer: 'CareerMate' },
            'Resume content',
        );

        expect(result.questions).toHaveLength(1);
        expect(result.candidate_questions).toHaveLength(3);
        expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should call LLM and normalize wrapped JSON response', async () => {
        httpService.post.mockReturnValue(
            of({
                data: {
                    choices: [
                        {
                            message: {
                                content: '```json\n{"questions":[{"question":"Расскажите про самый сложный релиз","category":"technical","star":{"situation":"S","task":"T","action":"A","result":"R","reflection":"RF"}}],"candidate_questions":["Какие ожидания от первых месяцев?"],"tips":"Подготовьте цифры"}\n```',
                            },
                        },
                    ],
                },
            }),
        );

        const result = await service.generate({
            vacancyTitle: 'Backend Developer',
            vacancyEmployer: 'CareerMate',
            vacancyDescription: 'Build APIs and integrations',
            vacancySkills: ['Node.js', 'PostgreSQL'],
            vacancyExperience: '3+ years',
            vacancySchedule: 'Remote',
            resumeContent: 'Worked on API integrations',
        });

        expect(httpService.post).toHaveBeenCalledWith(
            'https://example.test/v1/chat/completions',
            expect.objectContaining({
                model: 'test-model',
                max_tokens: 3000,
            }),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer test-api-key',
                }),
            }),
        );
        expect(result).toEqual({
            questions: [
                {
                    question: 'Расскажите про самый сложный релиз',
                    category: 'technical',
                    star: {
                        situation: 'S',
                        task: 'T',
                        action: 'A',
                        result: 'R',
                        reflection: 'RF',
                    },
                },
            ],
            candidate_questions: ['Какие ожидания от первых месяцев?'],
            tips: 'Подготовьте цифры',
        });
    });

    it('should fall back to behavioral category and safe empty values on malformed payload', async () => {
        httpService.post.mockReturnValue(
            of({
                data: {
                    choices: [
                        {
                            message: {
                                content: '{"questions":[{"question":"Опишите конфликт в команде","category":"weird","star":{"task":"Уладить конфликт"}}],"candidate_questions":[123,"Как устроен фидбек?"],"tips":null}',
                            },
                        },
                    ],
                },
            }),
        );

        const result = await service.generateForVacancy(
            { title: 'Team Lead', employer: 'CareerMate' },
            'Resume content',
        );

        expect(result).toEqual({
            questions: [
                {
                    question: 'Опишите конфликт в команде',
                    category: 'behavioral',
                    star: {
                        situation: '',
                        task: 'Уладить конфликт',
                        action: '',
                        result: '',
                        reflection: '',
                    },
                },
            ],
            candidate_questions: ['Как устроен фидбек?'],
            tips: '',
        });
    });
});
