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
            uploadResumeFile: jest.fn().mockResolvedValue({ id: 'r2', title: 'Uploaded', fileKey: 'resumes/p/r2.pdf' }),
            getDownloadUrl: jest.fn().mockResolvedValue('https://minio/bucket/key?sig=abc'),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ResumesController],
            providers: [{ provide: ResumesService, useValue: mockService }],
        }).compile();

        controller = module.get<ResumesController>(ResumesController);
        service = module.get<ResumesService>(ResumesService);
    });

    it('should be defined', () => expect(controller).toBeDefined());

    it('getHistory should call service', async () => {
        const result = await controller.getHistory();
        expect(service.getHistory).toHaveBeenCalled();
        expect(result).toEqual({ resumes: [], history: [] });
    });

    it('saveResume should pass body fields to service', async () => {
        await controller.saveResume({ title: 'CV', subtitle: 'Dev', content: 'body', type: 'resume' });
        expect(service.saveResume).toHaveBeenCalledWith('CV', 'Dev', 'body', 'resume', undefined);
    });

    it('deleteResume should call service with id', async () => {
        await controller.deleteResume('r1');
        expect(service.deleteResume).toHaveBeenCalledWith('r1');
    });

    it('uploadResume should call uploadResumeFile and return resume', async () => {
        const file = { buffer: Buffer.from('pdf'), originalname: 'cv.pdf', mimetype: 'application/pdf', size: 3 } as Express.Multer.File;
        const result = await controller.uploadResume(file, 'My CV');
        expect(service.uploadResumeFile).toHaveBeenCalledWith(file, 'My CV');
        expect(result.fileKey).toBe('resumes/p/r2.pdf');
    });

    it('getDownloadUrl should redirect to presigned URL', async () => {
        const res = { redirect: jest.fn() } as any;
        await controller.getDownloadUrl('r2', res);
        expect(service.getDownloadUrl).toHaveBeenCalledWith('r2');
        expect(res.redirect).toHaveBeenCalledWith('https://minio/bucket/key?sig=abc');
    });
});
