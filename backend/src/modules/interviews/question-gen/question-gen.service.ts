import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';

export interface StarAnswer {
    situation: string;
    task: string;
    action: string;
    result: string;
    reflection: string;
}

export interface GeneratedQuestion {
    question: string;
    category: 'behavioral' | 'technical' | 'situational';
    star: StarAnswer;
}

export interface QuestionGenResult {
    questions: GeneratedQuestion[];
    candidate_questions: string[];
    tips: string;
}

export interface QuestionGenVacancy {
    title?: string;
    employer?: string;
    descriptionPreview?: string;
    skills?: string[];
    experience?: string;
    schedule?: string;
}

@Injectable()
export class QuestionGenService {
    private readonly logger = new Logger(QuestionGenService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {}

    async generate(dto: GenerateQuestionsDto): Promise<QuestionGenResult> {
        const vacancy: QuestionGenVacancy = {
            title: dto.vacancyTitle ?? '',
            employer: dto.vacancyEmployer ?? '',
            descriptionPreview: dto.vacancyDescription ?? '',
            skills: dto.vacancySkills ?? [],
            experience: dto.vacancyExperience ?? '',
            schedule: dto.vacancySchedule ?? '',
        };

        return this.generateForVacancy(vacancy, dto.resumeContent ?? '');
    }

    async generateForVacancy(
        vacancy: QuestionGenVacancy,
        resumeContent: string,
    ): Promise<QuestionGenResult> {
        this.logger.log(
            `Generating interview questions for: ${vacancy.title ?? 'unknown position'} @ ${vacancy.employer ?? 'unknown company'}`,
        );

        const apiKey = this.configService.get<string>('LLM_API_KEY');
        if (!apiKey) {
            this.logger.warn('LLM_API_KEY is not set. Using mocked interview prep.');
            return this.getMockResult();
        }

        const baseUrl = this.configService.get<string>('LLM_API_BASE_URL', 'https://api.openai.com/v1');
        const modelName = this.configService.get<string>('LLM_MODEL_NAME_SMART', 'google/gemini-3.1-flash-lite-preview');

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${baseUrl}/chat/completions`,
                    {
                        model: modelName,
                        messages: [
                            {
                                role: 'system',
                                content: 'Ты — эксперт по подготовке к собеседованиям платформы CareerMate. Генерируй структурированные ответы по методу STAR+R. Отвечай только валидным JSON без markdown и комментариев.'
                            },
                            {
                                role: 'user',
                                content: this.buildPrompt(vacancy, resumeContent),
                            },
                        ],
                        max_tokens: 3000,
                        temperature: 0.3,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            );

            const content = response.data.choices[0]?.message?.content || '{}';
            return this.parseResult(content);
        } catch (error: any) {
            this.logger.error(`LLM Error generating interview prep: ${error.message}`);
            return {
                questions: [],
                candidate_questions: [],
                tips: 'Ошибка генерации. Попробуйте позже.',
            };
        }
    }

    private buildPrompt(vacancy: QuestionGenVacancy, resumeContent: string): string {
        const vacancyText = [
            `Вакансия: ${vacancy.title ?? ''} в ${vacancy.employer ?? ''}`,
            `Описание: ${vacancy.descriptionPreview ?? ''}`,
            `Навыки: ${JSON.stringify(vacancy.skills ?? [])}`,
            `Опыт: ${vacancy.experience ?? ''}`,
            `Формат: ${vacancy.schedule ?? ''}`,
        ].join('. ');

        return `Ты — эксперт по подготовке к собеседованиям. На основе резюме кандидата и описания вакансии, сгенерируй банк историй для собеседования по методу STAR+R.

Резюме кандидата:
${resumeContent}

${vacancyText}

ЗАДАЧА:
1. Предскажи 5 наиболее вероятных вопросов, которые зададут на собеседовании для данной позиции.
2. Для каждого вопроса составь готовый ответ по методу STAR+R:
   - S (Situation) — описание ситуации из опыта кандидата
   - T (Task) — задача, которая стояла
   - A (Action) — конкретные действия кандидата
   - R (Result) — результат с цифрами или измеримым эффектом
   - R+ (Reflection) — что кандидат вынес из этого опыта
3. Добавь 3 вопроса, которые кандидат должен задать работодателю.
4. В tips дай короткий список практических советов, как подать этот опыт на интервью.

Верни строго JSON такого вида:
{
  "questions": [
    {
      "question": "Вопрос интервьюера",
      "category": "behavioral|technical|situational",
      "star": {
        "situation": "Описание ситуации",
        "task": "Задача",
        "action": "Действия",
        "result": "Результат",
        "reflection": "Вывод"
      }
    }
  ],
  "candidate_questions": [
    "Вопрос работодателю 1",
    "Вопрос работодателю 2",
    "Вопрос работодателю 3"
  ],
  "tips": "Практические советы"
}`;
    }

    private parseResult(content: string): QuestionGenResult {
        let cleanContent = content
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/gi, '')
            .trim();

        const startIndex = cleanContent.indexOf('{');
        const endIndex = cleanContent.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
            cleanContent = cleanContent.substring(startIndex, endIndex + 1);
        }

        try {
            const parsed = JSON.parse(cleanContent);
            return this.normalizeResult(parsed);
        } catch (error: any) {
            this.logger.error(`Failed to parse interview prep JSON: ${error.message}`);
            return {
                questions: [],
                candidate_questions: [],
                tips: 'Не удалось обработать ответ модели. Попробуйте позже.',
            };
        }
    }

    private normalizeResult(result: any): QuestionGenResult {
        const questions = Array.isArray(result?.questions)
            ? result.questions
                .map((question: any): GeneratedQuestion | null => {
                    const questionText = typeof question?.question === 'string' ? question.question.trim() : '';
                    if (!questionText) {
                        return null;
                    }

                    const category = this.normalizeCategory(question?.category);
                    const star = {
                        situation: this.normalizeText(question?.star?.situation),
                        task: this.normalizeText(question?.star?.task),
                        action: this.normalizeText(question?.star?.action),
                        result: this.normalizeText(question?.star?.result),
                        reflection: this.normalizeText(question?.star?.reflection),
                    };

                    return {
                        question: questionText,
                        category,
                        star,
                    };
                })
                .filter((question): question is GeneratedQuestion => question !== null)
            : [];

        const candidateQuestions = Array.isArray(result?.candidate_questions)
            ? result.candidate_questions
                .filter((question: unknown): question is string => typeof question === 'string')
                .map((question: string) => question.trim())
                .filter(Boolean)
            : [];

        return {
            questions,
            candidate_questions: candidateQuestions,
            tips: this.normalizeText(result?.tips),
        };
    }

    private normalizeCategory(category: unknown): GeneratedQuestion['category'] {
        return category === 'technical' || category === 'situational'
            ? category
            : 'behavioral';
    }

    private normalizeText(value: unknown): string {
        return typeof value === 'string' ? value.trim() : '';
    }

    private getMockResult(): QuestionGenResult {
        return {
            questions: [
                {
                    question: 'Расскажите о сложном проекте, в котором вам пришлось быстро разобраться в новой предметной области.',
                    category: 'behavioral',
                    star: {
                        situation: 'В одном из проектов мне досталась задача в незнакомой доменной области с жестким сроком запуска.',
                        task: 'Нужно было быстро изучить бизнес-контекст, уточнить требования и выпустить решение без просадки по качеству.',
                        action: 'Я собрал требования у стейкхолдеров, разбил задачу на этапы, согласовал промежуточные демо и заложил время на валидацию.',
                        result: 'Функциональность была выпущена в срок, а количество правок после релиза оказалось минимальным.',
                        reflection: 'Этот опыт закрепил у меня привычку быстро выстраивать контекст и проверять допущения до начала реализации.',
                    },
                },
            ],
            candidate_questions: [
                'Какие задачи будут приоритетными в первые 2-3 месяца на этой роли?',
                'Как в команде устроены code review и обратная связь?',
                'По каким критериям вы оцениваете успешность человека на этой позиции?',
            ],
            tips: 'Сфокусируйтесь на историях с измеримым эффектом, не пересказывайте резюме целиком и заранее подготовьте 2-3 сильных кейса под требования вакансии.',
        };
    }
}
