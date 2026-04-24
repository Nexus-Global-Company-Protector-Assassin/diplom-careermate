import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LlmProviderService } from './providers/llm-provider.service';
import { CareerChatChain } from './langchain/career-chat.chain';
import { VacancyAnalysisChain } from './langchain/vacancy-analysis.chain';
import { InterviewPrepChain } from './langchain/interview-prep.chain';
import { CoverLetterChain } from './langchain/cover-letter.chain';

const AI_CACHE_TTL = 24 * 60 * 60;

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
        private readonly llmProvider: LlmProviderService,
        private readonly redis: RedisService,
    ) {}

    private hash(data: unknown): string {
        return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    }

    private async cacheWrap<T>(key: string, fn: () => Promise<T>): Promise<T> {
        try {
            const cached = await this.redis.get(key);
            if (cached) {
                this.logger.log(`[Cache HIT] ${key}`);
                return JSON.parse(cached) as T;
            }
        } catch { /* Redis unavailable — fall through */ }

        const result = await fn();

        try {
            await this.redis.set(key, JSON.stringify(result), AI_CACHE_TTL);
            this.logger.log(`[Cache SET] ${key}`);
        } catch { /* non-critical */ }

        return result;
    }

    async generateResponse(message: string): Promise<string> {
        const llm = this.llmProvider.fastChat ?? this.llmProvider.chat;
        if (!llm) {
            this.logger.warn('LLM_API_KEY is not set. Using mocked response.');
            return this.getMockResponse(message);
        }

        try {
            let context = '';
            const profile = await this.prisma.profile.findFirst();
            if (profile) {
                context = `Контекст пользователя: Меня зовут ${profile.fullName || 'Кандидат'}. Ищу работу на позицию: ${profile.desiredPosition || 'Разработчик'}. Обо мне: ${profile.aboutMe || ''}. Навыки: ${JSON.stringify(profile.skills) || ''}.`;
            }
            const chain = new CareerChatChain(llm);
            return await chain.invoke({ message, context });
        } catch (error: any) {
            this.logger.error(`LLM Error: ${error.message}`);
            return 'Произошла ошибка при обращении к серверу AI. Пожалуйста, проверьте ключ или попробуйте позже.';
        }
    }

    private getMockResponse(message: string): string {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('резюме')) {
            return 'Для улучшения резюме рекомендую:\n\n1. Добавьте конкретные достижения с цифрами\n2. Используйте ключевые слова из вакансий\n3. Проверьте грамматику и оформление\n4. Добавьте релевантные навыки\n\n(Mock Mode - добавьте LLM_API_KEY в .env)';
        }
        if (lowerMessage.includes('собеседован')) {
            return 'Подготовка к собеседованию включает:\n\n1. Изучите компанию и продукт\n2. Подготовьте рассказ о себе (1-2 минуты)\n3. Практикуйте ответы на типичные вопросы\n4. Подготовьте вопросы для работодателя\n\n(Mock Mode - добавьте LLM_API_KEY в .env)';
        }
        if (lowerMessage.includes('вакансии') || lowerMessage.includes('работ')) {
            return 'На основе вашего профиля могу порекомендовать:\n\n• Senior Data Analyst в Yandex (93% совместимость)\n• Data Analyst в Sber (81% совместимость)\n\n(Mock Mode - добавьте LLM_API_KEY в .env)';
        }
        return 'Интересный вопрос! Я могу помочь вам с:\n\n• Анализом и улучшением резюме\n• Подготовкой к собеседованию\n• Поиском вакансий по вашему профилю\n• Карьерными рекомендациями\n\n(Mock Mode - добавьте LLM_API_KEY в .env)';
    }

    async evaluateVacancyInDepth(vacancy: any, resumeContent: string, archetype?: string, missingSkills?: string[]): Promise<any> {
        const cacheKey = `ai:vacancy-eval:${this.hash({ vacancyId: vacancy?.id, resumeContent, archetype, missingSkills })}`;
        return this.cacheWrap(cacheKey, () => this._evaluateVacancyInDepth(vacancy, resumeContent, archetype, missingSkills));
    }

    private async _evaluateVacancyInDepth(vacancy: any, resumeContent: string, archetype?: string, missingSkills?: string[]): Promise<any> {
        const daysOld = vacancy.createdAt
            ? Math.floor((Date.now() - new Date(vacancy.createdAt).getTime()) / 86400000)
            : null;
        const freshnessNote = daysOld !== null
            ? `Вакансия опубликована ${daysOld} дн. назад.${daysOld > 60 ? ' ⚠️ Очень старая — высокий риск ghost job.' : daysOld > 30 ? ' Устаревает.' : ' Свежая.'}`
            : 'Дата публикации неизвестна.';

        const archetypeNote = archetype && archetype !== 'Unknown' ? `Тип роли: ${archetype}.` : '';
        const gapNote = missingSkills?.length ? `Навыки которых нет у кандидата: ${missingSkills.join(', ')}.` : '';

        const llm = this.llmProvider.chat;
        if (!llm) {
            this.logger.warn('LLM_API_KEY is not set. Using mocked deep evaluation.');
            const mockScore = 50 + Math.floor(Math.random() * 40);
            const mockGrade = mockScore >= 80 ? 'A' : mockScore >= 65 ? 'B' : mockScore >= 50 ? 'C' : 'D';
            return {
                A_Summary: `[Mock] Архетип: ${archetype || 'Unknown'}. Роль: ${vacancy?.title} в ${vacancy?.employer}.`,
                B_CV_Match: `[Mock] Gaps: ${missingSkills?.join(', ') || 'не определены'}.`,
                C_Strategy: '[Mock] Акцентируйте достижения с конкретными метриками.',
                D_Compensation: `[Mock] ${vacancy?.salaryLabel || 'Зарплата не указана'}. Просите верхнюю границу.`,
                E_Personalization: '[Mock] Добавьте ключевые слова из JD в summary резюме.',
                F_Interview: '[Mock] Подготовьте STAR-историю о сложном проекте с измеримым результатом.',
                G_Legitimacy: {
                    verdict: mockScore > 85 ? 'High Confidence' : mockScore > 60 ? 'Proceed with Caution' : 'Suspicious',
                    signals: mockScore > 85
                        ? ['Свежая вакансия (< 3 дней)', 'Детальное описание стека', 'Указана рыночная ЗП']
                        : mockScore > 60
                            ? ['Размытое описание задач', 'Отсутствует зарплата']
                            : ['Вечнозеленая вакансия (обновляется 3+ месяца)', 'Требования Junior+, опыт 5+ лет', 'Слишком общие фразы'],
                    explanation: mockScore > 85
                        ? 'Вакансия выглядит реальной и проработанной.'
                        : mockScore > 60
                            ? 'Есть небольшие сомнения из-за недостатка конкретики.'
                            : 'Высокий риск Ghost Job! Описание типично для сбора базы резюме.',
                },
                archetype: archetype || 'Unknown',
                grade: mockGrade,
                score: mockScore,
            };
        }

        const vacancyText = [
            `Вакансия: ${vacancy?.title}`, `Работодатель: ${vacancy?.employer}`,
            `Зарплата: ${vacancy?.salaryLabel}`, `Опыт: ${vacancy?.experience}`,
            `Формат: ${vacancy?.schedule}`, `Описание: ${vacancy?.descriptionPreview || ''}`,
            `Навыки: ${JSON.stringify(vacancy?.skills || [])}`,
            archetypeNote, gapNote, freshnessNote,
        ].filter(Boolean).join('\n');

        const prompt = `Проведи глубокий анализ вакансии для кандидата (7 блоков):

A_Summary) Краткое резюме роли: архетип, домен, уровень, формат, TL;DR в 1 предложении.
B_CV_Match) Совпадение с CV: сопоставь каждое ключевое требование JD с опытом кандидата. Укажи gaps и стратегию их закрытия.
C_Strategy) Как кандидату продать себя без преувеличений. Конкретные формулировки.
D_Compensation) Адекватность зарплаты рынку. Рекомендации по переговорам.
E_Personalization) Топ-5 конкретных изменений в резюме под эту вакансию.
F_Interview) 3-5 STAR+R историй из опыта кандидата под требования вакансии.
G_Legitimacy) Ghost Job Detection — оцени реальность вакансии:
  - Свежесть: ${freshnessNote}
  - Размытость (Vagueness): Насколько общими фразами описана работа?
  - Unicorn Requirements: Не ищут ли они джуниора с 5+ годами опыта?
  - Есть ли явные упоминания команды, процессов работы?
  - Зарплата указана? (позитивный сигнал)
  Вердикт: "High Confidence", "Proceed with Caution" или "Suspicious". В поле signals перечисли конкретные найденные флаги.

ОЦЕНИВАЙ ЧЕСТНО. GRADE от A до F. Score 0-100.

Верни ТОЛЬКО валидный JSON без markdown:
{
  "A_Summary": "...", "B_CV_Match": "...", "C_Strategy": "...", "D_Compensation": "...",
  "E_Personalization": "...", "F_Interview": "...",
  "G_Legitimacy": { "verdict": "High Confidence | Proceed with Caution | Suspicious", "signals": [], "explanation": "..." },
  "archetype": "${archetype || 'Unknown'}", "grade": "A|B|C|D|F", "score": 85
}

Резюме кандидата:
${resumeContent}

${vacancyText}`;

        try {
            const chain = new VacancyAnalysisChain(llm);
            return await chain.invoke({ prompt });
        } catch (error: any) {
            this.logger.error(`LLM Error: ${error.message}`);
            return {
                A_Summary: 'Ошибка генерации оценки', B_CV_Match: 'Не удалось проанализировать из-за ошибки LLM',
                C_Strategy: 'Обратитесь к администратору', D_Compensation: 'N/A',
                E_Personalization: 'N/A', F_Interview: 'N/A',
                G_Legitimacy: { verdict: 'Proceed with Caution', signals: ['Ошибка LLM'], explanation: 'Ghost Job Detection недоступен' },
                archetype: archetype || 'Unknown', grade: 'F', score: 0,
            };
        }
    }

    async generateInterviewPrep(vacancy: any, resumeContent: string): Promise<any> {
        const cacheKey = `ai:interview-prep:${this.hash({ vacancyId: vacancy?.id, resumeContent })}`;
        return this.cacheWrap(cacheKey, () => this._generateInterviewPrep(vacancy, resumeContent));
    }

    private async _generateInterviewPrep(vacancy: any, resumeContent: string): Promise<any> {
        const llm = this.llmProvider.chat;
        const vacancyText = `Вакансия: ${vacancy?.title} в ${vacancy?.employer}. Описание: ${vacancy?.descriptionPreview || ''}. Навыки: ${JSON.stringify(vacancy?.skills || [])}. Опыт: ${vacancy?.experience}. Формат: ${vacancy?.schedule}.`;

        if (!llm) {
            this.logger.warn('LLM_API_KEY is not set. Using mocked interview prep.');
            return {
                questions: [{ question: 'Mock: Расскажите о сложном проекте', category: 'behavioral', star: { situation: 'Mock ситуация', task: 'Mock задача', action: 'Mock действия', result: 'Mock результат', reflection: 'Mock вывод' } }],
                candidate_questions: ['Mock: Какие технологии вы используете?', 'Mock: Какая структура команды?', 'Mock: Какие цели на год?'],
                tips: 'Mock: Добавьте LLM_API_KEY в .env для реальной генерации',
            };
        }

        const prompt = `Ты — эксперт по подготовке к собеседованиям. На основе резюме кандидата и описания вакансии, сгенерируй банк историй для собеседования по методу STAR+R.

Резюме кандидата:
${resumeContent}

${vacancyText}

ЗАДАЧА:
1. Предскажи 5 наиболее вероятных вопросов, которые зададут на собеседовании для данной позиции
2. Для каждого вопроса составь готовый ответ по методу STAR+R:
   - S (Situation) — описание ситуации из опыта кандидата
   - T (Task) — задача, которая стояла
   - A (Action) — конкретные действия кандидата
   - R (Result) — результат с цифрами/метриками
   - R+ (Reflection) — что кандидат вынес из этого опыта
3. Добавь 3 вопроса, которые кандидат должен задать работодателю

ВЕРНИ ОТВЕТ СТРОГО В ВИДЕ JSON:
{
  "questions": [{ "question": "...", "category": "behavioral|technical|situational", "star": { "situation": "...", "task": "...", "action": "...", "result": "...", "reflection": "..." } }],
  "candidate_questions": ["...", "...", "..."],
  "tips": "..."
}

Отвечай только валидным JSON без маркдаун-блоков.`;

        try {
            const chain = new InterviewPrepChain(llm);
            return await chain.invoke({ prompt });
        } catch (error: any) {
            this.logger.error(`LLM Error generating interview prep: ${error.message}`);
            return { questions: [], candidate_questions: [], tips: 'Ошибка генерации. Попробуйте позже.' };
        }
    }


    async generateCoverLetter(vacancy: any, resumeContent: string, language: 'ru' | 'en' = 'ru'): Promise<{ coverLetter: string }> {
        const cacheKey = `ai:cover-letter:${this.hash({ vacancyId: vacancy?.id, resumeContent, language })}`;
        return this.cacheWrap(cacheKey, () => this._generateCoverLetter(vacancy, resumeContent, language));
    }

    private async _generateCoverLetter(vacancy: any, resumeContent: string, language: 'ru' | 'en' = 'ru'): Promise<{ coverLetter: string }> {
        const llm = this.llmProvider.chat;
        const isEn = language === 'en';

        const vacancyText = isEn
            ? [`Position: ${vacancy?.title}`, `Employer: ${vacancy?.employer}`, `Location: ${vacancy?.location || 'Not specified'}`, `Salary: ${vacancy?.salaryLabel || 'Not specified'}`, `Format: ${vacancy?.schedule || 'Not specified'}`, `Job description: ${vacancy?.descriptionPreview || ''}`, `Required skills: ${JSON.stringify(vacancy?.skills || [])}`].join('\n')
            : [`Должность: ${vacancy?.title}`, `Работодатель: ${vacancy?.employer}`, `Местоположение: ${vacancy?.location || 'Не указано'}`, `Зарплата: ${vacancy?.salaryLabel || 'Не указана'}`, `Формат: ${vacancy?.schedule || 'Не указан'}`, `Описание вакансии: ${vacancy?.descriptionPreview || ''}`, `Требуемые навыки: ${JSON.stringify(vacancy?.skills || [])}`].join('\n');

        if (!llm) {
            this.logger.warn('LLM_API_KEY is not set. Using mocked cover letter.');
            const mockLetter = isEn
                ? `Three years ago, I built a data pipeline that cut reporting time from 6 hours to 20 minutes — and it was that problem-solving challenge that drew me to the kind of work ${vacancy?.employer} is doing with ${vacancy?.title}.

Over the past [X] years, I have [key achievement with metric — e.g., "designed a system processing 5M events/day with 99.9% uptime"]. This directly maps to what your team needs: [specific requirement from JD].

What sets ${vacancy?.employer} apart for me is [specific company product/mission/tech]. I have spent time understanding [specific aspect], and I believe my background in [relevant skill] positions me well to contribute to [specific team goal].

I would welcome the opportunity to discuss how my experience can help [specific outcome]. Happy to connect for a 20-minute call at your convenience.

[Mock Mode — add LLM_API_KEY to .env for AI-personalized generation]`
                : `Три года назад я построил пайплайн данных, который сократил время формирования отчётов с 6 часов до 20 минут — именно такие инженерные задачи привлекают меня к тому, что делает ${vacancy?.employer} на позиции ${vacancy?.title}.

За последние [X] лет [ключевое достижение с метрикой — например, "спроектировал систему, обрабатывающую 5M событий/день с доступностью 99.9%"]. Это напрямую соответствует тому, что нужно вашей команде: [конкретное требование из JD].

${vacancy?.employer} выделяется для меня [конкретный продукт/миссия/стек компании]. Изучив [конкретный аспект], я вижу, как мой опыт в [релевантный навык] может ускорить [конкретную цель команды].

Буду рад обсудить, как мой опыт поможет достичь [конкретный результат]. Готов созвониться на 20 минут в удобное для вас время.

[Mock Mode — добавьте LLM_API_KEY в .env для AI-персонализированной генерации]`;
            return { coverLetter: mockLetter };
        }

        const systemPrompt = isEn
            ? `You are a professional career consultant at CareerMate platform trained in Stanford Career Education best practices.
You write highly personalized cover letters that:
1. Open with a specific hook tied to the company/role (NOT "I am applying for...")
2. Connect 2-3 of the candidate's concrete achievements (with metrics where available) directly to the job requirements
3. Show genuine knowledge of what the company does and why the candidate fits THIS role specifically
4. Close with a confident, specific call to action
Rules: no generic phrases, no "I am a hardworking team player", no fluff. Reply with the letter text only — no markdown, no comments.`
            : `Ты — профессиональный карьерный консультант платформы CareerMate, обученный по стандартам Stanford Career Education.
Пишешь персонализированные сопроводительные письма, которые:
1. Открываются конкретным hook'ом — зацепкой, связанной с компанией или ролью (НЕ "Я хотел бы откликнуться на вакансию...")
2. Связывают 2-3 конкретных достижения кандидата (с метриками там, где они есть) напрямую с требованиями вакансии
3. Демонстрируют понимание специфики компании и почему кандидат подходит ИМЕННО для этой роли
4. Закрываются уверенным, конкретным призывом к действию
Правила: никаких шаблонных фраз, никакого "я ответственный командный игрок", никакой воды. Отвечай только текстом письма без markdown и комментариев.`;

        const prompt = isEn
            ? `Write a highly personalized cover letter in English using the Stanford best practices framework.

COVER LETTER STRUCTURE:
Para 1 (Hook): Open with something specific about the company or role that genuinely excites the candidate. Reference a product, initiative, or company value. Then bridge to why they're applying.
Para 2 (Achievement 1): Pick the most relevant achievement from the resume that directly addresses a key job requirement. Use specific metrics if available (XYZ format: "Accomplished X as measured by Y by doing Z").
Para 3 (Achievement 2 + Fit): Second relevant achievement + explain why THIS company specifically, not just any company. Show you understand their mission/challenges.
Para 4 (Close): Specific call to action. What you want to discuss in the interview. Confidence, not desperation.

AVOID: "I am applying for...", "I am a passionate...", "I would be a great fit", "References available upon request"

JOB DETAILS:
${vacancyText}

CANDIDATE RESUME:
${resumeContent}

Return ONLY the cover letter text. No subject line, no markdown.`
            : `Напиши высоко персонализированное сопроводительное письмо на русском языке по стандартам Stanford Career Education.

СТРУКТУРА ПИСЬМА:
Абзац 1 (Hook/Зацепка): Открой чем-то конкретным о компании или роли, что реально привлекает кандидата. Упомяни продукт, инициативу или ценность компании. Затем — мост к почему откликается.
Абзац 2 (Достижение 1): Выбери наиболее релевантное достижение из резюме, которое напрямую закрывает ключевое требование вакансии. Используй конкретные метрики если есть (CAR: Контекст → Действие → Результат с цифрами).
Абзац 3 (Достижение 2 + Fit): Второе релевантное достижение + объясни почему ИМЕННО эта компания, а не любая другая. Покажи понимание их миссии/задач.
Абзац 4 (Закрытие): Конкретный призыв к действию. Что хочешь обсудить на интервью. Уверенность, а не просьба.

ЗАПРЕЩЕНО: "Я хотел бы откликнуться на вакансию", "Я ответственный и целеустремлённый", "Буду рад рассмотреть любые предложения"

ДАННЫЕ ВАКАНСИИ:
${vacancyText}

РЕЗЮМЕ КАНДИДАТА:
${resumeContent}

Верни ТОЛЬКО текст письма. Без темы письма, без markdown.`;

        try {
            const chain = new CoverLetterChain(llm);
            const coverLetter = await chain.invoke({ systemPrompt, prompt });
            return { coverLetter: coverLetter.trim() };
        } catch (error: any) {
            this.logger.error(`LLM Error generating cover letter: ${error.message}`);
            const fallback = isEn
                ? `Dear Hiring Team,\n\nI am writing to express my interest in the ${vacancy?.title} position at ${vacancy?.employer}.\n\nBest regards`
                : `Добрый день!\n\nХочу откликнуться на вакансию ${vacancy?.title} в компании ${vacancy?.employer}.\n\nС уважением`;
            return { coverLetter: fallback };
        }
    }
}
