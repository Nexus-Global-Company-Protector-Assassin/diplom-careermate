// backend/src/modules/ai/embeddings/embeddings.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { EmbeddingsService } from './embeddings.service';

// ── QdrantVectorStore mock ───────────────────────────────────────────────────
const mockAddDocuments = jest.fn().mockResolvedValue(undefined);
const mockSimilaritySearch = jest.fn().mockResolvedValue([
    { pageContent: 'Frontend Developer', metadata: { vacancyId: 'vacancy-1' } },
    { pageContent: 'Backend Developer', metadata: { vacancyId: 'vacancy-2' } },
]);

jest.mock('@langchain/community/vectorstores/qdrant', () => ({
    QdrantVectorStore: jest.fn().mockImplementation(() => ({
        addDocuments: mockAddDocuments,
        similaritySearch: mockSimilaritySearch,
    })),
}));

// ── QdrantClient mock (used by ensureCollection) ─────────────────────────────
const mockGetCollections = jest.fn().mockResolvedValue({
    collections: [{ name: 'test-collection' }],
});

jest.mock('@qdrant/js-client-rest', () => ({
    QdrantClient: jest.fn().mockImplementation(() => ({
        getCollections: mockGetCollections,
        createCollection: jest.fn().mockResolvedValue({}),
    })),
}));

// ── PolzaAiEmbeddings mock ───────────────────────────────────────────────────
jest.mock('./polza-ai.embeddings', () => ({
    PolzaAiEmbeddings: jest.fn().mockImplementation(() => ({})),
}));

// ── Mock factories ───────────────────────────────────────────────────────────
const makeHttp = () => ({ post: jest.fn() });

const makeConfig = (overrides: Record<string, string> = {}) => ({
    get: jest.fn((key: string, defaultValue?: string) => {
        const defaults: Record<string, string> = {
            QDRANT_URL: 'http://localhost:6333',
            QDRANT_COLLECTION: 'test-collection',
            QDRANT_API_KEY: 'test-api-key',
            LLM_API_KEY: 'test-llm-key',
            LLM_API_BASE_URL: 'https://polza.ai/api/v1',
            EMBEDDINGS_MODEL_NAME: 'openai/text-embedding-3-small',
        };
        return overrides[key] ?? defaults[key] ?? defaultValue;
    }),
});

// ═════════════════════════════════════════════════════════════════════════════
describe('EmbeddingsService', () => {
    let service: EmbeddingsService;

    beforeEach(async () => {
        jest.clearAllMocks();

        mockGetCollections.mockResolvedValue({ collections: [{ name: 'test-collection' }] });
        mockAddDocuments.mockResolvedValue(undefined);
        mockSimilaritySearch.mockResolvedValue([
            { pageContent: 'Frontend Developer', metadata: { vacancyId: 'vacancy-1' } },
            { pageContent: 'Backend Developer', metadata: { vacancyId: 'vacancy-2' } },
        ]);

        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
        jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmbeddingsService,
                { provide: HttpService, useValue: makeHttp() },
                { provide: ConfigService, useValue: makeConfig() },
            ],
        }).compile();

        service = module.get<EmbeddingsService>(EmbeddingsService);
    });

    afterEach(() => jest.restoreAllMocks());

    // ──────────────────────────── indexVacancy ───────────────────────────────
    describe('indexVacancy', () => {
        it('should call addDocuments with pageContent and vacancyId metadata', async () => {
            await service.indexVacancy('vac-123', 'Frontend Developer React TypeScript');

            expect(mockAddDocuments).toHaveBeenCalledWith([
                {
                    pageContent: 'Frontend Developer React TypeScript',
                    metadata: { vacancyId: 'vac-123' },
                },
            ]);
        });

        it('should not throw when addDocuments fails (fire-and-forget safe)', async () => {
            mockAddDocuments.mockRejectedValueOnce(new Error('Qdrant network error'));
            await expect(
                service.indexVacancy('vac-123', 'some text'),
            ).resolves.toBeUndefined();
        });
    });

    // ─────────────────────────── searchSimilar ───────────────────────────────
    describe('searchSimilar', () => {
        it('should call similaritySearch and return vacancyIds from metadata', async () => {
            const result = await service.searchSimilar('Frontend Developer React', 5);

            expect(mockSimilaritySearch).toHaveBeenCalledWith('Frontend Developer React', 5);
            expect(result).toEqual(['vacancy-1', 'vacancy-2']);
        });

        it('should return empty array when similaritySearch fails', async () => {
            mockSimilaritySearch.mockRejectedValueOnce(new Error('Query failed'));
            const result = await service.searchSimilar('some query', 5);
            expect(result).toEqual([]);
        });
    });

    // ──────────────────────── configuration errors ───────────────────────────
    describe('configuration errors', () => {
        it('should throw when QDRANT_URL is not set', async () => {
            const module = await Test.createTestingModule({
                providers: [
                    EmbeddingsService,
                    { provide: HttpService, useValue: makeHttp() },
                    { provide: ConfigService, useValue: makeConfig({ QDRANT_URL: '' }) },
                ],
            }).compile();
            const svc = module.get<EmbeddingsService>(EmbeddingsService);
            await expect(svc.indexVacancy('id', 'text')).rejects.toThrow(
                'Qdrant URL is not configured.',
            );
        });

        it('should throw when QDRANT_API_KEY is not set', async () => {
            const module = await Test.createTestingModule({
                providers: [
                    EmbeddingsService,
                    { provide: HttpService, useValue: makeHttp() },
                    { provide: ConfigService, useValue: makeConfig({ QDRANT_API_KEY: '' }) },
                ],
            }).compile();
            const svc = module.get<EmbeddingsService>(EmbeddingsService);
            await expect(svc.indexVacancy('id', 'text')).rejects.toThrow(
                'Qdrant API key is not configured.',
            );
        });

        it('should throw when QDRANT_COLLECTION is not set', async () => {
            const module = await Test.createTestingModule({
                providers: [
                    EmbeddingsService,
                    { provide: HttpService, useValue: makeHttp() },
                    { provide: ConfigService, useValue: makeConfig({ QDRANT_COLLECTION: '' }) },
                ],
            }).compile();
            const svc = module.get<EmbeddingsService>(EmbeddingsService);
            await expect(svc.searchSimilar('text', 5)).rejects.toThrow(
                'Qdrant collection name is not configured.',
            );
        });
    });
});
