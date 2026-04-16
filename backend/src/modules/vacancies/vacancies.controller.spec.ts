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

    it('should return vacancies from getVacancies', async () => {
        const result = await controller.getVacancies('test', '10');
        expect(service.getVacancies).toHaveBeenCalledWith('test', 10);
        expect(result).toEqual([{ id: 'v1' }]);
    });

    it('should call searchAndSave on POST /search', async () => {
        const result = await controller.searchAndSave({ query: 'dev', count: 5 });
        expect(service.searchAndSave).toHaveBeenCalledWith('dev', 5);
        expect(result).toEqual([{ id: 'v2' }]);
    });

    it('should return recommended (stub)', () => {
        const result = controller.getRecommended();
        expect(Array.isArray(result)).toBe(true);
    });

    it('should return responses (stub)', () => {
        const result = controller.getResponses();
        expect(Array.isArray(result)).toBe(true);
    });

    it('should mock applyToVacancy', () => {
        const result = controller.applyToVacancy({ vacancyId: '123' });
        expect(result).toHaveProperty('success', true);
    });

    it('should mock toggleFavorite', () => {
        const result = controller.toggleFavorite({ vacancyId: '123', isFavorite: true });
        expect(result).toHaveProperty('isFavorite', true);
    });
});
