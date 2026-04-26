# Storage (MinIO/S3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a `StorageModule` backed by MinIO/S3 so uploaded PDF résumés are stored as actual files in object storage, not as text in Postgres; add a backend upload proxy endpoint and presigned-URL download.

**Architecture:** `StorageService` wraps `@aws-sdk/client-s3` and works with both MinIO (dev, already in docker-compose) and real AWS S3 (prod) via env-vars. A new `POST /resumes/upload` endpoint receives a multipart file via multer, stores it in MinIO, proxies it to the ML agent for AI review, then persists the résumé record (with `fileKey`) to Postgres. `GET /resumes/:id/file` returns a presigned download URL. The frontend `use-review-resume` hook switches from calling the ML agent directly to calling this backend endpoint.

**Tech Stack:** NestJS, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, multer (bundled with `@nestjs/platform-express`), `@types/multer`, Prisma, Next.js / React Query

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `backend/src/modules/storage/storage.service.ts` | S3/MinIO client, `uploadFile`, `getPresignedDownloadUrl` |
| Create | `backend/src/modules/storage/storage.module.ts` | NestJS module, exports StorageService |
| Create | `backend/src/modules/storage/storage.service.spec.ts` | Unit tests for StorageService |
| Modify | `backend/prisma/schema.prisma` | Add `fileKey String?` to Resume model |
| Modify | `backend/src/modules/resumes/resumes.service.ts` | Add `uploadResumeFile`, `getDownloadUrl` |
| Modify | `backend/src/modules/resumes/resumes.controller.ts` | Add `POST /upload`, `GET /:id/file` |
| Modify | `backend/src/modules/resumes/resumes.module.ts` | Import StorageModule |
| Modify | `backend/src/app.module.ts` | Import StorageModule |
| Modify | `backend/src/modules/resumes/resumes.service.spec.ts` | Add tests for new methods |
| Modify | `backend/src/modules/resumes/resumes.controller.spec.ts` | Add tests for new endpoints |
| Modify | `frontend/src/features/resume/api/use-review-resume.ts` | Call backend instead of ML agent |

---

## Task 1: Install dev type dependency

**Files:**
- Modify: `backend/package.json` (via npm)

- [ ] **Step 1: Install `@types/multer`**

```bash
cd backend && npm install --save-dev @types/multer
```

Expected output: `added 1 package`

- [ ] **Step 2: Commit**

```bash
cd backend && git add package.json package-lock.json
git commit -m "chore(storage): add @types/multer dev dependency"
```

---

## Task 2: Create StorageService

**Files:**
- Create: `backend/src/modules/storage/storage.service.ts`
- Create: `backend/src/modules/storage/storage.module.ts`
- Create: `backend/src/modules/storage/storage.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/src/modules/storage/storage.service.spec.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx jest storage.service.spec --no-coverage 2>&1 | tail -20
```

Expected: FAIL — `Cannot find module './storage.service'`

- [ ] **Step 3: Create StorageService**

Create `backend/src/modules/storage/storage.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly client: S3Client;
    private readonly bucket: string;

    constructor(private readonly config: ConfigService) {
        const endpoint = config.get<string>('MINIO_ENDPOINT');
        const port = config.get<string>('MINIO_PORT') || '9000';
        const region = config.get<string>('AWS_REGION') || 'us-east-1';

        if (endpoint) {
            // MinIO / local S3-compatible
            this.client = new S3Client({
                endpoint: `http://${endpoint}:${port}`,
                region,
                credentials: {
                    accessKeyId: config.get<string>('MINIO_ROOT_USER') || 'minioadmin',
                    secretAccessKey: config.get<string>('MINIO_ROOT_PASSWORD') || 'minioadmin',
                },
                forcePathStyle: true,
            });
            this.bucket = config.get<string>('MINIO_BUCKET') || 'careermate-local';
        } else {
            // Real AWS S3
            this.client = new S3Client({
                region,
                credentials: {
                    accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID') || '',
                    secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY') || '',
                },
            });
            this.bucket = config.get<string>('AWS_S3_BUCKET') || 'careermate-storage';
        }
    }

    async uploadFile(buffer: Buffer, key: string, contentType: string): Promise<string> {
        await this.client.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        }));
        this.logger.log(`Uploaded ${key} to bucket ${this.bucket}`);
        return key;
    }

    async getPresignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
        const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
        return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    }
}
```

- [ ] **Step 4: Create StorageModule**

Create `backend/src/modules/storage/storage.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

@Module({
    providers: [StorageService],
    exports: [StorageService],
})
export class StorageModule {}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd backend && npx jest storage.service.spec --no-coverage 2>&1 | tail -20
```

Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/storage/
git commit -m "feat(storage): add StorageService and StorageModule (MinIO/S3)"
```

---

## Task 3: Prisma — add fileKey to Resume

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Add `fileKey` field to Resume model**

In `backend/prisma/schema.prisma`, find the Resume model and add the field after `reviewData`:

```prisma
model Resume {
  id         String   @id @default(uuid())
  profileId  String
  profile    Profile  @relation(fields: [profileId], references: [id])
  title      String   @default("Мое резюме")
  subtitle   String?
  content    String
  status     String   @default("draft")
  type       String   @default("resume")
  version    Int      @default(1)
  reviewData Json?
  fileKey    String?  // S3/MinIO object key for the original uploaded file
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

- [ ] **Step 2: Generate and run migration**

```bash
cd backend && npx prisma migrate dev --name add_resume_file_key
```

Expected: `The following migration(s) have been applied: ...add_resume_file_key`

- [ ] **Step 3: Verify Prisma client is updated**

```bash
cd backend && npx prisma generate
```

Expected: `Generated Prisma Client`

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(storage): add fileKey field to Resume model"
```

---

## Task 4: ResumesService — uploadResumeFile and getDownloadUrl

**Files:**
- Modify: `backend/src/modules/resumes/resumes.service.ts`
- Modify: `backend/src/modules/resumes/resumes.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Write failing tests for the new methods**

Add to `backend/src/modules/resumes/resumes.service.spec.ts` (inside the existing `describe` block, after existing tests):

```typescript
// At top of file, add StorageService import:
// import { StorageService } from '../storage/storage.service';
// Add to mockService providers:
// { provide: StorageService, useValue: mockStorageService }

// Add this before the describe block:
const mockStorageService = {
    uploadFile: jest.fn().mockResolvedValue('resumes/profile-uuid-1/resume-uuid-1.pdf'),
    getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://minio/bucket/key?sig=abc'),
};

// Add inside beforeEach, in the providers array:
// { provide: StorageService, useValue: mockStorageService }

// Add these test cases:
describe('uploadResumeFile', () => {
    it('should upload to storage and save resume record with fileKey', async () => {
        const file = {
            buffer: Buffer.from('pdf'),
            originalname: 'cv.pdf',
            mimetype: 'application/pdf',
            size: 3,
        } as Express.Multer.File;

        mockPrisma.resume.create.mockResolvedValue({
            ...mockResume,
            id: 'new-id',
            fileKey: 'resumes/profile-uuid-1/new-id.pdf',
        });

        const result = await service.uploadResumeFile(file, 'My Resume');
        expect(mockStorageService.uploadFile).toHaveBeenCalled();
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
        const url = await service.getDownloadUrl('resume-uuid-1');
        expect(url).toMatch(/^https?:\/\//);
    });

    it('should throw NotFoundException when resume has no fileKey', async () => {
        mockPrisma.resume.findFirst.mockResolvedValue({ ...mockResume, fileKey: null });
        await expect(service.getDownloadUrl('resume-uuid-1')).rejects.toThrow(NotFoundException);
    });
});
```

- [ ] **Step 2: Update the full resumes.service.spec.ts**

Replace the contents of `backend/src/modules/resumes/resumes.service.spec.ts` with:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';

const PROFILE_ID = 'profile-uuid-1';
const mockProfile = { id: PROFILE_ID };

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
            ],
        }).compile();

        service = module.get<ResumesService>(ResumesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getHistory', () => {
        it('should return mapped resumes and history', async () => {
            const result = await service.getHistory();
            expect(result.resumes).toHaveLength(1);
            expect(result.history).toHaveLength(1);
            expect(result.resumes[0].title).toBe('Моё резюме');
        });

        it('should throw NotFoundException when no profile exists', async () => {
            mockPrisma.profile.findFirst.mockResolvedValue(null);
            await expect(service.getHistory()).rejects.toThrow(NotFoundException);
        });
    });

    describe('saveResume', () => {
        it('should create a resume record in prisma', async () => {
            const result = await service.saveResume('Test', 'Sub', 'content', 'resume');
            expect(mockPrisma.resume.create).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ title: 'Test' }) }),
            );
            expect(result.title).toBe('Моё резюме');
        });
    });

    describe('deleteResume', () => {
        it('should call prisma deleteMany', async () => {
            await service.deleteResume('resume-uuid-1');
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

            const result = await service.uploadResumeFile(file, 'My Resume');
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
            const url = await service.getDownloadUrl('resume-uuid-1');
            expect(url).toMatch(/^https?:\/\//);
            expect(mockStorage.getPresignedDownloadUrl).toHaveBeenCalledWith('resumes/p/r.pdf');
        });

        it('should throw NotFoundException when resume has no fileKey', async () => {
            mockPrisma.resume.findFirst.mockResolvedValue({ ...mockResume, fileKey: null });
            await expect(service.getDownloadUrl('resume-uuid-1')).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when resume not found', async () => {
            mockPrisma.resume.findFirst.mockResolvedValue(null);
            await expect(service.getDownloadUrl('resume-uuid-1')).rejects.toThrow(NotFoundException);
        });
    });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd backend && npx jest resumes.service.spec --no-coverage 2>&1 | tail -20
```

Expected: FAIL — `StorageService` not in providers / methods not found

- [ ] **Step 4: Implement new methods in ResumesService**

Replace `backend/src/modules/resumes/resumes.service.ts` with:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ResumesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    private async getProfileId() {
        const profile = await this.prisma.profile.findFirst();
        if (!profile) {
            throw new NotFoundException('Должен существовать хотя бы один профиль (demo user)');
        }
        return profile.id;
    }

    async getHistory() {
        const profileId = await this.getProfileId();

        const resumes = await this.prisma.resume.findMany({
            where: { profileId },
            orderBy: { createdAt: 'desc' }
        });

        const history = await this.prisma.vacancyResponse.findMany({
            where: { profileId },
            orderBy: { responseDate: 'desc' }
        });

        const mappedResumes = resumes.map(r => ({
            id: r.id,
            title: r.title,
            subtitle: r.subtitle || '',
            content: r.content,
            reviewData: r.reviewData || null,
            fileKey: (r as any).fileKey || null,
            updated: r.updatedAt.toLocaleDateString("ru-RU"),
            status: r.status === 'active' ? 'Активное' : r.status === 'draft' ? 'Черновик' : 'Устаревшее',
            statusColor: r.status === 'active'
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : r.status === 'draft'
                ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        }));

        const mappedHistory = history.map(h => ({
            id: h.id,
            name: h.position,
            company: h.company,
            date: h.responseDate.toLocaleDateString("ru-RU"),
            status: h.status === 'sent' ? 'Отправлено' : h.status === 'invited' ? 'Приглашение' : h.status === 'rejected' ? 'Отказ' : 'Загружено',
            statusColor: h.statusColor,
        }));

        return { resumes: mappedResumes, history: mappedHistory };
    }

    async generateCoverLetter(company: string, position: string, keyPoints?: string, profile?: any) {
        const name = profile?.fullName || "Пользователь";
        const email = profile?.aboutMe?.match(/Email:\s*(.*)/)?.[1] || "user@example.com";
        const phone = profile?.phone || "+7 (000) 000-00-00";

        const text = `Уважаемый HR-менеджер компании ${company}!

Я с большим интересом ознакомился с вакансией "${position}" и хотел бы предложить свою кандидатуру на данную позицию.

Имея глубокий опыт и релевантные навыки, я уверен, что смогу внести значительный вклад в развитие вашей команды.

Мои ключевые компетенции отлично совпадают с вашими требованиями.

${keyPoints ? `\nДополнительно хочу отметить: ${keyPoints}\n` : ""}
Буду рад возможности обсудить, как мой опыт может быть полезен для ${company}. Готов предоставить дополнительную информацию и ответить на любые вопросы.

(Сгенерировано бэкендом)

С уважением,
${name}
${email} | ${phone}`;

        try {
            const profileId = await this.getProfileId();
            await this.prisma.resume.create({
                data: {
                    profileId,
                    title: `Сопроводительное: ${company}`,
                    subtitle: `Позиция: ${position}`,
                    content: text,
                    type: 'cover_letter',
                    status: 'draft'
                }
            });
        } catch (e) {
            // ignore if no profile
        }

        return text;
    }

    async saveResume(title: string, subtitle?: string, content?: string, type: string = 'resume', reviewData?: any) {
        const profileId = await this.getProfileId();
        return this.prisma.resume.create({
            data: {
                profileId,
                title,
                subtitle: subtitle || '',
                content: content || '[Документ загружен]',
                type,
                status: 'draft',
                reviewData: reviewData || undefined,
            }
        });
    }

    async uploadResumeFile(file: Express.Multer.File, title: string): Promise<any> {
        const profileId = await this.getProfileId();
        const ext = file.originalname.split('.').pop() || 'pdf';
        const tempId = `${Date.now()}`;
        const key = `resumes/${profileId}/${tempId}.${ext}`;

        await this.storage.uploadFile(file.buffer, key, file.mimetype || 'application/octet-stream');

        return this.prisma.resume.create({
            data: {
                profileId,
                title,
                subtitle: `Файл: ${file.originalname}`,
                content: '[Файл загружен в хранилище]',
                type: 'uploaded_file',
                status: 'draft',
                fileKey: key,
            } as any,
        });
    }

    async getDownloadUrl(resumeId: string): Promise<string> {
        const profileId = await this.getProfileId();
        const resume = await this.prisma.resume.findFirst({
            where: { id: resumeId, profileId },
        });

        if (!resume) {
            throw new NotFoundException('Резюме не найдено');
        }

        const fileKey = (resume as any).fileKey;
        if (!fileKey) {
            throw new NotFoundException('Файл не прикреплён к этому резюме');
        }

        return this.storage.getPresignedDownloadUrl(fileKey);
    }

    async deleteResume(id: string) {
        const profileId = await this.getProfileId();
        await this.prisma.resume.deleteMany({ where: { id, profileId } });
        return { success: true };
    }
}
```

- [ ] **Step 5: Update ResumesModule to import StorageModule**

Replace `backend/src/modules/resumes/resumes.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [StorageModule],
    controllers: [ResumesController],
    providers: [ResumesService],
    exports: [ResumesService],
})
export class ResumesModule {}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd backend && npx jest resumes.service.spec --no-coverage 2>&1 | tail -20
```

Expected: PASS (all tests including new ones)

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/resumes/ backend/src/modules/storage/
git commit -m "feat(storage): add uploadResumeFile and getDownloadUrl to ResumesService"
```

---

## Task 5: ResumesController — add upload and download endpoints

**Files:**
- Modify: `backend/src/modules/resumes/resumes.controller.ts`
- Modify: `backend/src/modules/resumes/resumes.controller.spec.ts`

- [ ] **Step 1: Update the controller spec**

Replace `backend/src/modules/resumes/resumes.controller.spec.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx jest resumes.controller.spec --no-coverage 2>&1 | tail -20
```

Expected: FAIL — `uploadResume` and `getDownloadUrl` not found on controller

- [ ] **Step 3: Update ResumesController**

Replace `backend/src/modules/resumes/resumes.controller.ts`:

```typescript
import {
    Controller, Get, Post, Body, Delete, Param,
    UseInterceptors, UploadedFile, Query, Res, ParseFilePipe,
    MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { ResumesService } from './resumes.service';

@ApiTags('Resumes')
@Controller('resumes')
export class ResumesController {
    constructor(private readonly resumesService: ResumesService) {}

    @Get('history')
    @ApiOperation({ summary: 'Get generated resumes and sent history' })
    async getHistory() {
        return this.resumesService.getHistory();
    }

    @Post('cover-letter')
    @ApiOperation({ summary: 'Generate cover letter' })
    async generateCoverLetter(@Body() body: { company: string; position: string; keyPoints?: string; profile?: any }) {
        const text = await this.resumesService.generateCoverLetter(body.company, body.position, body.keyPoints, body.profile);
        return { text };
    }

    @Post('upload')
    @ApiOperation({ summary: 'Upload a PDF/DOCX resume file to object storage (MinIO/S3)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                title: { type: 'string' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
    async uploadResume(
        @UploadedFile(new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                new FileTypeValidator({ fileType: /(pdf|msword|vnd\.openxmlformats)/ }),
            ],
            fileIsRequired: true,
        })) file: Express.Multer.File,
        @Query('title') title: string,
    ) {
        return this.resumesService.uploadResumeFile(file, title || file.originalname);
    }

    @Get(':id/file')
    @ApiOperation({ summary: 'Get presigned download URL for original uploaded file' })
    async getDownloadUrl(@Param('id') id: string, @Res() res: Response) {
        const url = await this.resumesService.getDownloadUrl(id);
        res.redirect(url);
    }

    @Post()
    @ApiOperation({ summary: 'Save an uploaded or generated resume to the database' })
    async saveResume(@Body() body: { title: string; subtitle?: string; content?: string; type?: string; reviewData?: any }) {
        return this.resumesService.saveResume(body.title, body.subtitle, body.content, body.type, body.reviewData);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a resume' })
    async deleteResume(@Param('id') id: string) {
        return this.resumesService.deleteResume(id);
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && npx jest resumes.controller.spec --no-coverage 2>&1 | tail -20
```

Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/resumes/
git commit -m "feat(storage): add POST /resumes/upload and GET /resumes/:id/file endpoints"
```

---

## Task 6: Wire StorageModule globally and run full backend test suite

**Files:**
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Import StorageModule in AppModule**

In `backend/src/app.module.ts`, add `StorageModule` to the imports:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { PocModule } from './modules/poc/poc.module';
import { VacanciesModule } from './modules/vacancies/vacancies.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiModule } from './modules/ai/ai.module';
import { SkillsModule } from './modules/skills/skills.module';
import { HealthController } from './health.controller';
import { AppController } from './app.controller';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
        DatabaseModule,
        AuthModule,
        UsersModule,
        RedisModule,
        StorageModule,
        ProfilesModule,
        PocModule,
        VacanciesModule,
        ResumesModule,
        InterviewsModule,
        AnalyticsModule,
        AiModule,
        SkillsModule,
    ],
    controllers: [HealthController, AppController],
    providers: [],
})
export class AppModule {}
```

- [ ] **Step 2: Run full backend test suite**

```bash
cd backend && npx jest --no-coverage 2>&1 | tail -30
```

Expected: All suites pass (storage + resumes tests should be green)

- [ ] **Step 3: Commit**

```bash
git add backend/src/app.module.ts
git commit -m "feat(storage): register StorageModule in AppModule"
```

---

## Task 7: Frontend — route upload through backend

**Files:**
- Modify: `frontend/src/features/resume/api/use-review-resume.ts`

The current hook sends the file directly to the ML agent at `:3002/ai/review-resume`. We update it to send to the backend at `/api/v1/resumes/upload` instead. The backend can still proxy to the ML agent in the future; for now it stores the file in MinIO and returns the resume record. The AI review call stays separate (frontend still calls ML agent for `reviewData`).

> **Note:** We keep the AI deep-review call to the ML agent as-is (it just reads the file bytes for analysis and doesn't need to be stored separately). Only the file-storage path changes: the file is persisted via the new backend endpoint, independently of the AI analysis.

- [ ] **Step 1: Add `useUploadResumeToBackend` hook**

Replace `frontend/src/features/resume/api/use-review-resume.ts` with:

```typescript
import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from '@/shared/api';

export interface ResumeReviewStrength {
    title: string;
    description: string;
}

export interface ResumeReviewWeakness {
    title: string;
    description: string;
    recommendation: string;
    severity: 'critical' | 'major' | 'minor';
}

export interface ResumeReviewResult {
    overallScore: number;
    overallVerdict: 'Отличное' | 'Хорошее' | 'Среднее' | 'Требует доработки';
    noChangesNeeded: boolean;
    strengths: ResumeReviewStrength[];
    weaknesses: ResumeReviewWeakness[];
    missingForTarget: string[];
    improvedResume: string;
    changesSummary: string[];
    extractedProfile: {
        fullName: string;
        currentPosition?: string;
        skills: string[];
        experienceYears: number;
    };
}

interface ReviewResumeInput {
    file: File;
    desiredPosition?: string;
    skills?: string[];
    aboutMe?: string;
}

/** AI deep review — still goes directly to ML agent for analysis */
export const useReviewResume = () => {
    return useMutation<ResumeReviewResult, Error, ReviewResumeInput>({
        mutationFn: async (input: ReviewResumeInput) => {
            const formData = new FormData();
            formData.append('file', input.file);
            if (input.desiredPosition) formData.append('desiredPosition', input.desiredPosition);
            if (input.skills?.length) formData.append('skills', JSON.stringify(input.skills));
            if (input.aboutMe) formData.append('aboutMe', input.aboutMe);

            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const headers: HeadersInit = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:3002';
            const response = await fetch(`${agentUrl}/ai/review-resume`, {
                method: 'POST',
                headers,
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(err.message || 'Ошибка анализа резюме');
            }

            const json = await response.json();
            return json.data as ResumeReviewResult;
        },
    });
};

/** Persist the file in MinIO/S3 via backend */
export const useStoreResumeFile = () => {
    return useMutation<{ id: string; fileKey: string; title: string }, Error, { file: File; title: string }>({
        mutationFn: async ({ file, title }) => {
            const formData = new FormData();
            formData.append('file', file);

            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const headers: HeadersInit = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_BASE_URL}/resumes/upload?title=${encodeURIComponent(title)}`, {
                method: 'POST',
                headers,
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(err.message || 'Ошибка сохранения файла');
            }

            return response.json();
        },
    });
};
```

- [ ] **Step 2: Use `useStoreResumeFile` in resume-content.tsx**

In `frontend/src/features/resume/resume-content.tsx`, add the import at the top (alongside existing imports):

```typescript
import { useReviewResume, useStoreResumeFile, type ResumeReviewResult } from "./api/use-review-resume"
```

Then add the hook instantiation alongside the existing hooks (around line 270):

```typescript
const { mutate: storeFile } = useStoreResumeFile()
```

Then update `handleUpload` — after the `reviewResume` `onSuccess` callback saves to DB via `saveResume`, add a parallel fire-and-forget call to store the file in MinIO. Find this block (around line 444):

```typescript
// BEFORE (inside reviewResume onSuccess, after setAnalysisStep('saving')):
setReviewResult(result)

// AFTER — add file storage call:
setReviewResult(result)
storeFile(
    { file: uploadedFile, title: resumeTitle },
    { onError: (e) => console.warn('[StoreFile] MinIO upload failed (non-blocking):', e) },
)
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/resume/
git commit -m "feat(storage): upload resume files to MinIO via backend; keep AI review direct to agent"
```

---

## Task 8: Verify end-to-end (manual smoke test)

- [ ] **Step 1: Start MinIO**

```bash
cd devops/docker && docker compose -f docker-compose.dev.yml up minio -d
```

Expected: MinIO container starts on port 9000

- [ ] **Step 2: Create MinIO bucket**

```bash
docker exec careermate-minio mc alias set local http://localhost:9000 minioadmin minioadmin && \
docker exec careermate-minio mc mb local/careermate-local --ignore-existing
```

Expected: `Bucket created successfully`

- [ ] **Step 3: Start backend**

```bash
cd backend && npm run start:dev
```

Expected: NestJS starts on port 3001 with StorageModule registered

- [ ] **Step 4: Test upload endpoint via curl**

```bash
curl -X POST "http://localhost:3001/api/v1/resumes/upload?title=TestCV" \
  -F "file=@/path/to/any.pdf" \
  -v 2>&1 | grep -E "HTTP|fileKey|id"
```

Expected: `200 OK` response with `fileKey` field in JSON

- [ ] **Step 5: Test download redirect**

```bash
curl -I "http://localhost:3001/api/v1/resumes/<id-from-step-4>/file"
```

Expected: `302 Found` with `Location: http://localhost:9000/careermate-local/resumes/...`

- [ ] **Step 6: Run all backend tests one final time**

```bash
cd backend && npx jest --no-coverage 2>&1 | tail -10
```

Expected: All test suites pass

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat(storage): MinIO/S3 storage fully wired — upload, presigned download, file persistence"
```
