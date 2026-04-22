import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

describe('AiController', () => {
    let controller: AiController;
    let service: AiService;

    beforeEach(async () => {
        const mockService = {
            generateResponse: jest.fn().mockReturnValue('mock response'),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AiController],
            providers: [
                {
                    provide: AiService,
                    useValue: mockService,
                },
            ],
        })
            .overrideGuard(ThrottlerGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<AiController>(AiController);
        service = module.get<AiService>(AiService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should call service and return response', async () => {
        const body = { message: 'hello' };
        const result = await controller.chat(body);

        expect(service.generateResponse).toHaveBeenCalledWith('hello');
        expect(result).toEqual({ response: 'mock response' });
    });
});
