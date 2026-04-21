// src/modules/ai/providers/llm-provider.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlmProviderService } from './llm-provider.service';

jest.mock('langchain/chat_models/openai', () => ({
    ChatOpenAI: jest.fn().mockImplementation((opts) => ({ modelName: opts.modelName, _type: 'openai' })),
}));

const makeConfig = (key: string | null) => ({
    get: jest.fn((k: string, def?: string) => {
        if (k === 'LLM_API_KEY') return key;
        if (k === 'LLM_API_BASE_URL') return 'https://openrouter.ai/api/v1';
        if (k === 'LLM_MODEL_NAME_SMART') return 'google/gemini-2.0-flash-001';
        return def ?? null;
    }),
});

describe('LlmProviderService', () => {
    it('should be defined', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LlmProviderService, { provide: ConfigService, useValue: makeConfig('sk-test') }],
        }).compile();
        const service = module.get<LlmProviderService>(LlmProviderService);
        expect(service).toBeDefined();
    });

    it('should return null when LLM_API_KEY is not set', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LlmProviderService, { provide: ConfigService, useValue: makeConfig(null) }],
        }).compile();
        const service = module.get<LlmProviderService>(LlmProviderService);
        expect(service.chat).toBeNull();
    });

    it('should return ChatOpenAI instance when LLM_API_KEY is set', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LlmProviderService, { provide: ConfigService, useValue: makeConfig('sk-test') }],
        }).compile();
        const service = module.get<LlmProviderService>(LlmProviderService);
        expect(service.chat).not.toBeNull();
    });

    it('should return the same instance on repeated calls (lazy singleton)', async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LlmProviderService, { provide: ConfigService, useValue: makeConfig('sk-test') }],
        }).compile();
        const service = module.get<LlmProviderService>(LlmProviderService);
        expect(service.chat).toBe(service.chat);
    });
});
