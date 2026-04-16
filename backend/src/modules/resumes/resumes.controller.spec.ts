import { Test, TestingModule } from '@nestjs/testing';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';

describe('ResumesController', () => {
    let controller: ResumesController;
    let service: ResumesService;

    beforeEach(async () => {
        const mockService = {
            getHistory: jest.fn().mockReturnValue({ test: true }),
            generateCoverLetter: jest.fn().mockReturnValue('mock text'),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ResumesController],
            providers: [
                {
                    provide: ResumesService,
                    useValue: mockService,
                },
            ],
        }).compile();

        controller = module.get<ResumesController>(ResumesController);
        service = module.get<ResumesService>(ResumesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return history', () => {
        expect(controller.getHistory()).toEqual({ test: true });
    });

    it('should return cover letter', () => {
        const body = { company: 'c', position: 'p' };
        expect(controller.generateCoverLetter(body)).toEqual({ text: 'mock text' });
        expect(service.generateCoverLetter).toHaveBeenCalledWith('c', 'p', undefined, undefined);
    });
});
