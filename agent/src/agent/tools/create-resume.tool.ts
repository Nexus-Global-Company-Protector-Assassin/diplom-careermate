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
                    content: `Ты опытный HR-консультант, обученный по стандартам Stanford Career Education.
Твоя задача — проанализировать профиль кандидата и определить, какой информации не хватает для создания резюме мирового класса.

КЛЮЧЕВОЕ ПОНИМАНИЕ: По стандарту Stanford CAR (Challenge → Action → Result),
каждое достижение в резюме ДОЛЖНО содержать измеримый результат.
Главная проблема большинства резюме — отсутствие конкретных метрик.

═══ ПРАВИЛА ═══
1. Генерируй от 3 до 7 наводящих вопросов — ТОЛЬКО по недостающим данным.
2. Если в профиле уже заполнены навыки, опыт, образование — НЕ спрашивай об этом повторно.
3. ПРИОРИТЕТ вопросов:
   a) Метрики достижений (%, $, мс, пользователи, команда) — это критично для CAR-метода
   b) Конкретные технологии и стек для каждой позиции
   c) Масштаб проектов (сколько пользователей, объём данных, размер команды)
   d) Контактные данные (LinkedIn, GitHub, Telegram)
   e) Сертификаты, pet-проекты, open-source
4. Вопросы должны быть КОНКРЕТНЫМИ. Вместо "Расскажите об опыте" → "Назовите 1-2 ключевых достижения в ${'{'}позиция{'}'} с измеримым результатом (например: 'увеличил скорость на 40%', 'обработал 1M записей/день')".
5. Каждый вопрос содержит hint с примером ответа по CAR-методу.
6. Пиши на русском языке.

═══ КАТЕГОРИИ ВОПРОСОВ ═══
- achievements: конкретные CAR-метрики для существующего опыта (НАИВЫСШИЙ ПРИОРИТЕТ)
- experience: детали стека, масштаб, контекст проектов
- skills: уровни владения (Junior/Middle/Senior), конкретные инструменты
- education: курсы, сертификаты, доп. образование, год окончания
- personal: LinkedIn, GitHub, Telegram, языки, портфолио`,
                },
                {
                    role: 'user',
                    content: `Проанализируй профиль кандидата и сгенерируй наводящие вопросы для создания резюме по стандарту Stanford CAR.

${profileContext}

ЗАДАЧА: Определи какие данные критически нужны для сильного резюме.
В первую очередь — метрики и цифры для достижений (CAR-метод).

Верни JSON с оценкой текущего профиля и списком вопросов.`,
                },
            ],
            ResumeQuestionsResponseSchema,
            { model: this.llmGateway.getModels().fast, temperature: 0.4, maxTokens: 4096, timeoutMs: 60000 },
        );

        const seen = new Set<string>();
        result.data.questions = result.data.questions.map((q, idx) => {
            const rawId = (q.id ?? '').toString().trim();
            const candidate = rawId && rawId !== 'undefined' ? rawId : `q${idx + 1}`;
            const uniqueId = seen.has(candidate) ? `q${idx + 1}` : candidate;
            seen.add(uniqueId);
            return { ...q, id: uniqueId };
        });

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
                    content: `Ты профессиональный составитель резюме, обученный по стандартам Stanford Career Education и Google XYZ-формату.
Твоя задача — создать ПОЛНОЕ, ПРОФЕССИОНАЛЬНОЕ резюме в формате Markdown, которое пройдёт ATS-скрининг и привлечёт внимание рекрутера.

═══ СТАНДАРТ ДОСТИЖЕНИЙ (Stanford CAR / Google XYZ) ═══
CAR = Challenge/Context → Action → Result
XYZ = "Accomplished [X] as measured by [Y] by doing [Z]"
Каждый bullet в опыте работы ОБЯЗАН:
  1. Начинаться с Action Verb в прошедшем времени (Разработал, Оптимизировал, Внедрил, Автоматизировал, Построил, Масштабировал, Сократил, Увеличил, Руководил, Спроектировал)
  2. Содержать конкретное действие (что именно сделал)
  3. Содержать измеримый результат (%, мс, $, пользователи, дни, команда N чел.) — если кандидат предоставил метрики
  ПЛОХО: "Занимался разработкой API"
  ПЛОХО: "Отвечал за базы данных"
  ХОРОШО: "Разработал REST API на NestJS с поддержкой 5000 RPS, сократив latency с 400 мс до 80 мс"
  ХОРОШО: "Автоматизировал CI/CD pipeline (GitHub Actions + Docker), уменьшив время деплоя с 45 мин до 8 мин"

═══ СТРУКТУРА (Stanford-стандарт) ═══
1. # ФИО — крупный заголовок
2. Контакты в одну строку: email | телефон | LinkedIn | GitHub | Telegram
   ВАЖНО: используй ТОЛЬКО те контакты, которые явно переданы в блоке "Контакты:" профиля.
   Не выдумывай email/телефон. Если контакт не указан — пропусти его. Если ни одного контакта нет — оставь только ФИО без строки контактов.
3. ## PROFESSIONAL SUMMARY / О СЕБЕ
   - 3-4 предложения. Кто ты (роль + опыт), ключевые технологии, главное достижение, что ищешь.
   - Tailored под желаемую позицию.
   - Без личных местоимений (не "я разработал", а "разработал").
4. ## ОПЫТ РАБОТЫ (обратная хронология)
   - ### Компания | Позиция | MM/YYYY – MM/YYYY
   - 3-6 CAR-bullets per role
5. ## НАВЫКИ
   - **Технические:** языки, фреймворки, инструменты, базы данных
   - **Профессиональные:** agile, teamwork, etc.
6. ## ОБРАЗОВАНИЕ
   - Учреждение, специальность, год окончания
7. ## ДОПОЛНИТЕЛЬНО (если есть)
   - Языки, сертификаты, проекты, публикации

═══ ATS-СОВМЕСТИМОСТЬ ═══
- Используй стандартные заголовки секций (ОПЫТ РАБОТЫ, НАВЫКИ, ОБРАЗОВАНИЕ)
- Никаких таблиц, колонок, эмодзи — только чистый Markdown
- Ключевые слова из желаемой позиции должны присутствовать в Summary и Skills
- Даты в формате MM/YYYY

═══ ЗАПРЕЩЕНО ═══
- Личные местоимения (я, мне, мы)
- "Обязанности включали" / "Отвечал за" — только достижения
- Выдумывать данные, которых нет в профиле или ответах
- Фраза "Ссылки предоставляются по запросу"

Резюме должно быть на русском языке (технические термины можно на английском).`,
                },
                {
                    role: 'user',
                    content: `Создай профессиональное резюме по стандартам Stanford Career Education на основе данных профиля и ответов кандидата.

${profileContext}

${answersContext}

ТРЕБОВАНИЯ К РЕЗУЛЬТАТУ:
- Каждый пункт опыта — по методу CAR (Action Verb + Действие + Измеримый результат)
- Summary tailored под желаемую позицию (3-4 предложения без "я")
- ATS-совместимые заголовки секций
- Минимум 3-5 пунктов достижений на каждую позицию
- Если метрик нет — используй описательные результаты ("для команды из 8 человек", "в продакшн-среде")

Сгенерируй полное резюме в Markdown формате.`,
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

        const contacts: string[] = [];
        if (profile.email) contacts.push(`Email: ${profile.email}`);
        if (profile.phone) contacts.push(`Телефон: ${profile.phone}`);
        if (profile.location) contacts.push(`Локация: ${profile.location}`);
        if (profile.linkedinUrl) contacts.push(`LinkedIn: ${profile.linkedinUrl}`);
        if (profile.githubUrl) contacts.push(`GitHub: ${profile.githubUrl}`);
        if (profile.telegram) contacts.push(`Telegram: ${profile.telegram}`);
        if (profile.portfolioUrl) contacts.push(`Портфолио: ${profile.portfolioUrl}`);
        if (contacts.length) {
            lines.push('\nКонтакты:');
            for (const c of contacts) lines.push(`  - ${c}`);
        }

        if (profile.aboutMe) lines.push(`\nО себе / доп. информация: ${profile.aboutMe}`);

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
