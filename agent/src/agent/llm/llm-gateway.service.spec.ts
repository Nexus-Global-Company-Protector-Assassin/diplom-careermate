import { Test, TestingModule } from '@nestjs/testing';
import { LlmGatewayService } from './llm-gateway.service';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';

// Мокируем axios, чтобы не делать реальных запросов
jest.mock('axios', () => {
    const mockAxios = {
        create: jest.fn(() => ({
            post: jest.fn().mockResolvedValue({
                data: {
                    model: 'mocked-model',
                    choices: [
                        { message: { content: '{"result": "success"}', tool_calls: [] } }
                    ],
                    usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
                }
            }),
            isAxiosError: jest.fn().mockReturnValue(false)
        })),
        isAxiosError: jest.fn().mockReturnValue(false)
    };
    return {
        __esModule: true,
        default: mockAxios,
        ...mockAxios
    };
});

describe('LlmGatewayService', () => {
    let service: LlmGatewayService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LlmGatewayService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('mock-api-key')
                    }
                }
            ],
        }).compile();

        service = module.get<LlmGatewayService>(LlmGatewayService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should successfully parse valid JSON via generateJson', async () => {
        const schema = z.object({ result: z.string() });

        // Мокаем сам generateText
        jest.spyOn(service, 'generateText').mockResolvedValue({
            content: '{"result": "success"}',
            model: 'mocked',
            latencyMs: 10,
        });

        const response = await service.generateJson([{ role: 'user', content: 'test' }], schema);

        expect(response.data).toHaveProperty('result', 'success');
        expect(response.latencyMs).toBeGreaterThanOrEqual(0);
    });
});
