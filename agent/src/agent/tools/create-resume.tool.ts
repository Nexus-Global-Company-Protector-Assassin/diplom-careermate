import { Injectable, Logger } from '@nestjs/common';
import { LlmGatewayService } from '../llm/llm-gateway.service';
import {
    ResumeQuestionsResponseSchema,
    ResumeQuestionsResponse,
    CreatedResumeSchema,
    CreatedResume,
} from '../schemas/create-resume.schema';
import { ProfileData } from './analyze-profile.tool';

export interface QuestionAnswer {
    questionId: string;
    answer: string;
}

@Injectable()
export class CreateResumeTool {
    private readonly logger = new Logger(CreateResumeTool.name);

    constructor(private readonly llmGateway: LlmGatewayService) {}

    /**
     * Шаг 1: Анализирует профиль и генерирует наводящие вопросы
     */
    async generateQuestions(profileData: ProfileData): Promise<ResumeQuestionsResponse> {
        this.logger.log('[create_resume] Generating questions for profile');

        const profileContext = this.buildProfileContext(profileData);

        const result = await this.llmGateway.generateJson<ResumeQuestionsResponse>(
            [
                {
                    role: 'system',
                    content: `Ты опытный HR-консультант. Твоя задача — проанализировать данные профиля кандидата и определить, какой информации не хватает для создания сильного, профессионального резюме.

═══ ПРАВИЛА ═══
1. Генерируй от 3 до 7 наводящих вопросов — ТОЛЬКО по недостающим данным.
2. Если в профиле уже заполнены навыки, опыт, образование — НЕ спрашивай об этом повторно.
3. Сфокусируйся на: конкретных достижениях, метриках, ключевых проектах, уникальных преимуществах.
4. Вопросы должны быть КОНКРЕТНЫМИ, а не общими. Вместо "Расскажите об опыте" → "Укажите 2-3 ключевых достижения на позиции {позиция} в {компания}".
5. Каждый вопрос должен содержать подсказку (hint) с примером ответа.
6. Пиши на русском языке.

═══ КАТЕГОРИИ ВОПРОСОВ ═══
- experience: детали опыта работы, обязанности, достижения
- skills: технические и soft-навыки, уровни владения
- education: курсы, сертификаты, доп. образование
- personal: контакты, ссылки на портфолио, языки
- achievements: конкретные цифры, метрики, результаты работы`,
                },
                {
                    role: 'user',
                    content: `Проанализируй профиль кандидата и сгенерируй наводящие вопросы для создания резюме.

${profileContext}

Верни JSON с оценкой текущего профиля и списком вопросов.`,
                },
            ],
            ResumeQuestionsResponseSchema,
            { temperature: 0.4, maxTokens: 4096, timeoutMs: 60000 },
        );

        this.logger.log(
            `[create_resume] Generated ${result.data.questions.length} questions, missing areas: ${result.data.missingDataAreas.join(', ')}`,
        );

        return result.data;
    }

    /**
     * Шаг 2: Генерирует полное резюме на основе профиля + ответов на вопросы
     */
    async generateResume(
        profileData: ProfileData,
        answers: QuestionAnswer[],
    ): Promise<CreatedResume> {
        this.logger.log(`[create_resume] Generating resume with ${answers.length} answers`);

        const profileContext = this.buildProfileContext(profileData);
        const answersContext = this.buildAnswersContext(answers);

        const result = await this.llmGateway.generateJson<CreatedResume>(
            [
                {
                    role: 'system',
                    content: `Ты профессиональный составитель резюме с 15+ годами опыта.
Твоя задача — создать ПОЛНОЕ, ПРОФЕССИОНАЛЬНОЕ резюме в формате Markdown на основе данных профиля и дополнительных ответов кандидата.

═══ ПРАВИЛА СОСТАВЛЕНИЯ ═══
1. Используй ВСЕ данные из профиля + ответы на вопросы.
2. Структура резюме:
   - Заголовок (ФИО)
   - Контакты (телефон, email, Telegram, GitHub — что есть)
   - Желаемая позиция / Professional Summary (3-4 предложения)
   - Навыки (технические и профессиональные, разделённые)
   - Опыт работы (с достижениями, в обратной хронологии)
   - Образование
   - Дополнительно (языки, сертификаты, проекты — если есть)
3. Используй Action Verbs: "Разработал", "Оптимизировал", "Внедрил", "Увеличил".
4. Добавляй конкретные метрики и цифры из ответов кандидата.
5. НИКОГДА не выдумывай данные, которых нет в профиле или ответах.
6. Резюме должно быть на русском языке.
7. Формат — чистый Markdown с заголовками, списками, разделителями.

═══ ФОРМАТ MARKDOWN ═══
Используй: # для имени, ## для разделов, ### для подразделов, - для списков, **жирный** для акцентов.`,
                },
                {
                    role: 'user',
                    content: `Создай профессиональное резюме на основе данных профиля и ответов кандидата.

${profileContext}

${answersContext}

Сгенерируй полное резюме в Markdown формате. Также дай 2-4 совета по дальнейшему улучшению.`,
                },
            ],
            CreatedResumeSchema,
            { temperature: 0.3, maxTokens: 8192, timeoutMs: 120000 },
        );

        this.logger.log(`[create_resume] Resume generated: ${result.data.title}`);

        return result.data;
    }

    private buildProfileContext(profile: ProfileData): string {
        const lines: string[] = ['═══ ДАННЫЕ ПРОФИЛЯ ═══'];

        if (profile.fullName) lines.push(`ФИО: ${profile.fullName}`);
        if (profile.desiredPosition) lines.push(`Желаемая позиция: ${profile.desiredPosition}`);
        if (profile.experienceYears !== undefined) lines.push(`Лет опыта: ${profile.experienceYears}`);
        if (profile.aboutMe) lines.push(`Контакты и доп. информация: ${profile.aboutMe}`);

        if (profile.skills?.length) {
            lines.push(`\nНавыки: ${profile.skills.join(', ')}`);
        }

        if (profile.workExperience?.length) {
            lines.push('\nОпыт работы:');
            for (const exp of profile.workExperience) {
                lines.push(`  - ${exp.position || 'Позиция не указана'} в ${exp.company || 'Не указано'}`);
                if (exp.duration) lines.push(`    Период: ${exp.duration}`);
                if (exp.description) lines.push(`    Описание: ${exp.description}`);
            }
        }

        if (profile.education?.length) {
            lines.push('\nОбразование:');
            for (const edu of profile.education) {
                lines.push(`  - ${edu.degree || 'Направление не указано'}, ${edu.institution || 'Не указано'}`);
            }
        }

        return lines.join('\n');
    }

    private buildAnswersContext(answers: QuestionAnswer[]): string {
        if (!answers.length) return '';

        const lines: string[] = ['═══ ОТВЕТЫ КАНДИДАТА ═══'];
        for (const a of answers) {
            if (a.answer.trim()) {
                lines.push(`[${a.questionId}]: ${a.answer}`);
            }
        }
        return lines.join('\n');
    }
}
