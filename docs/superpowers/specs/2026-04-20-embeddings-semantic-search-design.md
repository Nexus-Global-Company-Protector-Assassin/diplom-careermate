# Embeddings / Semantic Vacancy Matching — Design Spec

**Date:** 2026-04-20  
**Status:** Approved  
**Scope:** Backend only (`backend/src/modules/ai/embeddings/`)

---

## Problem

`getRecommendedForProfile` uses keyword-based DB search + multi-component `calcMatch` scoring.
This misses semantically related vacancies where exact keywords don't overlap (e.g. profile says "Node.js developer", vacancy says "Server-side JavaScript engineer").

Pinecone (`@pinecone-database/pinecone@1.1.2`) and LangChain are already installed but unused.
The `ai/embeddings/` folder exists and is empty.

---

## Solution: Hybrid Re-ranking

Keep the existing keyword retrieval as the first stage. Add a semantic re-ranking layer on top using Pinecone vector search. Final score blends both signals.

---

## Architecture

### New files

```
backend/src/modules/ai/embeddings/
  embeddings.service.ts    — Pinecone client + OpenAI embedding API calls
  embeddings.module.ts     — exports EmbeddingsService
  embeddings.service.spec.ts — unit tests
```

### Module wiring

`EmbeddingsModule` is imported into `VacanciesModule`.  
`EmbeddingsService` depends on `ConfigService` and `HttpService`.

---

## Public API

```typescript
class EmbeddingsService {
  // Upsert a vacancy vector into Pinecone. Fire-and-forget safe.
  indexVacancy(id: string, text: string): Promise<void>

  // Return vacancy IDs sorted by cosine similarity to queryText.
  searchSimilar(queryText: string, topK: number): Promise<string[]>
}
```

---

## Text Representations

**Vacancy vector text:**
```
"{title} {employer} {descriptionPreview} {skills.join(', ')}"
```

**Profile query text:**
```
"{desiredPosition} {profileSkills.join(', ')} {aboutMe}"
```

---

## Data Flow

### Indexing (at vacancy save time)

```
searchAndSave()
  → prisma.vacancy.upsert()                              // existing
  → skillsService.syncVacancySkills() [async]            // existing
  → embeddingsService.indexVacancy(id, text) [async]     // NEW, fire-and-forget
```

### Query (at recommendation time)

```
getRecommendedForProfile(position, profileSkills, limit, salary)
  1. DB keyword fetch (existing) → up to 50 vacancies
  2. embeddingsService.searchSimilar(queryText, topK=20) → vacancyId[]
  3. Merge: Pinecone IDs that are not in the DB set are fetched individually via
     `prisma.vacancy.findMany({ where: { id: { in: semanticIds } } })`.
     Results are deduplicated by id.
  4. Score each:
       semanticScore = Pinecone score (0–1) if vacancy in step 2, else 0
       combined = 0.6 × calcMatch(0–100) / 100 + 0.4 × semanticScore
  5. Sort by combined score descending → return top `limit`
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PINECONE_API_KEY` | Yes | Pinecone API key |
| `PINECONE_INDEX` | Yes | Pinecone index name (e.g. `careermate-vacancies`) |
| `LLM_API_KEY` | Yes | OpenAI-compatible key for `text-embedding-3-small` |
| `LLM_API_BASE_URL` | No | Defaults to `https://api.openai.com/v1` |

**Pinecone index configuration** (must be created manually in Pinecone console):
- Dimensions: 1536 (text-embedding-3-small)
- Metric: cosine

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| `PINECONE_API_KEY` not set | `throw new Error('Pinecone API key is not configured.')` on first call |
| `PINECONE_INDEX` not set | `throw new Error('Pinecone index name is not configured.')` on first call |
| Pinecone upsert fails | `logger.warn`, vacancy still saved in Postgres (embedding is best-effort) |
| Pinecone query fails | `logger.warn` + fallback: return calcMatch-only results (semanticScore=0 for all) |
| Embedding API fails | `logger.warn` + same fallback as above |

---

## Tests (`embeddings.service.spec.ts`)

| Test | Assertion |
|---|---|
| `indexVacancy` — happy path | calls Pinecone `upsert` with correct id and vector |
| `indexVacancy` — Pinecone error | does not throw (fire-and-forget) |
| `searchSimilar` — happy path | returns vacancy IDs in similarity order |
| `searchSimilar` — Pinecone error | returns `[]`, does not throw |
| No `PINECONE_API_KEY` | throws on call |
| No `PINECONE_INDEX` | throws on call |

**Changes to existing tests:**  
`vacancies.service.spec.ts` — add `EmbeddingsService` mock to providers in `beforeEach` and in the `noCredsModule` block.

---

## Out of Scope

- RAG for AI chatbot
- Profile embedding persistence (profile query vector is computed on-demand)
- Pinecone index auto-creation (index must be pre-created in the console)
- Frontend changes
