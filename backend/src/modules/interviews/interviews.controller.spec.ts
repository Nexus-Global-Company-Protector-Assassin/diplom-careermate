import { Test, TestingModule } from '@nestjs/testing';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';

const USER_ID = 'user-uuid-1';
const mockUser = { userId: USER_ID, email: 'test@test.com' };

describe('InterviewsController', () => {
    let controller: InterviewsController;
    let service: InterviewsService;

    beforeEach(async () => {
        const mockService = {
            getAll: jest.fn().mockReturnValue([{ id: '1' }]),
            create: jest.fn().mockImplementation((data) => ({ id: '2', ...data })),
            updateStatus: jest.fn().mockImplementation((id, status) => ({ success: true, id, status })),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [InterviewsController],
            providers: [
                {
                    provide: InterviewsService,
                    useValue: mockService,
                },
            ],
        })
            .overrideGuard(require('../auth/jwt-auth.guard').JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<InterviewsController>(InterviewsController);
        service = module.get<InterviewsService>(InterviewsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return interviews array', async () => {
        const result = await controller.getAll(mockUser);
        expect(result).toEqual([{ id: '1' }]);
        expect(service.getAll).toHaveBeenCalledWith(USER_ID);
    });

    it('should create interview', async () => {
        const body = { company: '1', position: '2', date: '3', time: '4' };
        const result = await controller.create(mockUser, body);
        expect(result).toEqual({ id: '2', ...body });
        expect(service.create).toHaveBeenCalledWith(body, USER_ID);
    });

    it('should update status', async () => {
        const body = { status: 'rejected' };
        const result = await controller.updateStatus('123', body);
        expect(result).toEqual({ success: true, id: '123', status: 'rejected' });
    });
});
