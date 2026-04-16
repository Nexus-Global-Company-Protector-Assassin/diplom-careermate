import { Test, TestingModule } from '@nestjs/testing';
import { ResumesService } from './resumes.service';

describe('ResumesService', () => {
    let service: ResumesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ResumesService],
        }).compile();

        service = module.get<ResumesService>(ResumesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return initial history object', async () => {
        const result = await service.getHistory();
        expect(result).toHaveProperty('resumes');
        expect(result).toHaveProperty('history');
        expect(Array.isArray(result.resumes)).toBe(true);
        expect(Array.isArray(result.history)).toBe(true);
    });

    it('should generate cover letter text', () => {
        const result = service.generateCoverLetter('Google', 'Engineer');
        expect(result).toContain('Уважаемый HR-менеджер компании Google!');
        expect(result).toContain('вакансией "Engineer"');
    });

    it('should embed keyPoints in cover letter', () => {
        const result = service.generateCoverLetter('Test', 'Test', 'I have a cat');
        expect(result).toContain('I have a cat');
    });
});
