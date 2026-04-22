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

    async generateCoverLetter(vacancy: any, resumeContent: string, language: 'ru' | 'en' = 'ru'): Promise<{ coverLetter: string }> {
        const apiKey = this.configService.get<string>('LLM_API_KEY');
        const baseUrl = this.configService.get<string>('LLM_API_BASE_URL', 'https://api.openai.com/v1');
        const modelName = this.configService.get<string>('LLM_MODEL_NAME_SMART', 'google/gemini-3.1-flash-lite-preview');

        const isEn = language === 'en';

        const vacancyText = isEn
            ? [
                `Position: ${vacancy?.title}`,
                `Employer: ${vacancy?.employer}`,
                `Location: ${vacancy?.location || 'Not specified'}`,
                `Salary: ${vacancy?.salaryLabel || 'Not specified'}`,
                `Format: ${vacancy?.schedule || 'Not specified'}`,
                `Job description: ${vacancy?.descriptionPreview || ''}`,
                `Required skills: ${JSON.stringify(vacancy?.skills || [])}`,
            ].filter(Boolean).join('\n')
            : [
                `Должность: ${vacancy?.title}`,
                `Работодатель: ${vacancy?.employer}`,
                `Местоположение: ${vacancy?.location || 'Не указано'}`,
                `Зарплата: ${vacancy?.salaryLabel || 'Не указана'}`,
                `Формат: ${vacancy?.schedule || 'Не указан'}`,
                `Описание вакансии: ${vacancy?.descriptionPreview || ''}`,
                `Требуемые навыки: ${JSON.stringify(vacancy?.skills || [])}`,
            ].filter(Boolean).join('\n');

        const prompt = isEn
            ? `You are a professional career consultant. Write a personalized cover letter in English for a candidate applying for the following job.

JOB DETAILS:
${vacancyText}

CANDIDATE RESUME:
${resumeContent}

REQUIREMENTS:
1. Length: 3-4 paragraphs (250-350 words)
2. Tone: professional yet genuine — avoid generic clichés like "Dear Hiring Manager" or "I am writing to express my interest"
3. Structure:
   - Opening paragraph: who the candidate is, which role they're applying for, why this company/role specifically appeals to them
   - 1-2 body paragraphs: specific achievements from the resume relevant to the job requirements; mention 2-3 matching skills with numbers/results
   - Closing: express interest in an interview, mention availability
4. Do NOT invent facts that are not in the resume
5. Write in first person
6. Avoid clichés: "I would like to", "My name is", "Sincerely yours"

Return ONLY the cover letter text — no comments, JSON, or markdown.`
            : `Ты — профессиональный карьерный консультант. Напиши персонализированное сопроводительное письмо на русском языке для кандидата, который хочет откликнуться на вакансию.

ДАННЫЕ ВАКАНСИИ:
${vacancyText}

РЕЗЮМЕ КАНДИДАТА:
${resumeContent}

ТРЕБОВАНИЯ К ПИСЬМУ:
1. Объём: 3-4 абзаца (250-350 слов)
2. Тон: профессиональный, но живой — без шаблонных клише вроде "Уважаемый работодатель"
3. Структура:
   - Вводный абзац: кто кандидат, на какую позицию откликается, почему именно эта компания/роль
   - 1-2 абзаца: конкретные достижения из резюме, которые релевантны требованиям вакансии; упомяни 2-3 совпадающих навыка с цифрами/результатами
   - Заключение: выразить интерес к встрече, указать готовность обсудить детали
4. НЕ выдумывай факты, которых нет в резюме
5. Пиши от первого лица
6. Не используй шаблонные фразы: "Я хотел бы", "Меня зовут", "С уважением"

Верни ТОЛЬКО текст письма без каких-либо комментариев, JSON или markdown-форматирования.`;

        const systemPrompt = isEn
            ? 'You are a professional career consultant at CareerMate platform. You write personalized cover letters based on the candidate\'s resume and job description. Reply with the letter text only — no markdown, no comments.'
            : 'Ты — профессиональный карьерный консультант платформы CareerMate. Пишешь персонализированные сопроводительные письма на основе резюме кандидата и описания вакансии. Отвечай только текстом письма без markdown и комментариев.';

        if (!apiKey) {
            this.logger.warn('LLM_API_KEY is not set. Using mocked cover letter.');
            const mockLetter = isEn
                ? `Good day!\n\nI am excited to apply for the ${vacancy?.title} position at ${vacancy?.employer}. My experience and skills closely match the requirements outlined in the job description, and I am confident I can make a meaningful contribution to your team.\n\nThroughout my career, I have successfully tackled challenges similar to those described in this role. My core competencies align directly with the position's requirements, allowing me to contribute from day one.\n\nI would welcome the opportunity to discuss this role further. Please feel free to reach out at your convenience.\n\n[Mock Mode — add LLM_API_KEY to .env for personalized generation]`
                : `Добрый день!\n\nМеня заинтересовала вакансия ${vacancy?.title} в компании ${vacancy?.employer}. Мой опыт и навыки хорошо соответствуют описанным требованиям, и я уверен, что смогу внести значимый вклад в работу вашей команды.\n\nВ ходе своей карьеры я успешно работал над задачами, аналогичными тем, что указаны в описании вакансии. Мои ключевые компетенции включают области, напрямую связанные с требованиями позиции, что позволит мне быстро включиться в рабочие процессы.\n\nГотов обсудить детали сотрудничества на собеседовании. Буду рад ответить на ваши вопросы и рассмотреть все возможные варианты.\n\n[Mock Mode — добавьте LLM_API_KEY в .env для персонализированной генерации]`;
            return { coverLetter: mockLetter };
        }

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${baseUrl}/chat/completions`,
                    {
                        model: modelName,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: prompt },
                        ],
                        max_tokens: 1000,
                        temperature: 0.4,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
            );

            const coverLetter = response.data.choices[0]?.message?.content?.trim() || '';
            return { coverLetter };
        } catch (error: any) {
            this.logger.error(`LLM Error generating cover letter: ${error.message}`);
            const fallback = isEn
                ? `Dear Hiring Team,\n\nI am writing to express my interest in the ${vacancy?.title} position at ${vacancy?.employer}. Please find my resume attached for your consideration.\n\nBest regards`
                : `Добрый день!\n\nХочу откликнуться на вакансию ${vacancy?.title} в компании ${vacancy?.employer}. Прошу рассмотреть моё резюме.\n\nС уважением`;
            return { coverLetter: fallback };
        }
    }
}
