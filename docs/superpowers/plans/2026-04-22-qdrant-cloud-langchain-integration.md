# Qdrant Cloud + LangChain QdrantVectorStore Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace direct `QdrantClient` usage in `EmbeddingsService` with LangChain's `QdrantVectorStore`, add `QDRANT_API_KEY` auth, and point the service at Qdrant Cloud in all environments.

**Architecture:** A new `PolzaAiEmbeddings` class wraps the existing polza.ai HTTP call as a LangChain `Embeddings` implementation. `EmbeddingsService` gains a `getVectorStore()` factory that combines a shared `QdrantClient` (with `apiKey`) and `PolzaAiEmbeddings` into a `QdrantVectorStore`. Public methods `indexVacancy` and `searchSimilar` delegate to `addDocuments`/`similaritySearch` instead of raw `upsert`/`search`.

**Tech Stack:** NestJS, `@langchain/community ^0.0.20` (`QdrantVectorStore`), `@langchain/core ^0.1.5` (`Embeddings`), `@qdrant/js-client-rest ^1.17.0`, Jest

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `backend/src/modules/ai/embeddings/embeddings.service.spec.ts` | Tests: swap QdrantClient mock → QdrantVectorStore mock, add QDRANT_API_KEY |
| Create | `backend/src/modules/ai/embeddings/polza-ai.embeddings.ts` | LangChain Embeddings wrapper around polza.ai HTTP endpoint |
| Modify | `backend/src/modules/ai/embeddings/embeddings.service.ts` | Use QdrantVectorStore + PolzaAiEmbeddings, add apiKey to getClient() |
| Modify | `backend/.env` | QDRANT_URL → cloud URL, add QDRANT_API_KEY |
| Modify | `devops/docker/docker-compose.dev.yml` | Add `profiles: [local-qdrant]` to qdrant service |

---

## Task 1: Rewrite the spec with updated mocks (failing state)

**Files:**
- Modify: `backend/src/modules/ai/embeddings/embeddings.service.spec.ts`

- [ ] **Step 1: Replace the entire spec file**

```typescript
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
```

- [ ] **Step 2: Run the spec to confirm it fails**

```bash
cd backend && npx jest embeddings.service.spec.ts --no-coverage 2>&1 | tail -20
```

Expected: multiple failures — `Cannot find module './polza-ai.embeddings'` and `QdrantVectorStore` import errors since the new service code doesn't exist yet.

---

## Task 2: Create `polza-ai.embeddings.ts`

**Files:**
- Create: `backend/src/modules/ai/embeddings/polza-ai.embeddings.ts`

- [ ] **Step 1: Create the file**

```typescript
// backend/src/modules/ai/embeddings/polza-ai.embeddings.ts
import { Embeddings } from '@langchain/core/embeddings';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export class PolzaAiEmbeddings extends Embeddings {
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        super({});
    }

    async embedQuery(text: string): Promise<number[]> {
        const apiKey = this.configService.get<string>('LLM_API_KEY');
        if (!apiKey) throw new Error('LLM API key is not configured for embeddings.');

        const baseUrl = this.configService.get<string>(
            'LLM_API_BASE_URL',
            'https://polza.ai/api/v1',
        );

        const model = this.configService.get<string>(
            'EMBEDDINGS_MODEL_NAME',
            'openai/text-embedding-3-small',
        );

        const response = await firstValueFrom(
            this.httpService.post(
                `${baseUrl}/embeddings`,
                { model, input: text.slice(0, 8000) },
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                },
            ),
        );

        return response.data.data[0].embedding as number[];
    }

    async embedDocuments(texts: string[]): Promise<number[][]> {
        return Promise.all(texts.map((t) => this.embedQuery(t)));
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/modules/ai/embeddings/polza-ai.embeddings.ts
git commit -m "feat(embeddings): add PolzaAiEmbeddings LangChain wrapper"
```

---

## Task 3: Rewrite `embeddings.service.ts`

**Files:**
- Modify: `backend/src/modules/ai/embeddings/embeddings.service.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
// backend/src/modules/ai/embeddings/embeddings.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantVectorStore } from '@langchain/community/vectorstores/qdrant';
import { PolzaAiEmbeddings } from './polza-ai.embeddings';

@Injectable()
export class EmbeddingsService implements OnModuleInit {
    private readonly logger = new Logger(EmbeddingsService.name);
    private readonly VECTOR_SIZE = 1536;
    private qdrantClient: QdrantClient | null = null;
    private vectorStore: QdrantVectorStore | null = null;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {}

    async onModuleInit() {
        try {
            await this.ensureCollection();
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.warn(`Qdrant collection init skipped: ${msg}`);
        }
    }

    private getClient(): QdrantClient {
        if (!this.qdrantClient) {
            const url = this.configService.get<string>('QDRANT_URL');
            const apiKey = this.configService.get<string>('QDRANT_API_KEY');
            if (!url) throw new Error('Qdrant URL is not configured.');
            if (!apiKey) throw new Error('Qdrant API key is not configured.');
            this.qdrantClient = new QdrantClient({ url, apiKey });
        }
        return this.qdrantClient;
    }

    private getCollection(): string {
        const name = this.configService.get<string>('QDRANT_COLLECTION');
        if (!name) throw new Error('Qdrant collection name is not configured.');
        return name;
    }

    private getVectorStore(): QdrantVectorStore {
        if (!this.vectorStore) {
            const client = this.getClient();
            const collectionName = this.getCollection();
            const embeddings = new PolzaAiEmbeddings(this.httpService, this.configService);
            this.vectorStore = new QdrantVectorStore(embeddings, {
                client,
                collectionName,
            });
        }
        return this.vectorStore;
    }

    private async ensureCollection(): Promise<void> {
        const client = this.getClient();
        const collection = this.getCollection();
        const { collections } = await client.getCollections();
        if (!collections.some((c) => c.name === collection)) {
            await client.createCollection(collection, {
                vectors: { size: this.VECTOR_SIZE, distance: 'Cosine' },
            });
            this.logger.log(`Created Qdrant collection: ${collection}`);
        }
    }

    async indexVacancy(id: string, text: string): Promise<void> {
        const vectorStore = this.getVectorStore();
        try {
            await vectorStore.addDocuments([
                { pageContent: text, metadata: { vacancyId: id } },
            ]);
            this.logger.debug(`Indexed vacancy ${id} in Qdrant`);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.warn(`Failed to index vacancy ${id}: ${msg}`);
        }
    }

    async searchSimilar(queryText: string, topK: number): Promise<string[]> {
        const vectorStore = this.getVectorStore();
        try {
            const results = await vectorStore.similaritySearch(queryText, topK);
            return results.map((doc) => doc.metadata.vacancyId as string);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.warn(`Semantic search failed: ${msg}`);
            return [];
        }
    }
}
```

- [ ] **Step 2: Run the spec**

```bash
cd backend && npx jest embeddings.service.spec.ts --no-coverage 2>&1 | tail -20
```

Expected output: all tests pass (`PASS`)

- [ ] **Step 3: Commit**

```bash
git add backend/src/modules/ai/embeddings/embeddings.service.ts \
        backend/src/modules/ai/embeddings/embeddings.service.spec.ts
git commit -m "feat(embeddings): replace QdrantClient with LangChain QdrantVectorStore, add QDRANT_API_KEY"
```

---

## Task 4: Update `.env` with Qdrant Cloud credentials

**Files:**
- Modify: `backend/.env`

- [ ] **Step 1: Update the Qdrant section in `.env`**

Find the block:
```
# Qdrant Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=careermate-vectors
```

Replace with:
```
# Qdrant Vector Database (Cloud)
QDRANT_URL=https://63fe3e49-3ba7-4d0c-b7a6-d7e505d8fe7a.eu-central-1-0.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6MWE3OWNhYzItZTBiNS00ZWJlLWFmOWEtZmZhYTc5NDIwOTdkIn0.pxnzlFGF1WYuC4WRzY1r67LhNnb82yQU2Tl9MzdEDmk
QDRANT_COLLECTION=careermate-vectors
```

- [ ] **Step 2: Verify `.env` is in `.gitignore` (do not commit secrets)**

```bash
grep -n "\.env" backend/.gitignore 2>/dev/null || grep -n "\.env" .gitignore 2>/dev/null
```

Expected: `.env` line present in `.gitignore`. If not present, add it before proceeding.

---

## Task 5: Make local Qdrant optional in docker-compose

**Files:**
- Modify: `devops/docker/docker-compose.dev.yml`

- [ ] **Step 1: Add `profiles` to the qdrant service**

Find the block (starts around line 104):
```yaml
  qdrant:
    image: qdrant/qdrant:latest
    container_name: careermate-qdrant
    restart: unless-stopped
    ports:
      - '${QDRANT_PORT:-6333}:6333'
    volumes:
      - qdrant_data:/qdrant/storage
    networks:
      - careermate-network
```

Replace with:
```yaml
  qdrant:
    image: qdrant/qdrant:latest
    container_name: careermate-qdrant
    restart: unless-stopped
    ports:
      - '${QDRANT_PORT:-6333}:6333'
    volumes:
      - qdrant_data:/qdrant/storage
    networks:
      - careermate-network
    profiles:
      - local-qdrant
```

- [ ] **Step 2: Commit**

```bash
git add devops/docker/docker-compose.dev.yml
git commit -m "chore(docker): make local Qdrant optional via profile local-qdrant"
```

---

## Task 6: Run the full test suite

- [ ] **Step 1: Run all backend tests**

```bash
cd backend && npm test -- --no-coverage 2>&1 | tail -30
```

Expected: all suites pass. If `embeddings.service.spec.ts` fails, re-read Task 3 — the most common issue is a wrong import path for `@langchain/community/vectorstores/qdrant`.

- [ ] **Step 2: Commit anything remaining**

```bash
git status
# If clean, nothing to do. If there are unstaged changes, add and commit them.
```
