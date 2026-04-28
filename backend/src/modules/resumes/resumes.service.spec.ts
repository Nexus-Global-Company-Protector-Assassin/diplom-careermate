import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AiService } from '../ai/ai.service';
import { QuotaService } from '../quota/quota.service';

const USER_ID = 'user-uuid-1';
const PROFILE_ID = 'profile-uuid-1';
const mockProfile = { id: PROFILE_ID, userId: USER_ID };

const mockResume = {
    id: 'resume-uuid-1',
    profileId: PROFILE_ID,
    title: 'Моё резюме',
    subtitle: 'Frontend Developer',
    content: 'Content here',
    type: 'resume',
    status: 'active',
    reviewData: null,
    fileKey: null,
    updatedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-01'),
};

const mockVacancyResponse = {
    id: 'response-uuid-1',
    profileId: PROFILE_ID,
    position: 'Frontend Developer',
    company: 'Yandex',
    responseDate: new Date('2024-02-01'),
    status: 'sent',
    statusColor: 'green',
};

describe('ResumesService', () => {
    let service: ResumesService;
    let mockPrisma: any;
    let mockStorage: any;

    beforeEach(async () => {
        mockPrisma = {
            profile: { findFirst: jest.fn().mockResolvedValue(mockProfile) },
            resume: {
                findMany: jest.fn().mockResolvedValue([mockResume]),
                findFirst: jest.fn().mockResolvedValue(mockResume),
                create: jest.fn().mockResolvedValue(mockResume),
                deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
                count: jest.fn().mockResolvedValue(0),
            },
            vacancyResponse: { findMany: jest.fn().mockResolvedValue([mockVacancyResponse]) },
        };

        mockStorage = {
            uploadFile: jest.fn().mockResolvedValue(`resumes/${PROFILE_ID}/resume-uuid-1.pdf`),
            getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://minio/bucket/key?sig=abc'),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ResumesService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: StorageService, useValue: mockStorage },
                { provide: AiService, useValue: { generateCoverLetter: jest.fn().mockResolvedValue({ coverLetter: 'mock cover letter' }) } },
                { provide: QuotaService, useValue: { assertAiCall: jest.fn().mockResolvedValue(undefined), commitAiCall: jest.fn().mockResolvedValue(undefined), assertResumeLimit: jest.fn().mockResolvedValue(undefined) } },
            ],
        }).compile();

        service = module.get<ResumesService>(ResumesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getHistory', () => {
        it('should return mapped resumes and history', async () => {
            const result = await service.getHistory(USER_ID);
            expect(result.resumes).toHaveLength(1);
            expect(result.history).toHaveLength(1);
            expect(result.resumes[0].title).toBe('Моё резюме');
        });

        it('should throw NotFoundException when no profile exists', async () => {
            mockPrisma.profile.findFirst.mockResolvedValue(null);
            await expect(service.getHistory(USER_ID)).rejects.toThrow(NotFoundException);
        });
    });

    describe('saveResume', () => {
        it('should create a resume record in prisma', async () => {
            const result = await service.saveResume('Test', 'Sub', 'content', 'resume', undefined, USER_ID);
            expect(mockPrisma.resume.create).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ title: 'Test' }) }),
            );
            expect(result.title).toBe('Моё резюме');
        });
    });

    describe('deleteResume', () => {
        it('should call prisma deleteMany', async () => {
            await service.deleteResume('resume-uuid-1', USER_ID);
            expect(mockPrisma.resume.deleteMany).toHaveBeenCalledWith({
                where: { id: 'resume-uuid-1', profileId: PROFILE_ID },
            });
        });
    });

    describe('uploadResumeFile', () => {
        it('should upload to storage and create resume record with fileKey', async () => {
            const file = {
                buffer: Buffer.from('pdf'),
                originalname: 'cv.pdf',
                mimetype: 'application/pdf',
                size: 3,
            } as Express.Multer.File;

            mockPrisma.resume.create.mockResolvedValue({
                ...mockResume,
                id: 'new-id',
                fileKey: `resumes/${PROFILE_ID}/resume-uuid-1.pdf`,
            });

            const result = await service.uploadResumeFile(file, 'My Resume', USER_ID);
            expect(mockStorage.uploadFile).toHaveBeenCalledWith(
                file.buffer,
                expect.stringContaining(`resumes/${PROFILE_ID}/`),
                'application/pdf',
            );
            expect(mockPrisma.resume.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ title: 'My Resume', fileKey: expect.any(String) }),
                }),
            );
            expect(result.fileKey).toBeDefined();
        });
    });

    describe('getDownloadUrl', () => {
        it('should return presigned URL for resume with fileKey', async () => {
            mockPrisma.resume.findFirst.mockResolvedValue({ ...mockResume, fileKey: 'resumes/p/r.pdf' });
            const url = await service.getDownloadUrl('resume-uuid-1', USER_ID);
            expect(url).toMatch(/^https?:\/\//);
            expect(mockStorage.getPresignedDownloadUrl).toHaveBeenCalledWith('resumes/p/r.pdf');
        });

        it('should throw NotFoundException when resume has no fileKey', async () => {
            mockPrisma.resume.findFirst.mockResolvedValue({ ...mockResume, fileKey: null });
            await expect(service.getDownloadUrl('resume-uuid-1', USER_ID)).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when resume not found', async () => {
            mockPrisma.resume.findFirst.mockResolvedValue(null);
            await expect(service.getDownloadUrl('resume-uuid-1', USER_ID)).rejects.toThrow(NotFoundException);
        });
    });
});
