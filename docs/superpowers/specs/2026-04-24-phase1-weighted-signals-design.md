# Phase 1 + 1.5 — Weighted Signals + Decay + Impression Logging

**Date:** 2026-04-24  
**Status:** Approved  
**Branch:** backend

---

## Scope

Реализация Phase 1 и Phase 1.5 из `docs/architecture/recommendation-ml-roadmap.md`:

- Phase 1: замена хардкоженного буста `×1.2` на preference vector с exponential decay
- Phase 1.5: модель `RecommendationImpression` + логирование показов для Phase 2
- Попутно: исправление бага с `profileId` (сейчас `findFirst()` без фильтра по userId)

---

## Архитектура

### Новые файлы

```
backend/src/modules/vacancies/user-preferences.service.ts  (новый)
```

### Изменяемые файлы

```
backend/src/modules/vacancies/vacancies.service.ts     — preference integration, bug fix
backend/src/modules/vacancies/vacancies.controller.ts  — @CurrentUser в /recommended
backend/src/modules/vacancies/vacancies.module.ts      — RedisModule, UserPreferencesService
backend/prisma/schema.prisma                           — RecommendationImpression model
```

### Поток данных

```
GET /vacancies/recommended?... + JWT
  → controller: userId из @CurrentUser → передаёт в сервис
  → getRecommendedForProfile(pos, skills, limit, salary, userId)
      → profileId = profile.findFirst({ where: { userId } }).id
      → prefs = userPreferencesService.compute(profileId)
          → Redis HIT → вернуть кэш
          → Redis MISS → агрегировать VacancyInteraction + сохранить в Redis (TTL 1h)
      → [retrieval: keyword SQL + Pinecone — без изменений]
      → для каждой вакансии:
          features = extractVacancyFeatures(vacancy)
          personalScore = dotProduct(prefs, features)
          combinedScore = 0.5×(matchScore/100) + 0.3×semanticScore + 0.2×personalScore
      → filter dismissed, sort by combinedScore desc, slice(limit)
      → log RecommendationImpression (non-blocking, skipDuplicates)
      → return TOP-10
```

---

## UserPreferencesService

### Формула

```
weight: { analyze: 4, apply: 5, favorite: 3, click: 1, dismiss: -6 }
λ = ln(2) / 30   // полураспад 30 дней

для каждого interaction i:
  days_ago = (now - i.createdAt) / 86400000
  decay    = exp(-λ × days_ago)
  score[dimension][value] += weight[i.type] × decay
```

### Измерения preference vector

| Измерение | Значения | Источник |
|---|---|---|
| `archetype` | Backend, Frontend, Fullstack, Mobile, DevOps, ML/Data, QA, Manager | `detectArchetype(vacancy.title, vacancy.desc)` |
| `salary_band` | low, mid, high | salaryFrom/To в GBP: low<30k, mid 30–70k, high>70k |
| `work_format` | remote, onsite | schedule/location содержит "удал"/"remote" → remote |

`company_size` пропущен — Adzuna не предоставляет эти данные.

### Нормализация

После суммирования по каждому измерению — softmax, чтобы значения ∈ [0, 1]:

```typescript
function softmax(scores: Record<string, number>): Record<string, number> {
    const vals = Object.values(scores);
    const max = Math.max(...vals);
    const exps = vals.map(v => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return Object.fromEntries(
        Object.keys(scores).map((k, i) => [k, exps[i] / sum])
    );
}
```

### Redis cache

- Ключ: `prefs:v1:{profileId}`
- TTL: 3600 секунд (1 час)
- Инвалидация: при `recordInteraction()` — `redis.del(key)`

### Vacancy features (dot product)

```typescript
interface VacancyFeatures {
    archetype: Partial<Record<RoleArchetype, number>>;  // one-hot
    salary_band: Partial<Record<'low' | 'mid' | 'high', number>>;
    work_format: Partial<Record<'remote' | 'onsite', number>>;
}
```

`personalScore` = среднее dot-произведений по измерениям, у которых вакансия имеет данные (если данных нет — измерение пропускается, не штрафуется).

---

## Изменения в комбинированном скоре

```
// было
combinedScore = 0.6 × (matchScore/100) + 0.4 × semanticScore

// стало
combinedScore = 0.5 × (matchScore/100) + 0.3 × semanticScore + 0.2 × personalScore
```

Если у пользователя нет взаимодействий (новый юзер) → `personalScore = 0` → формула: `0.5×match + 0.3×semantic + 0` → поведение совместимо с текущим (нет регрессии для новых юзеров).

---

## Исправление бага profileId

**Текущий баг:** `profile.findFirst()` без `where` → всегда первый профиль в БД.

**Исправление:**
- `getRecommendedForProfile` получает дополнительный параметр `userId?: string`
- Внутри: `profile.findFirst({ where: { userId } })` при наличии userId
- Контроллер: добавить `@CurrentUser() user: { userId: string }` в `getRecommended`
- `recordInteraction`: аналогично — `userId` через `@CurrentUser`, передаётся в сервис

---

## RecommendationImpression (Phase 1.5)

### Prisma schema

```prisma
model RecommendationImpression {
  id           String   @id @default(uuid())
  profileId    String
  vacancyId    String
  position     Int
  score        Float
  modelVersion String   @default("rule-based-v1")
  createdAt    DateTime @default(now())

  @@index([profileId, createdAt])
}
```

### Логирование

После формирования и возврата TOP-10 — **не блокирующий** `createMany`:

```typescript
this.prisma.recommendationImpression.createMany({
    data: topVacancies.map((v, idx) => ({
        profileId,
        vacancyId: v.id,
        position: idx + 1,
        score: v.combinedScore,
        modelVersion: 'rule-based-v1',
    })),
    skipDuplicates: true,
}).catch(e => this.logger.warn(`[Impression] Log failed: ${e.message}`));
```

Дубликаты (один profileId + vacancyId + position в рамках одного дня) пропускаются через `skipDuplicates`.

---

## Error handling

- `UserPreferencesService.compute()`: если Redis недоступен — падаем в DB, возвращаем вектор без кэширования
- Если у профиля 0 взаимодействий — возвращаем пустой вектор `{}`, `personalScore = 0`
- Логирование impressions — полностью non-blocking (`.catch()`)
- Если `userId` не передан (legacy вызов) — `personalScore = 0`, поведение совместимо

---

## Testing

- Unit: `computeUserPreferences` — проверить decay формулу, softmax, dismiss даёт отрицательный вклад
- Unit: `dotProduct` — пустой вектор → 0, полное совпадение → 1
- Unit: `extractVacancyFeatures` — remote detection, salary band classification
- Integration: `getRecommendedForProfile` с userId → правильный profileId
- Integration: `recordInteraction` инвалидирует Redis кэш

---

## Что НЕ входит в этот спек

- Phase 2 (LightGBM, ml-service) — отдельный спек
- `company_size` dimension — нет данных из Adzuna
- A/B testing — Phase 2+
- `recommendation_impressions` retention policy — Phase 2+
