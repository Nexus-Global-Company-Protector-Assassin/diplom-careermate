import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    async generateResponse(message: string): Promise<string> {
        const apiKey = this.configService.get<string>('LLM_API_KEY');
        const baseUrl = this.configService.get<string>('LLM_API_BASE_URL', 'https://api.openai.com/v1');
        const modelName = this.configService.get<string>('LLM_MODEL_NAME_SMART', 'google/gemini-3.1-flash-lite-preview');

        if (!apiKey) {
            this.logger.warn('LLM_API_KEY is not set. Using mocked response.');
            return this.getMockResponse(message);
        }

        try {
            let contextText = '';
            const profile = await this.prisma.profile.findFirst();
            if (profile) {
                contextText = `Контекст пользователя: Меня зовут ${profile.fullName || 'Кандидат'}. Ищу работу на позицию: ${profile.desiredPosition || 'Разработчик'}. Обо мне: ${profile.aboutMe || ''}. Навыки: ${JSON.stringify(profile.skills) || ''}.`;
            }

            const response = await firstValueFrom(
                this.httpService.post(
                    `${baseUrl}/chat/completions`,
                    {
                        model: modelName,
                        messages: [
                            { role: 'system', content: `Ты — умный карьерный консультант платформы CareerMate. Строго придерживайся своей роли. Твоя единственная цель: помогать с поиском работы, резюме, собеседованиями и развитием карьеры. Если пользователь задает вопросы или просит сделать что-то, не связанное с карьерой, работой, образованием, навыками или функционалом платформы, ты ДОЛЖЕН вежливо отказать и напомнить, что ты карьерный консультант CareerMate и обсуждаешь только профессиональное развитие. ${contextText} Отвечай полезно, структурированно, профессионально. Пиши коротко и по делу.` },
                            { role: 'user', content: message }
                        ],
                        max_tokens: 500,
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );

            return response.data.choices[0]?.message?.content || 'Не смог сгенерировать ответ.';
        } catch (error: any) {
            this.logger.error(`OpenAI Error: ${error.message}`);
            return 'Произошла ошибка при обращении к серверу AI. Пожалуйста, проверьте ключ или попробуйте позже.';
        }
    }

    private getMockResponse(message: string): string {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes("резюме")) {
            return "Для улучшения резюме рекомендую:\n\n1. Добавьте конкретные достижения с цифрами\n2. Используйте ключевые слова из вакансий\n3. Проверьте грамматику и оформление\n4. Добавьте релевантные навыки\n\n(Mock Mode - добавьте LLM_API_KEY в .env)";
        }

        if (lowerMessage.includes("собеседован")) {
            return "Подготовка к собеседованию включает:\n\n1. Изучите компанию и продукт\n2. Подготовьте рассказ о себе (1-2 минуты)\n3. Практикуйте ответы на типичные вопросы\n4. Подготовьте вопросы для работодателя\n\n(Mock Mode - добавьте LLM_API_KEY в .env)";
        }

        if (lowerMessage.includes("вакансии") || lowerMessage.includes("работ")) {
            return "Я вижу, что вы ищете работу! На основе вашего профиля могу порекомендовать:\n\n• Senior Data Analyst в Yandex (93% совместимость)\n• Data Analyst в Sber (81% совместимость)\n\n(Mock Mode - добавьте LLM_API_KEY в .env)";
        }

        return "Интересный вопрос! Я могу помочь вам с:\n\n• Анализом и улучшением резюме\n• Подготовкой к собеседованию\n• Поиском вакансий по вашему профилю\n• Карьерными рекомендациями\n\n(Mock Mode - добавьте LLM_API_KEY в .env)";
    }

    async evaluateVacancyInDepth(vacancy: any, resumeContent: string, archetype?: string, missingSkills?: string[]): Promise<any> {
        // Freshness signal for Ghost Job Detection
        const daysOld = vacancy.createdAt
            ? Math.floor((Date.now() - new Date(vacancy.createdAt).getTime()) / 86400000)
            : null;
        const freshnessNote = daysOld !== null
            ? `Вакансия опубликована ${daysOld} дн. назад.${daysOld > 60 ? ' ⚠️ Очень старая — высокий риск ghost job.' : daysOld > 30 ? ' Устаревает.' : ' Свежая.'}`
            : 'Дата публикации неизвестна.';

        const archetypeNote = archetype && archetype !== 'Unknown' ? `Тип роли: ${archetype}.` : '';
        const gapNote = missingSkills?.length ? `Навыки которых нет у кандидата: ${missingSkills.join(', ')}.` : '';

        const contextText = `Резюме кандидата:\n${resumeContent}`;
        const apiKey = this.configService.get<string>('LLM_API_KEY');
        const baseUrl = this.configService.get<string>('LLM_API_BASE_URL', 'https://api.openai.com/v1');
        const modelName = this.configService.get<string>('LLM_MODEL_NAME_SMART', 'google/gemini-3.1-flash-lite-preview');
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
  - Размытость (Vagueness): Насколько общими фразами описана работа? Есть ли конкретный стек и задачи?
  - Unicorn Requirements: Не ищут ли они джуниора с 5+ годами опыта или знанием 20 разных фреймворков?
  - Есть ли явные упоминания команды, процессов работы?
  - Зарплата указана? (позитивный сигнал)
  Вердикт: "High Confidence", "Proceed with Caution" или "Suspicious". В поле signals перечисли конкретные найденные флаги (например: ["Слишком размытое описание", "Требуется опыт сеньора на позицию джуна"]).

ОЦЕНИВАЙ ЧЕСТНО. GRADE от A до F. Score 0-100.

Верни ТОЛЬКО валидный JSON без markdown:
{
  "A_Summary": "...",
  "B_CV_Match": "...",
  "C_Strategy": "...",
  "D_Compensation": "...",
  "E_Personalization": "...",
  "F_Interview": "...",
  "G_Legitimacy": {
    "verdict": "High Confidence | Proceed with Caution | Suspicious",
    "signals": ["сигнал 1", "сигнал 2"],
    "explanation": "краткое объяснение"
  },
  "archetype": "${archetype || 'Unknown'}",
  "grade": "A|B|C|D|F",
  "score": 85
}

${contextText}

${vacancyText}`;

        if (!apiKey) {
            this.logger.warn('LLM_API_KEY is not set. Using mocked deep evaluation.');
            const mockScore = 50 + Math.floor(Math.random() * 40);
            const mockGrade = mockScore >= 80 ? 'A' : mockScore >= 65 ? 'B' : mockScore >= 50 ? 'C' : 'D';
            return {
                "A_Summary": `[Mock] Архетип: ${archetype || 'Unknown'}. Роль: ${vacancy?.title} в ${vacancy?.employer}.`,
                "B_CV_Match": `[Mock] Gaps: ${missingSkills?.join(', ') || 'не определены'}.`,
                "C_Strategy": "[Mock] Акцентируйте достижения с конкретными метриками.",
                "D_Compensation": `[Mock] ${vacancy?.salaryLabel || 'Зарплата не указана'}. Просите верхнюю границу.`,
                "E_Personalization": "[Mock] Добавьте ключевые слова из JD в summary резюме.",
                "F_Interview": "[Mock] Подготовьте STAR-историю о сложном проекте с измеримым результатом.",
                "G_Legitimacy": {
                    "verdict": mockScore > 85 ? "High Confidence" : mockScore > 60 ? "Proceed with Caution" : "Suspicious",
                    "signals": mockScore > 85 
                        ? ["Свежая вакансия (< 3 дней)", "Детальное описание стека", "Указана рыночная ЗП"] 
                        : mockScore > 60 
                            ? ["Размытое описание задач", "Отсутствует зарплата"]
                            : ["Вечнозеленая вакансия (обновляется 3+ месяца)", "Требования Junior+, опыт 5+ лет", "Слишком общие фразы ('участие в проектах')"],
                    "explanation": mockScore > 85 
                        ? "Вакансия выглядит реальной и проработанной." 
                        : mockScore > 60 
                            ? "Есть небольшие сомнения из-за недостатка конкретики."
                            : "Высокий риск Ghost Job! Описание типично для сбора базы резюме."
                },
                "archetype": archetype || "Unknown",
                "grade": mockGrade,
                "score": mockScore
            };
        }

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${baseUrl}/chat/completions`,
                    {
                        model: modelName,
                        messages: [
                            { role: 'system', content: 'Ты — строгий карьерный консультант платформы CareerMate. Проводишь аудит вакансий включая Ghost Job Detection (Block G). Отвечай только валидным JSON без markdown.' },
                            { role: 'user', content: prompt }
                        ],
                        max_tokens: 3000,
                        temperature: 0.2,
                    },
                    { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
                )
            );

            const content = response.data.choices[0]?.message?.content || '{}';
            const start = content.indexOf('{');
            const end = content.lastIndexOf('}');
            return JSON.parse(start !== -1 && end !== -1 ? content.substring(start, end + 1) : content);
        } catch (error: any) {
            this.logger.error(`LLM Error: ${error.message}`);
            return {
                "A_Summary": "Ошибка генерации оценки",
                "B_CV_Match": "Не удалось проанализировать из-за ошибки LLM",
                "C_Strategy": "Обратитесь к администратору", "D_Compensation": "N/A",
                "E_Personalization": "N/A", "F_Interview": "N/A",
                "G_Legitimacy": { "verdict": "Proceed with Caution", "signals": ["Ошибка LLM"], "explanation": "Ghost Job Detection недоступен" },
                "archetype": archetype || "Unknown", "grade": "F", "score": 0
            };
        }
    }

    async generateInterviewPrep(vacancy: any, resumeContent: string): Promise<any> {
        const apiKey = this.configService.get<string>('LLM_API_KEY');
        const baseUrl = this.configService.get<string>('LLM_API_BASE_URL', 'https://api.openai.com/v1');
        const modelName = this.configService.get<string>('LLM_MODEL_NAME_SMART', 'google/gemini-3.1-flash-lite-preview');

        const vacancyText = `Вакансия: ${vacancy?.title} в ${vacancy?.employer}. Описание: ${vacancy?.descriptionPreview || ''}. Навыки: ${JSON.stringify(vacancy?.skills || [])}. Опыт: ${vacancy?.experience}. Формат: ${vacancy?.schedule}.`;

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
  "questions": [
    {
      "question": "Вопрос интервьюера",
      "category": "behavioral|technical|situational",
      "star": {
        "situation": "Описание ситуации...",
        "task": "Задача...",
        "action": "Действия...",
        "result": "Результат...",
        "reflection": "Вывод..."
      }
    }
  ],
  "candidate_questions": [
    "Вопрос работодателю 1",
    "Вопрос работодателю 2",
    "Вопрос работодателю 3"
  ],
  "tips": "Общие советы для этого собеседования"
}

Отвечай только валидным JSON без маркдаун-блоков.`;

        if (!apiKey) {
            this.logger.warn('LLM_API_KEY is not set. Using mocked interview prep.');
            return {
                questions: [
                    { question: "Mock: Расскажите о сложном проекте", category: "behavioral", star: { situation: "Mock ситуация", task: "Mock задача", action: "Mock действия", result: "Mock результат", reflection: "Mock вывод" } }
                ],
                candidate_questions: ["Mock: Какие технологии вы используете?", "Mock: Какая структура команды?", "Mock: Какие цели на год?"],
                tips: "Mock: Добавьте LLM_API_KEY в .env для реальной генерации"
            };
        }

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${baseUrl}/chat/completions`,
                    {
                        model: modelName,
                        messages: [
                            { role: 'system', content: 'Ты — эксперт по подготовке к собеседованиям платформы CareerMate. Генерируй структурированные ответы по методу STAR+R. Отвечай только валидным JSON.' },
                            { role: 'user', content: prompt }
                        ],
                        max_tokens: 3000,
                        temperature: 0.3,
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );

            const content = response.data.choices[0]?.message?.content || '{}';
            let cleanContent = content;
            const startIndex = cleanContent.indexOf('{');
            const endIndex = cleanContent.lastIndexOf('}');
            if (startIndex !== -1 && endIndex !== -1) {
                cleanContent = cleanContent.substring(startIndex, endIndex + 1);
            }
            return JSON.parse(cleanContent);
        } catch (error: any) {
            this.logger.error(`LLM Error generating interview prep: ${error.message}`);
            return {
                questions: [],
                candidate_questions: [],
                tips: "Ошибка генерации. Попробуйте позже."
            };
        }
    }
}
