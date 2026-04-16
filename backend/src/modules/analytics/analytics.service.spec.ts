import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
    let service: AnalyticsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AnalyticsService],
        }).compile();

        service = module.get<AnalyticsService>(AnalyticsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return weekly report with 4 items', () => {
        const result = service.getWeeklyReport();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(4);
        expect(result[0]).toHaveProperty('icon');
        expect(result[0]).toHaveProperty('value');
        expect(result[0]).toHaveProperty('label');
    });
});
