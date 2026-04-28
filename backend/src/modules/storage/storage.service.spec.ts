import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
    PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
    GetObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));
jest.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: jest.fn().mockResolvedValue('https://minio/bucket/key?sig=abc'),
}));

describe('StorageService', () => {
    let service: StorageService;

    beforeEach(async () => {
        mockSend.mockClear();
        mockSend.mockResolvedValue({});
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StorageService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: (key: string) => ({
                            MINIO_ENDPOINT: 'localhost',
                            MINIO_PORT: '9000',
                            MINIO_ROOT_USER: 'minioadmin',
                            MINIO_ROOT_PASSWORD: 'minioadmin',
                            MINIO_BUCKET: 'careermate-local',
                            AWS_REGION: 'us-east-1',
                        }[key] ?? null),
                    },
                },
            ],
        }).compile();
        service = module.get<StorageService>(StorageService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('uploadFile should call S3 PutObjectCommand', async () => {
        const buffer = Buffer.from('pdf content');
        const key = await service.uploadFile(buffer, 'test.pdf', 'application/pdf');
        expect(key).toBe('test.pdf');
        expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('getPresignedDownloadUrl should return a signed URL string', async () => {
        const url = await service.getPresignedDownloadUrl('resumes/some-key.pdf');
        expect(url).toMatch(/^https?:\/\//);
    });
});
