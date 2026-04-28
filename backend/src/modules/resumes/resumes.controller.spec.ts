import { Test, TestingModule } from '@nestjs/testing';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';

const USER_ID = 'user-uuid-1';
const mockUser = { userId: USER_ID, email: 'test@test.com' };

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
        })
            .overrideGuard(require('../auth/jwt-auth.guard').JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<ResumesController>(ResumesController);
        service = module.get<ResumesService>(ResumesService);
    });

    it('should be defined', () => expect(controller).toBeDefined());

    it('getHistory should call service with userId', async () => {
        const result = await controller.getHistory(mockUser);
        expect(service.getHistory).toHaveBeenCalledWith(USER_ID);
        expect(result).toEqual({ resumes: [], history: [] });
    });

    it('saveResume should pass body fields and userId to service', async () => {
        await controller.saveResume(mockUser, { title: 'CV', subtitle: 'Dev', content: 'body', type: 'resume' });
        expect(service.saveResume).toHaveBeenCalledWith('CV', 'Dev', 'body', 'resume', undefined, USER_ID);
    });

    it('deleteResume should call service with id and userId', async () => {
        await controller.deleteResume(mockUser, 'r1');
        expect(service.deleteResume).toHaveBeenCalledWith('r1', USER_ID);
    });

    it('uploadResume should call uploadResumeFile with userId and return resume', async () => {
        const file = { buffer: Buffer.from('pdf'), originalname: 'cv.pdf', mimetype: 'application/pdf', size: 3 } as Express.Multer.File;
        const result = await controller.uploadResume(mockUser, file, 'My CV');
        expect(service.uploadResumeFile).toHaveBeenCalledWith(file, 'My CV', USER_ID);
        expect(result.fileKey).toBe('resumes/p/r2.pdf');
    });

    it('getDownloadUrl should return redirect object with presigned URL', async () => {
        const result = await controller.getDownloadUrl(mockUser, 'r2');
        expect(service.getDownloadUrl).toHaveBeenCalledWith('r2', USER_ID);
        expect(result).toEqual({ url: 'https://minio/bucket/key?sig=abc', statusCode: 302 });
    });
});
