# Design: Qdrant Cloud Integration via LangChain QdrantVectorStore

**Date:** 2026-04-22  
**Status:** Approved

## Summary

Replace the manual `QdrantClient` usage in `EmbeddingsService` with LangChain's `QdrantVectorStore`, and switch from the local Docker Qdrant instance to Qdrant Cloud (all environments). This brings consistency with the existing LangChain LCEL architecture and adds authenticated cloud connectivity.

## Context

`EmbeddingsService` currently:
- Uses `@qdrant/js-client-rest` directly via `client.upsert()` and `client.search()`
- Connects to a local Docker Qdrant at `QDRANT_URL=http://localhost:6333` (no auth)
- Generates embeddings via `HttpService` calling the polza.ai OpenAI-compatible endpoint

The project already has `@langchain/community ^0.0.20` and `@langchain/core ^0.1.5` installed. The rest of the AI layer uses LangChain LCEL chains.

## Architecture

### File changes

```
backend/src/modules/ai/embeddings/
  embeddings.service.ts        ← rewritten
  polza-ai.embeddings.ts       ← new file
  embeddings.service.spec.ts   ← mocks updated
  embeddings.module.ts         ← unchanged
```

### Dependency graph

```
EmbeddingsService
  ├── getClient() → QdrantClient({ url, apiKey })   ← collection management only
  └── getVectorStore() → QdrantVectorStore
        ├── client: QdrantClient (shared instance)
        ├── collectionName: QDRANT_COLLECTION
        └── embeddings: PolzaAiEmbeddings
              ├── HttpService
              └── ConfigService
```

### Why `getClient()` stays

`QdrantVectorStore` does not manage collections. `ensureCollection()` calls `client.getCollections()` and `client.createCollection()` directly. The same `QdrantClient` instance (with `apiKey`) is reused by both `ensureCollection` and `QdrantVectorStore`.

## Components

### `PolzaAiEmbeddings` (`polza-ai.embeddings.ts`)

- Extends `Embeddings` from `@langchain/core/embeddings`
- Not a NestJS provider — instantiated inside `EmbeddingsService`
- `embedQuery(text): Promise<number[]>` — moves logic from the current `getEmbedding()`
- `embedDocuments(texts): Promise<number[][]>` — `Promise.all` over `embedQuery`
- Config read: `LLM_API_KEY`, `LLM_API_BASE_URL`, `EMBEDDINGS_MODEL_NAME`

### `EmbeddingsService` — public API unchanged

| Method | Old implementation | New implementation |
|---|---|---|
| `indexVacancy(id, text)` | `client.upsert(collection, { points: [{ id, vector }] })` | `vectorStore.addDocuments([{ pageContent: text, metadata: { vacancyId: id } }])` |
| `searchSimilar(query, topK)` | `client.search(...)` → `r.id` | `vectorStore.similaritySearch(query, topK)` → `doc.metadata.vacancyId` |

**Note on point IDs:** Qdrant point IDs are now auto-generated UUIDs by LangChain. The vacancy ID is stored in `metadata.vacancyId`. This does not affect callers of `EmbeddingsService`. Since the target is a new cloud instance, there are no existing vectors to migrate.

## Configuration

### Required env vars

```
QDRANT_URL=https://63fe3e49-3ba7-4d0c-b7a6-d7e505d8fe7a.eu-central-1-0.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=<jwt-token>
QDRANT_COLLECTION=careermate-vectors
```

`getClient()` throws immediately if `QDRANT_URL` or `QDRANT_API_KEY` is missing.

### docker-compose.dev.yml

The `qdrant` service gets `profiles: [local-qdrant]`. It no longer starts by default; opt in with `docker compose --profile local-qdrant up`.

## Error Handling

Same strategy as current implementation:

| Scenario | Behaviour |
|---|---|
| Missing `QDRANT_URL` or `QDRANT_API_KEY` | Throws `Error` at first operation |
| Missing `QDRANT_COLLECTION` | Throws `Error` at first operation |
| Runtime upsert failure | Logged via `logger.warn`, not thrown (`indexVacancy` is fire-and-forget) |
| Runtime search failure | Logged via `logger.warn`, returns `[]` |

## Testing

Changes to `embeddings.service.spec.ts`:

- Mock `@langchain/community/vectorstores/qdrant` replacing mock of `@qdrant/js-client-rest`
- `makeConfig()` gains `QDRANT_API_KEY: 'test-api-key'`
- New config error test: throws when `QDRANT_API_KEY` is not set
- `indexVacancy` test: asserts `addDocuments` called with `{ pageContent, metadata: { vacancyId } }`
- `searchSimilar` test: mock returns `Document[]` with `metadata.vacancyId`, asserts correct IDs returned
- HTTP mock for `PolzaAiEmbeddings` remains (same `HttpService` mock)

## Out of Scope

- Migrating existing vectors (cloud instance is empty)
- Switching to `@langchain/openai` `OpenAIEmbeddings` (avoids adding new package)
- Any changes to callers of `EmbeddingsService` (`VacanciesService`, etc.)
