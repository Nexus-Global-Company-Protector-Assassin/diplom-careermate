import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
    tools?: any[];
    tool_choice?: any;
}

export interface LLMResponse {
    content: string;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    latencyMs: number;
    tool_calls?: any[];
}

export interface LLMJsonResponse<T> extends LLMResponse {
    data: T;
}

@Injectable()
export class LlmGatewayService {
    private readonly logger = new Logger(LlmGatewayService.name);
    private readonly client: AxiosInstance;
    private readonly defaultModel: string;
    private readonly smartModel: string;
    private readonly fastModel: string;
    private readonly defaultTimeout: number;
    private readonly maxRetries: number;

    constructor(private readonly configService: ConfigService) {
        const baseUrl = this.configService.get<string>(
            'LLM_API_BASE_URL',
            'https://polza.ai/api/v1',
        );
        const apiKey = this.configService.get<string>('LLM_API_KEY', '');

        this.defaultModel = this.configService.get<string>(
            'LLM_MODEL_NAME',
            'openai/gpt-4o-mini',
        );
        this.fastModel = this.configService.get<string>(
            'LLM_MODEL_NAME_FAST',
            'openai/gpt-4o-mini',
        );
        this.smartModel = this.configService.get<string>(
            'LLM_MODEL_NAME_SMART',
            'openai/gpt-4o',
        );
        this.defaultTimeout = this.configService.get<number>('AI_TIMEOUT_MS', 30000);
        this.maxRetries = this.configService.get<number>('AI_MAX_RETRIES', 3);

        this.client = axios.create({
            baseURL: baseUrl,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: this.defaultTimeout,
        });

        this.logger.log(
            `LlmGatewayService initialized: baseUrl=${baseUrl}, model=${this.defaultModel}`,
        );
    }

    /**
     * Генерирует свободный текст
     */
    async generateText(
        messages: LLMMessage[],
        options: LLMOptions = {},
    ): Promise<LLMResponse> {
        const model = options.model ?? this.defaultModel;
        const temperature = options.temperature ?? 0.7;
        const maxTokens = options.maxTokens ?? 2048;
        const timeoutMs = options.timeoutMs ?? this.defaultTimeout;

        return this.withRetry(async () => {
            const startAt = Date.now();

            const payload: any = {
                model,
                messages,
                temperature,
                max_tokens: maxTokens,
            };

            if (options.tools) {
                payload.tools = options.tools;
            }
            if (options.tool_choice) {
                payload.tool_choice = options.tool_choice;
            }

            const response = await this.client.post(
                '/chat/completions',
                payload,
                { timeout: timeoutMs },
            );

            const latencyMs = Date.now() - startAt;
            const choice = response.data.choices?.[0];
            const content = choice?.message?.content ?? '';
            const tool_calls = choice?.message?.tool_calls;
            const usage = response.data.usage;

            this.logger.log(
                `[generateText] model=${model} latency=${latencyMs}ms ` +
                `tokens=${usage?.total_tokens ?? '?'}`,
            );

            return {
                content,
                model: response.data.model ?? model,
                usage: usage
                    ? {
                        promptTokens: usage.prompt_tokens,
                        completionTokens: usage.completion_tokens,
                        totalTokens: usage.total_tokens,
                    }
                    : undefined,
                latencyMs,
                tool_calls,
            };
        }, model);
    }

    /**
     * Генерирует JSON строго по Zod-схеме, с repair-логикой
     */
    async generateJson<T>(
        messages: LLMMessage[],
        schema: z.ZodType<T, any, any>,
        options: LLMOptions = {},
    ): Promise<LLMJsonResponse<T>> {
        const model = options.model ?? this.defaultModel;
        const temperature = options.temperature ?? 0.3;
        const maxTokens = options.maxTokens ?? 2048;

        // Добавляем системную инструкцию для строгого JSON
        const jsonMessages: LLMMessage[] = [
            {
                role: 'system',
                content:
                    'Ты должен отвечать ТОЛЬКО валидным JSON без каких-либо дополнительных символов, ' +
                    'markdown-разметки, пояснений или текста вне JSON. ' +
                    'Никаких ```json``` блоков. Только чистый JSON объект.',
            },
            ...messages,
        ];

        let lastError: Error | null = null;
        const MAX_REPAIR_ATTEMPTS = 3;

        for (let attempt = 1; attempt <= MAX_REPAIR_ATTEMPTS; attempt++) {
            try {
                const result = await this.generateText(jsonMessages, {
                    model,
                    temperature,
                    maxTokens,
                    timeoutMs: options.timeoutMs,
                });

                // Пытаемся распарсить JSON
                let rawJson: unknown;
                try {
                    // Убираем возможные markdown-блоки
                    const cleaned = result.content
                        .replace(/```json\s*/gi, '')
                        .replace(/```\s*/gi, '')
                        .trim();
                    rawJson = JSON.parse(cleaned);
                } catch {
                    throw new Error(
                        `Invalid JSON on attempt ${attempt}: ${result.content.slice(0, 200)}`,
                    );
                }

                // Валидируем через Zod
                const parsed = schema.safeParse(rawJson);
                if (!parsed.success) {
                    const errorSummary = parsed.error.errors
                        .map((e) => `${e.path.join('.')}: ${e.message}`)
                        .join('; ');

                    if (attempt < MAX_REPAIR_ATTEMPTS) {
                        this.logger.warn(
                            `[generateJson] Zod validation failed (attempt ${attempt}/${MAX_REPAIR_ATTEMPTS}): ${errorSummary}`,
                        );
                        // Добавляем repair-запрос
                        jsonMessages.push(
                            { role: 'assistant', content: result.content },
                            {
                                role: 'user',
                                content:
                                    `Ответ не прошёл валидацию. Ошибки: ${errorSummary}. ` +
                                    `Верни ИСПРАВЛЕННЫЙ JSON строго по схеме, без лишних полей.`,
                            },
                        );
                        lastError = new Error(errorSummary);
                        continue;
                    }

                    throw new Error(`Schema validation failed: ${errorSummary}`);
                }

                this.logger.log(
                    `[generateJson] Success on attempt ${attempt}/${MAX_REPAIR_ATTEMPTS}, model=${model}`,
                );

                return { ...result, data: parsed.data };
            } catch (err) {
                lastError = err as Error;
                if (attempt < MAX_REPAIR_ATTEMPTS) {
                    this.logger.warn(
                        `[generateJson] Attempt ${attempt} failed: ${lastError.message}`,
                    );
                }
            }
        }

        throw new Error(
            `[generateJson] All ${MAX_REPAIR_ATTEMPTS} attempts failed. Last error: ${lastError?.message}`,
        );
    }

    /**
     * Retry-обёртка с exponential backoff
     */
    private async withRetry<T>(
        fn: () => Promise<T>,
        context: string,
    ): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await fn();
            } catch (err) {
                lastError = err as Error;
                const isLastAttempt = attempt === this.maxRetries;
                const isRetryable = this.isRetryableError(err);

                if (isLastAttempt || !isRetryable) {
                    this.logger.error(
                        `[withRetry] ${context} failed after ${attempt} attempts: ${lastError.message}`,
                    );
                    throw lastError;
                }

                const delayMs = Math.min(1000 * 2 ** (attempt - 1), 10000); // 1s, 2s, 4s... max 10s
                this.logger.warn(
                    `[withRetry] ${context} attempt ${attempt} failed, retrying in ${delayMs}ms: ${lastError.message}`,
                );
                await this.sleep(delayMs);
            }
        }

        throw lastError;
    }

    private isRetryableError(err: unknown): boolean {
        if (axios.isAxiosError(err)) {
            const status = err.response?.status;
            // Retry on rate limit (429), server errors (5xx), network errors
            return !status || status === 429 || status >= 500;
        }
        return false;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Получает embeddings (вектора) для массива текстов
     */
    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        return this.withRetry(async () => {
            const response = await this.client.post('/embeddings', {
                input: texts,
                model: 'text-embedding-3-small', // Default OpenAI/Polza embedding model
            });

            // Парсим стандартный ответ /embeddings (OpenAI spec)
            const data = response.data.data;
            if (!data || !Array.isArray(data)) {
                throw new Error('Invalid embeddings response from LLM Gateway');
            }

            // Сортируем по индексу на всякий случай, чтобы порядок совпадал с входным массивом
            data.sort((a: any, b: any) => a.index - b.index);
            return data.map((item: any) => item.embedding);
        }, 'generateEmbeddings');
    }

    getModels() {
        return {
            default: this.defaultModel,
            fast: this.fastModel,
            smart: this.smartModel,
        };
    }
}
