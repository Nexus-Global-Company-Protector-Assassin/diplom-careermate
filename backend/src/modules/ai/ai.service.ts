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
    ) {}

    async generateResponse(message: string): Promise<string> {
        const apiKey = this.configService.get<string>('LLM_API_KEY');
        const baseUrl = this.configService.get<string>('LLM_API_BASE_URL', 'https://api.openai.com/v1');
        const modelName = this.configService.get<string>('LLM_MODEL_NAME_SMART', 'gpt-3.5-turbo');

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
}
