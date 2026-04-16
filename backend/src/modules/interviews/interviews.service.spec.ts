import { Test, TestingModule } from '@nestjs/testing';
import { InterviewsService } from './interviews.service';

describe('InterviewsService', () => {
    let service: InterviewsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [InterviewsService],
        }).compile();

        service = module.get<InterviewsService>(InterviewsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return interviews', async () => {
        const result = await service.getAll();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should create interview and return default object', () => {
        const dto = { company: 'Test', position: 'Test', date: '2025', time: '10:00' };
        const result = service.create(dto);
        expect(result).toMatchObject(dto);
        expect(result).toHaveProperty('id');
    });

    it('should return updated status object', () => {
        const result = service.updateStatus('1', 'completed');
        expect(result).toEqual(expect.objectContaining({ id: '1', status: 'completed' }));
    });
});
