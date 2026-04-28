import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../database/prisma.service';

describe('AnalyticsService', () => {
    let service: AnalyticsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalyticsService,
                {
                    provide: PrismaService,
                    useValue: {
                        vacancy: { count: jest.fn().mockResolvedValue(0) },
                        interview: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
                        favoriteVacancy: { count: jest.fn().mockResolvedValue(0) },
                        resume: { count: jest.fn().mockResolvedValue(0) },
                        profile: { findFirst: jest.fn().mockResolvedValue(null) },
                    },
                },
            ],
        }).compile();

        service = module.get<AnalyticsService>(AnalyticsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return weekly report with 4 items', async () => {
        const result = await service.getWeeklyReport('user-uuid-1');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(4);
        expect(result[0]).toHaveProperty('icon');
        expect(result[0]).toHaveProperty('value');
        expect(result[0]).toHaveProperty('label');
    });
});
