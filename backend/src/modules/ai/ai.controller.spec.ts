import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

const USER_ID = 'user-uuid-1';
const mockUser = { userId: USER_ID, email: 'test@test.com' };

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
            .overrideGuard(require('../auth/jwt-auth.guard').JwtAuthGuard)
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
        const result = await controller.chat(mockUser, body);

        expect(service.generateResponse).toHaveBeenCalledWith('hello', USER_ID);
        expect(result).toEqual({ response: 'mock response' });
    });
});
