import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { LlmGatewayService, LLMMessage } from './llm/llm-gateway.service';
import { AgentRunnerService } from './agent.service';
import { ProfileData } from './tools/analyze-profile.tool';

export interface ChatRequest {
    messages: LLMMessage[];
    profileData?: ProfileData; // Извлечённые данные, если пользователь загрузил файл
}

export type ChatResponse =
    | { type: 'result'; data: any; message: string }
    | { type: 'questions'; data: string[]; message: string };

@Injectable()
export class ReActAgentService {
    private readonly logger = new Logger(ReActAgentService.name);

    constructor(
        private readonly llmGateway: LlmGatewayService,
        private readonly agentRunner: AgentRunnerService,
    ) { }

    async chat(request: ChatRequest): Promise<ChatResponse> {
        this.logger.log(`[chat] incoming messages: ${request.messages.length}`);

        // Системный промпт, объясняющий агенту его роль
        const systemPrompt: LLMMessage = {
            role: 'system',
            content: `Ты — AI Карьерный Консультант (CareerMate).
Твоя цель: помочь пользователю получить крутое адаптированное резюме под его навыки.
У тебя есть доступ к двум инструментам (функциям):
1. 'process_career_path': Вызови эту функцию, если у тебя достаточно данных о пользователе (его опыте, навыках) И ПОНЯТНА желаемая должность. Это запустит полный цикл подбора вакансии и генерации резюме.
2. 'ask_clarification': Вызови эту функцию, если данных категорически не хватает (например, юзер просто сказал "привет" или скинул пустое резюме без позиции и стека). Передай список уточняющих вопросов.

Если пользователь загрузил резюме, его данные будут добавлены к началу контекста. Оценивай эти данные!`
        };

        const messages = [systemPrompt];

        // Добавляем Profile Data если юзер кинул файл
        if (request.profileData) {
            messages.push({
                role: 'system',
                content: `СИСТЕМНОЕ СООБЩЕНИЕ: Пользователь загрузил файл резюме. Извлеченные данные:\n${JSON.stringify(request.profileData, null, 2)}\nОбрати внимание на эти данные перед вызовом функций.`,
            });
        }

        // Добавляем историю
        messages.push(...request.messages);

        // Определяем инструменты (tools)
        const tools = [
            {
                type: 'function',
                function: {
                    name: 'process_career_path',
                    description: 'Запускает полный цикл (PoC Flow): Анализ -> Матчинг вакансий -> Генерация итогового PDF резюме. Используй ТОЛЬКО если данных в резюме достаточно.',
                    parameters: {
                        type: 'object',
                        properties: {
                            confidence: {
                                type: 'number',
                                description: 'Твоя уверенность от 0 до 100, что данных достаточно.'
                            }
                        },
                        required: ['confidence']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'ask_clarification',
                    description: 'Задаёт уточняющие вопросы пользователю, если данных категорически не хватает.',
                    parameters: {
                        type: 'object',
                        properties: {
                            questions: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Список из 1-3 самых важных уточняющих вопросов.'
                            }
                        },
                        required: ['questions']
                    }
                }
            }
        ];

        // Вызываем LLM (используем fast model - gpt-4o-mini/gpt-5.4-nano)
        const result = await this.llmGateway.generateText(messages, {
            model: 'openai/gpt-5.4-nano',
            tools,
            temperature: 0.1,
            // Заставляем модель всегда вызывать инструмент
            tool_choice: 'required'
        });

        // Обрабатываем Tool Calls
        const toolCalls = result.tool_calls;
        if (!toolCalls || toolCalls.length === 0) {
            this.logger.error('Model failed to return a tool call');
            throw new BadRequestException('Агент не смог принять дальнейшее решение');
        }

        const call = toolCalls[0];
        this.logger.log(`[chat] Model decided to call tool: ${call.function.name}`);

        let args: any = {};
        try {
            args = JSON.parse(call.function.arguments);
        } catch (e) {
            this.logger.error('Failed to parse tool arguments');
        }

        if (call.function.name === 'process_career_path') {
            // Если профиля почему-то нет в request (например юзер просто переписывался и не кидал файл)
            // Мы достаем ProfileData из истории с помощью LLM (или обязываем парсить).
            // Для упрощения PoC: если есть файл - используем его.
            if (!request.profileData) {
                // Если нет файла, значит это просто тексты. Возвращаем фоллбэк.
                return {
                    type: 'questions',
                    data: ['Пожалуйста, загрузите ваше резюме в формате PDF перед тем как я смогу собрать финальную версию.'],
                    message: 'Агент захотел собрать резюме, но не нашел загруженного файла.'
                };
            }

            // Запускаем PoC Runner
            const runnerResult = await this.agentRunner.runPocFlow({ profileData: request.profileData, topVacancies: 1 });
            return {
                type: 'result',
                data: runnerResult,
                message: 'Отлично! Я проанализировал ваши данные, подобрал идеальную вакансию и сгенерировал под неё адаптивное резюме.'
            };
        }

        if (call.function.name === 'ask_clarification') {
            return {
                type: 'questions',
                data: args.questions || ['Не хватает данных, уточните ваш карьерный профиль.'],
                message: 'Мне нужно немного больше информации, чтобы быть вам полезным.'
            };
        }

        throw new BadRequestException('Unknown tool called by model');
    }
}
