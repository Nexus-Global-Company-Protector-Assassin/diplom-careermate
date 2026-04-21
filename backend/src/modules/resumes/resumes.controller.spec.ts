import { Test, TestingModule } from '@nestjs/testing';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';

describe('ResumesController', () => {
    let controller: ResumesController;
    let service: ResumesService;

    beforeEach(async () => {
        const mockService = {
            getHistory: jest.fn().mockResolvedValue({ resumes: [], history: [] }),
            generateCoverLetter: jest.fn().mockResolvedValue('mock cover letter text'),
            saveResume: jest.fn().mockResolvedValue({ id: 'r1', title: 'Test' }),
            deleteResume: jest.fn().mockResolvedValue({ success: true }),
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

    it('should return history from service', async () => {
        const result = await controller.getHistory();
        expect(service.getHistory).toHaveBeenCalled();
        expect(result).toEqual({ resumes: [], history: [] });
    });

    it('should return cover letter wrapped in { text }', async () => {
        const body = { company: 'Google', position: 'Engineer' };
        const result = await controller.generateCoverLetter(body);
        expect(service.generateCoverLetter).toHaveBeenCalledWith('Google', 'Engineer', undefined, undefined);
        expect(result).toEqual({ text: 'mock cover letter text' });
    });

    it('should pass keyPoints and profile to service', async () => {
        const body = { company: 'X', position: 'Y', keyPoints: 'some points', profile: { fullName: 'Test' } };
        await controller.generateCoverLetter(body);
        expect(service.generateCoverLetter).toHaveBeenCalledWith('X', 'Y', 'some points', { fullName: 'Test' });
    });

    it('should save resume and return DB record', async () => {
        const body = { title: 'Test', subtitle: 'Sub', content: 'c', type: 'resume' };
        const result = await controller.saveResume(body);
        expect(service.saveResume).toHaveBeenCalledWith('Test', 'Sub', 'c', 'resume', undefined);
        expect(result).toEqual({ id: 'r1', title: 'Test' });
    });

    it('should delete resume and return success', async () => {
        const result = await controller.deleteResume('r1');
        expect(service.deleteResume).toHaveBeenCalledWith('r1');
        expect(result).toEqual({ success: true });
    });
});
