// src/modules/ai/providers/llm-provider.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from 'langchain/chat_models/openai';

@Injectable()
export class LlmProviderService {
    private _chat: ChatOpenAI | null = null;
    private _fastChat: ChatOpenAI | null = null;

    constructor(private readonly config: ConfigService) {}

    get chat(): ChatOpenAI | null {
        const apiKey = this.config.get<string>('LLM_API_KEY');
        if (!apiKey) return null;
        if (!this._chat) {
            const baseURL = this.config.get<string>('LLM_API_BASE_URL', 'https://api.openai.com/v1');
            const modelName = this.config.get<string>('LLM_MODEL_NAME_SMART', 'gpt-4o-mini');
            this._chat = new ChatOpenAI({
                openAIApiKey: apiKey,
                modelName,
                configuration: { baseURL },
            });
        }
        return this._chat;
    }

    get fastChat(): ChatOpenAI | null {
        const apiKey = this.config.get<string>('LLM_API_KEY');
        if (!apiKey) return null;
        if (!this._fastChat) {
            const baseURL = this.config.get<string>('LLM_API_BASE_URL', 'https://api.openai.com/v1');
            const modelName = this.config.get<string>('LLM_MODEL_NAME_FAST', 'gpt-4o-mini');
            this._fastChat = new ChatOpenAI({
                openAIApiKey: apiKey,
                modelName,
                configuration: { baseURL },
            });
        }
        return this._fastChat;
    }
}
