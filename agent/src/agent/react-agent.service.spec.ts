import { Test, TestingModule } from '@nestjs/testing';
import { ReActAgentService } from './react-agent.service';
import { LlmGatewayService } from './llm/llm-gateway.service';
import { AgentRunnerService } from './agent.service';

describe('ReActAgentService', () => {
    let service: ReActAgentService;
    let llmGateway: LlmGatewayService;
    let agentRunner: AgentRunnerService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReActAgentService,
                {
                    provide: LlmGatewayService,
                    useValue: {
                        generateText: jest.fn(),
                    },
                },
                {
                    provide: AgentRunnerService,
                    useValue: {
                        runPocFlow: jest.fn().mockResolvedValue({ summary: 'mock resume' }),
                    },
                },
            ],
        }).compile();

        service = module.get<ReActAgentService>(ReActAgentService);
        llmGateway = module.get<LlmGatewayService>(LlmGatewayService);
        agentRunner = module.get<AgentRunnerService>(AgentRunnerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should call process_career_path if data is sufficient', async () => {
        jest.spyOn(llmGateway, 'generateText').mockResolvedValue({
            content: '',
            model: 'test',
            latencyMs: 100,
            tool_calls: [{
                function: {
                    name: 'process_career_path',
                    arguments: '{"confidence": 100}'
                }
            }]
        });

        const result = await service.chat({
            messages: [{ role: 'user', content: 'hello' }],
            profileData: { fullName: 'Test', skills: [] }
        });

        expect(result.type).toEqual('result');
        expect(agentRunner.runPocFlow).toHaveBeenCalled();
    });

    it('should call ask_clarification if data is insufficient', async () => {
        jest.spyOn(llmGateway, 'generateText').mockResolvedValue({
            content: '',
            model: 'test',
            latencyMs: 100,
            tool_calls: [{
                function: {
                    name: 'ask_clarification',
                    arguments: '{"questions": ["What is your role?"]}'
                }
            }]
        });

        const result = await service.chat({
            messages: [{ role: 'user', content: 'hello' }]
        });

        expect(result.type).toEqual('questions');
        expect(result.data).toEqual(['What is your role?']);
    });
});
