import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { EmbeddingsService } from './embeddings.service';
import { of, throwError } from 'rxjs';

// ── Pinecone mock (module-level so it applies to all tests) ──────────────────
const mockUpsert = jest.fn().mockResolvedValue({});
const mockQuery = jest.fn().mockResolvedValue({
    matches: [
        { id: 'vacancy-1', score: 0.95 },
        { id: 'vacancy-2', score: 0.82 },
    ],
});
const mockPineconeIndex = { upsert: mockUpsert, query: mockQuery };

jest.mock('@pinecone-database/pinecone', () => ({
    Pinecone: jest.fn().mockImplementation(() => ({
        index: jest.fn().mockReturnValue(mockPineconeIndex),
    })),
}));

// ── Shared constants ─────────────────────────────────────────────────────────
const MOCK_VECTOR = Array(1536).fill(0.1);

const mockEmbeddingResponse = {
    data: { data: [{ embedding: MOCK_VECTOR }] },
};

// ── Mock factories ───────────────────────────────────────────────────────────
const makeHttp = () => ({
    post: jest.fn().mockReturnValue(of(mockEmbeddingResponse)),
});

const makeConfig = (overrides: Record<string, string> = {}) => ({
    get: jest.fn((key: string) => {
        const defaults: Record<string, string> = {
            PINECONE_API_KEY: 'test-pinecone-key',
            PINECONE_INDEX_NAME: 'test-index',
            PINECONE_ENVIRONMENT: 'us-west1-gcp',
            LLM_API_KEY: 'test-llm-key',
            LLM_API_BASE_URL: 'https://api.openai.com/v1',
        };
        return overrides[key] ?? defaults[key];
    }),
});

// ═════════════════════════════════════════════════════════════════════════════
describe('EmbeddingsService', () => {
    let service: EmbeddingsService;
    let http: ReturnType<typeof makeHttp>;

    beforeEach(async () => {
        jest.clearAllMocks();

        // Restore default implementations after clearAllMocks
        mockUpsert.mockResolvedValue({});
        mockQuery.mockResolvedValue({
            matches: [
                { id: 'vacancy-1', score: 0.95 },
                { id: 'vacancy-2', score: 0.82 },
            ],
        });

        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
        jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});

        http = makeHttp();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmbeddingsService,
                { provide: HttpService, useValue: http },
                { provide: ConfigService, useValue: makeConfig() },
            ],
        }).compile();

        service = module.get<EmbeddingsService>(EmbeddingsService);
    });

    afterEach(() => jest.restoreAllMocks());

    // ──────────────────────────── indexVacancy ───────────────────────────────
    describe('indexVacancy', () => {
        it('should call embedding API with vacancy text', async () => {
            await service.indexVacancy('vac-123', 'Frontend Developer React TypeScript');

            expect(http.post).toHaveBeenCalledWith(
                'https://api.openai.com/v1/embeddings',
                expect.objectContaining({
                    model: 'text-embedding-3-small',
                    input: 'Frontend Developer React TypeScript',
                }),
                expect.objectContaining({
                    headers: expect.objectContaining({ Authorization: 'Bearer test-llm-key' }),
                }),
            );
        });

        it('should upsert the embedding vector into Pinecone with vacancy id', async () => {
            await service.indexVacancy('vac-123', 'Frontend Developer React TypeScript');

            expect(mockUpsert).toHaveBeenCalledWith([
                { id: 'vac-123', values: MOCK_VECTOR },
            ]);
        });

        it('should not throw when Pinecone upsert fails (fire-and-forget safe)', async () => {
            mockUpsert.mockRejectedValueOnce(new Error('Pinecone network error'));
            await expect(
                service.indexVacancy('vac-123', 'some text'),
            ).resolves.toBeUndefined();
        });

        it('should not throw when embedding API fails', async () => {
            http.post.mockReturnValueOnce(throwError(() => new Error('OpenAI down')));
            await expect(
                service.indexVacancy('vac-123', 'some text'),
            ).resolves.toBeUndefined();
        });
    });

    // ─────────────────────────── searchSimilar ───────────────────────────────
    describe('searchSimilar', () => {
        it('should return vacancy IDs sorted by cosine similarity', async () => {
            const result = await service.searchSimilar('Frontend Developer React', 5);

            expect(mockQuery).toHaveBeenCalledWith(
                expect.objectContaining({ topK: 5, includeValues: false }),
            );
            expect(result).toEqual(['vacancy-1', 'vacancy-2']);
        });

        it('should pass the query vector from the embedding API to Pinecone', async () => {
            await service.searchSimilar('some query text', 10);

            const queryCall = mockQuery.mock.calls[0][0];
            expect(queryCall.vector).toEqual(MOCK_VECTOR);
        });

        it('should return empty array when Pinecone query fails', async () => {
            mockQuery.mockRejectedValueOnce(new Error('Query failed'));
            const result = await service.searchSimilar('some query', 5);
            expect(result).toEqual([]);
        });

        it('should return empty array when embedding API fails', async () => {
            http.post.mockReturnValueOnce(throwError(() => new Error('OpenAI down')));
            const result = await service.searchSimilar('some query', 5);
            expect(result).toEqual([]);
        });
    });

    // ──────────────────────── configuration errors ───────────────────────────
    describe('configuration errors', () => {
        it('should throw when PINECONE_API_KEY is not set', async () => {
            const module = await Test.createTestingModule({
                providers: [
                    EmbeddingsService,
                    { provide: HttpService, useValue: http },
                    { provide: ConfigService, useValue: makeConfig({ PINECONE_API_KEY: '' }) },
                ],
            }).compile();

            const svc = module.get<EmbeddingsService>(EmbeddingsService);
            await expect(svc.indexVacancy('id', 'text')).rejects.toThrow(
                'Pinecone API key is not configured.',
            );
        });

        it('should throw when PINECONE_INDEX_NAME is not set', async () => {
            const module = await Test.createTestingModule({
                providers: [
                    EmbeddingsService,
                    { provide: HttpService, useValue: http },
                    { provide: ConfigService, useValue: makeConfig({ PINECONE_INDEX_NAME: '' }) },
                ],
            }).compile();

            const svc = module.get<EmbeddingsService>(EmbeddingsService);
            await expect(svc.searchSimilar('text', 5)).rejects.toThrow(
                'Pinecone index name is not configured.',
            );
        });
    });
});
