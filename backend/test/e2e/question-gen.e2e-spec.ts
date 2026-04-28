import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as request from 'supertest';
import { QuestionGenController } from '../../src/modules/interviews/question-gen/question-gen.controller';
import { GenerateQuestionsDto } from '../../src/modules/interviews/question-gen/dto/generate-questions.dto';
import { QuestionGenService } from '../../src/modules/interviews/question-gen/question-gen.service';

describe('QuestionGenController (e2e)', () => {
    let app: INestApplication;
    let questionGenService: { generate: jest.Mock };

    beforeAll(async () => {
        questionGenService = {
            generate: jest.fn(),
        };

        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [QuestionGenController],
            providers: [
                {
                    provide: QuestionGenService,
                    useValue: questionGenService,
                },
            ],
        })
            .overrideGuard(ThrottlerGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api/v1');
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                transform: true,
                forbidNonWhitelisted: true,
            }),
        );

        await app.init();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /api/v1/interviews/question-gen returns generated questions', async () => {
        const payload = {
            vacancyTitle: 'Backend Developer',
            vacancyEmployer: 'CareerMate',
            vacancyDescription: 'Build APIs and integrations',
            vacancySkills: ['Node.js', 'PostgreSQL'],
            vacancyExperience: '3+ years',
            vacancySchedule: 'Remote',
            resumeContent: 'Worked on API integrations',
        };

        const expected = {
            questions: [
                {
                    question: 'Расскажите про сложную интеграцию',
                    category: 'technical',
                    star: {
                        situation: 'Нужно было объединить несколько внешних API.',
                        task: 'Стабилизировать обмен данными.',
                        action: 'Добавил ретраи, идемпотентность и мониторинг.',
                        result: 'Снизили число ошибок на 40%.',
                        reflection: 'Научился заранее проектировать отказоустойчивость.',
                    },
                },
            ],
            candidate_questions: ['Как команда измеряет качество backend-решений?'],
            tips: 'Подготовьте цифры и короткие примеры по STAR+R.',
        };

        questionGenService.generate.mockResolvedValue(expected);

        await request(app.getHttpServer())
            .post('/api/v1/interviews/question-gen')
            .send(payload)
            .expect(201)
            .expect(expected);

        expect(questionGenService.generate).toHaveBeenCalledWith(
            expect.objectContaining(payload),
        );
        expect(questionGenService.generate.mock.calls[0][0]).toBeInstanceOf(GenerateQuestionsDto);
    });

    it('POST /api/v1/interviews/question-gen rejects invalid payload', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/v1/interviews/question-gen')
            .send({
                vacancyTitle: 'Backend Developer',
                vacancySkills: ['Node.js', 123],
                unexpected: true,
            })
            .expect(400);

        expect(response.body.message).toEqual(
            expect.arrayContaining([
                'property unexpected should not exist',
                'each value in vacancySkills must be a string',
            ]),
        );
        expect(questionGenService.generate).not.toHaveBeenCalled();
    });
});
