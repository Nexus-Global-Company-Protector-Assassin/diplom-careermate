import { Test, TestingModule } from '@nestjs/testing';
import { VacanciesController } from './vacancies.controller';
import { VacanciesService } from './vacancies.service';

describe('VacanciesController', () => {
    let controller: VacanciesController;
    let service: VacanciesService;

    beforeEach(async () => {
        const mockService = {
            getVacancies: jest.fn().mockResolvedValue([{ id: 'v1' }]),
            searchAndSave: jest.fn().mockResolvedValue([{ id: 'v2' }]),
            getRecommendedForProfile: jest.fn().mockResolvedValue([]),
            interviewPrep: jest.fn().mockResolvedValue({ questions: [] }),
            evaluateVacancy: jest.fn().mockResolvedValue({ score: 80 }),
            generateCoverLetter: jest.fn().mockResolvedValue({ coverLetter: 'test' }),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [VacanciesController],
            providers: [
                {
                    provide: VacanciesService,
                    useValue: mockService,
                },
            ],
        }).compile();

        controller = module.get<VacanciesController>(VacanciesController);
        service = module.get<VacanciesService>(VacanciesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should call getVacancies with filters object', async () => {
        const result = await controller.getVacancies('test', '10');
        expect(service.getVacancies).toHaveBeenCalledWith(
            expect.objectContaining({ query: 'test', limit: 10 }),
        );
        expect(result).toEqual([{ id: 'v1' }]);
    });

    it('should use default limit 20 when not provided', async () => {
        await controller.getVacancies();
        expect(service.getVacancies).toHaveBeenCalledWith(
            expect.objectContaining({ limit: 20 }),
        );
    });

    it('should call searchAndSave on POST /search', async () => {
        const result = await controller.searchAndSave({ query: 'dev', count: 5 });
        expect(service.searchAndSave).toHaveBeenCalledWith('dev', 5);
        expect(result).toEqual([{ id: 'v2' }]);
    });

    it('should use default count 10 when not provided in searchAndSave', async () => {
        await controller.searchAndSave({ query: 'dev' });
        expect(service.searchAndSave).toHaveBeenCalledWith('dev', 10);
    });

    it('should return recommended vacancies as array', async () => {
        const result = await controller.getRecommended();
        expect(Array.isArray(result)).toBe(true);
    });

    it('should return responses as empty array (stub)', () => {
        const result = controller.getResponses();
        expect(Array.isArray(result)).toBe(true);
    });

    it('should return success on applyToVacancy', () => {
        const result = controller.applyToVacancy({ vacancyId: '123' });
        expect(result).toHaveProperty('success', true);
    });

    it('should return isFavorite on toggleFavorite', () => {
        const result = controller.toggleFavorite({ vacancyId: '123', isFavorite: true });
        expect(result).toHaveProperty('isFavorite', true);
    });
});
