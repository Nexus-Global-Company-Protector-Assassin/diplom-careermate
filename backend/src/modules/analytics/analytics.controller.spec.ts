import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
    let controller: AnalyticsController;
    let service: AnalyticsService;

    beforeEach(async () => {
        const mockService = {
            getWeeklyReport: jest.fn().mockReturnValue([{ label: 'test' }]),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AnalyticsController],
            providers: [
                {
                    provide: AnalyticsService,
                    useValue: mockService,
                },
            ],
        }).compile();

        controller = module.get<AnalyticsController>(AnalyticsController);
        service = module.get<AnalyticsService>(AnalyticsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return weekly report', () => {
        const result = controller.getWeeklyReport();
        expect(service.getWeeklyReport).toHaveBeenCalled();
        expect(result).toEqual([{ label: 'test' }]);
    });
});
