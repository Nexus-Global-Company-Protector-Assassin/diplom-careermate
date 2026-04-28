import { Test, TestingModule } from '@nestjs/testing';
import { VacanciesController } from './vacancies.controller';
import { VacanciesService } from './vacancies.service';

const mockUser = { userId: 'user-uuid-1', email: 'test@test.com' };

describe('VacanciesController', () => {
    let controller: VacanciesController;
    let service: VacanciesService;

    beforeEach(async () => {
        const mockService = {
            getVacancies: jest.fn().mockResolvedValue([{ id: 'v1' }]),
            searchAndSave: jest.fn().mockResolvedValue([{ id: 'v2' }]),
            getRecommendedForProfile: jest.fn().mockResolvedValue([]),
            getFavorites: jest.fn().mockResolvedValue(['v1']),
            toggleFavorite: jest.fn().mockResolvedValue({ isFavorite: true }),
            recordInteraction: jest.fn().mockResolvedValue(undefined),
            interviewPrep: jest.fn().mockResolvedValue({ questions: [] }),
            evaluateVacancy: jest.fn().mockResolvedValue({ grade: 'B' }),
            generateCoverLetter: jest.fn().mockResolvedValue({ coverLetter: 'text' }),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [VacanciesController],
            providers: [
                {
                    provide: VacanciesService,
                    useValue: mockService,
                },
            ],
        })
            .overrideGuard(require('../auth/jwt-auth.guard').JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<VacanciesController>(VacanciesController);
        service = module.get<VacanciesService>(VacanciesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return vacancies from getVacancies', async () => {
        const result = await controller.getVacancies('test', '10');
        expect(service.getVacancies).toHaveBeenCalledWith(expect.objectContaining({ query: 'test', limit: 10 }));
        expect(result).toEqual([{ id: 'v1' }]);
    });

    it('should call searchAndSave on POST /search', async () => {
        const result = await controller.searchAndSave({ query: 'dev', count: 5 });
        expect(service.searchAndSave).toHaveBeenCalledWith('dev', 5);
        expect(result).toEqual([{ id: 'v2' }]);
    });

    it('should pass userId from JWT to getRecommendedForProfile', async () => {
        (service.getRecommendedForProfile as jest.Mock).mockResolvedValue([]);
        const result = await controller.getRecommended(mockUser);
        expect(service.getRecommendedForProfile).toHaveBeenCalledWith(
            '',
            [],
            10,
            undefined,
            mockUser.userId,
        );
        expect(Array.isArray(result)).toBe(true);
    });

    it('should return favorite vacancy IDs', async () => {
        const result = await controller.getFavorites(mockUser);
        expect(service.getFavorites).toHaveBeenCalledWith(mockUser.userId);
        expect(result).toEqual(['v1']);
    });

    it('should toggle favorite vacancy', async () => {
        const result = await controller.toggleFavorite(mockUser, { vacancyId: 'v1' });
        expect(service.toggleFavorite).toHaveBeenCalledWith('v1', mockUser.userId);
        expect(result).toHaveProperty('isFavorite', true);
    });

    it('should call interviewPrep with userId', async () => {
        const result = await controller.getInterviewPrep(mockUser, 'vacancy-1');
        expect(service.interviewPrep).toHaveBeenCalledWith('vacancy-1', undefined, mockUser.userId);
    });

    it('should call evaluateVacancy with userId', async () => {
        const result = await controller.getEvaluation(mockUser, 'vacancy-1');
        expect(service.evaluateVacancy).toHaveBeenCalledWith('vacancy-1', undefined, mockUser.userId);
    });

    it('should call generateCoverLetter with userId', async () => {
        const result = await controller.getCoverLetter(mockUser, 'vacancy-1', undefined, 'ru');
        expect(service.generateCoverLetter).toHaveBeenCalledWith('vacancy-1', undefined, 'ru', mockUser.userId);
    });

    it('should pass userId to recordInteraction', async () => {
        await controller.trackInteraction(mockUser, 'vacancy-1', { type: 'click' });
        expect(service.recordInteraction).toHaveBeenCalledWith('vacancy-1', 'click', mockUser.userId);
    });
});
