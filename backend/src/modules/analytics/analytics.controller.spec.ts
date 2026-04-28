import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

const USER_ID = 'user-uuid-1';
const mockUser = { userId: USER_ID, email: 'test@test.com' };

describe('AnalyticsController', () => {
    let controller: AnalyticsController;
    let service: AnalyticsService;

    beforeEach(async () => {
        const mockService = {
            getWeeklyReport: jest.fn().mockReturnValue([{ label: 'test' }]),
            getDashboardSummary: jest.fn().mockResolvedValue({ fullName: 'Test' }),
            getAnalyticsStats: jest.fn().mockResolvedValue({ statsCards: [] }),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AnalyticsController],
            providers: [
                {
                    provide: AnalyticsService,
                    useValue: mockService,
                },
            ],
        })
            .overrideGuard(require('../auth/jwt-auth.guard').JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<AnalyticsController>(AnalyticsController);
        service = module.get<AnalyticsService>(AnalyticsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return weekly report', () => {
        const result = controller.getWeeklyReport(mockUser);
        expect(service.getWeeklyReport).toHaveBeenCalledWith(USER_ID);
        expect(result).toEqual([{ label: 'test' }]);
    });

    it('should return dashboard summary', async () => {
        const result = await controller.getDashboardSummary(mockUser);
        expect(service.getDashboardSummary).toHaveBeenCalledWith(USER_ID);
        expect(result).toEqual({ fullName: 'Test' });
    });

    it('should return analytics stats', async () => {
        const result = await controller.getAnalyticsStats(mockUser, 'week');
        expect(service.getAnalyticsStats).toHaveBeenCalledWith('week', USER_ID);
        expect(result).toEqual({ statsCards: [] });
    });
});
