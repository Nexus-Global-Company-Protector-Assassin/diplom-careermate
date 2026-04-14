import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ZodType } from 'zod';

export interface LlmOptions {
    temperature?: number;
    maxTokens?: number;
    retries?: number;
}

@Injectable()
export class LlmService {
    private readonly logger = new Logger(LlmService.name);
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly modelName: string;
    private readonly timeoutMs: number;

    constructor(private readonly configService: ConfigService) {
        this.baseUrl = this.configService.get<string>('LLM_API_BASE_URL', 'https://api.openai.com/v1');
        this.apiKey = this.configService.get<string>('LLM_API_KEY', '');
        this.modelName = this.configService.get<string>('LLM_MODEL_NAME', 'gpt-4o-mini');
        this.timeoutMs = this.configService.get<number>('AI_TIMEOUT_MS', 30000);
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Вызывает LLM с требованием вернуть строгий JSON, удовлетворяющий Zod схеме.
     */
    async generateJson<T>(
        systemPrompt: string,
        userPrompt: string,
        schema: ZodType<T>,
        options?: LlmOptions
    ): Promise<T> {
        const retries = options?.retries ?? this.configService.get<number>('AI_MAX_RETRIES', 3);
        let lastError: Error | null = null;
        let attempt = 0;

        while (attempt < retries) {
            attempt++;
            try {
                this.logger.debug(`[JSON] Attempt ${attempt} / ${retries} for model ${this.modelName}`);
                const responseText = await this.makeRequest(systemPrompt, userPrompt, {
                    ...options,
                    responseFormat: 'json_object'
                });

                // Первичная попытка распарсить как простой JSON
                let parsedJson: unknown;
                try {
                    parsedJson = JSON.parse(responseText);
                } catch (e) {
                    this.logger.warn(`Failed to parse raw text as JSON. LLM returned: ${responseText}`);
                    throw new Error('LLM did not return a valid JSON string.');
                }

                // Строгая валидация и каст через Zod
                const validationResult = schema.safeParse(parsedJson);
                if (validationResult.success) {
                    return validationResult.data;
                } else {
                    this.logger.warn(`Zod Validation failed. Issues: JSON format is correct but schema is wrong.`);
                    // Добавляем к systemPrompt указание на ошибку, чтобы "отремонтировать" (Repair)
                    systemPrompt += `\n\n[WARNING]: Your previous response had validation errors. Fix them: ${validationResult.error.message}`;
                    throw new Error('Zod Schema Validation Failed');
                }

            } catch (error: any) {
                lastError = error;
                this.logger.error(`Attempt ${attempt} failed: ${error.message}`);
                // Exponential backoff
                await this.sleep(1000 * Math.pow(2, attempt));
            }
        }

        throw new InternalServerErrorException(`LLM generateJson failed after ${retries} attempts. Last error: ${lastError?.message}`);
    }

    private async makeRequest(systemPrompt: string, userPrompt: string, config: any): Promise<string> {
        if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
            this.logger.warn('LLM_API_KEY is missing or default. Returning mock response for PoC!');
            return this.getMockResponse();
        }

        const start = Date.now();
        
        try {
            const body: any = {
                model: this.modelName,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: config.temperature ?? 0.3,
            };

            if (config.maxTokens) body.max_tokens = config.maxTokens;
            if (config.responseFormat === 'json_object') {
                body.response_format = { type: 'json_object' };
            }

            const response = await axios.post(`${this.baseUrl}/chat/completions`, body, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.timeoutMs,
            });

            const latency = Date.now() - start;
            this.logger.log(`LLM Call Success. Latency: ${latency}ms`);
            
            return response.data.choices[0].message.content;

        } catch (error: any) {
            this.logger.error(`LLM Call Error: ${error.response?.data?.error?.message || error.message}`);
            throw error;
        }
    }

    private getMockResponse(): string {
        // Умный мок на случай если ключ не заведен
        return JSON.stringify({
            score: 75,
            level: 'Middle',
            strengths: ['Great frontend knowledge', 'Node.js base is strong'],
            weaknesses: ['Lack of DevOps experience', 'SQL could be better'],
            recommendations: ['Learn Docker & Kubernetes', 'Practice advanced Prisma queries'],
            skillGaps: ['Docker', 'AWS']
        });
    }
}
