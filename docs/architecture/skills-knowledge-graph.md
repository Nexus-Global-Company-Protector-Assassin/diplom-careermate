# Skills Knowledge Graph — Architecture & Roadmap

## Текущая реализация

### Стек
- **Neo4j 5.18 Community** — граф БД с нативным vector index
- **Polza.ai** (`openai/text-embedding-3-small`, 1536-dim) — генерация эмбеддингов навыков
- **NestJS** — `Neo4jService`, `KnowledgeGraphService`, `SkillClassifierService`
- **PostgreSQL / Prisma** — остаётся источником FK-целостности (`Skill`, `ProfileSkill`, `VacancySkill`)

### Граф-схема

```
(:Skill {id, name, category, embedding[], aliases[], source, updatedAt})
(:Category {name})
(:User {id, updatedAt})

(:Skill)-[:BELONGS_TO]->(:Category)
(:Skill)-[:CO_OCCURS_WITH {count, createdAt, lastSeenMs}]-(:Skill)
(:User)-[:HAS_SKILL {since, lastSeen}]->(:Skill)
```

### Как работает `findOrCreate`

```
Входящий навык (rawName)
        │
        ▼
  In-memory cache hit? ──YES──► вернуть (O(1), без I/O)
        │ NO
        ▼
  generateEmbedding(rawName)  [Polza.ai API]
        │
        ├─ null (нет API key) ──► capitalize + Prisma upsert
        │
        ▼
  findSimilarSkill(embedding)  [Neo4j vector search, cosine > 0.85]
        │
        ├─ FOUND ──► canonical name из графа → Prisma upsert + KG upsert
        │
        └─ NOT FOUND ──► classifySkill(rawName)  [LLM fast model]
                               │
                               ▼
                         Prisma upsert + KG upsert (source: llm_classified)
```

### Graph-expanded matching (soft match)

При подборе вакансий `getRecommendedForProfile` перед scoring'ом делает один запрос в Neo4j:

```cypher
MATCH (known:Skill)-[r:CO_OCCURS_WITH]-(adjacent:Skill)
WHERE known.id IN $skillIds AND NOT adjacent.id IN $skillIds
WITH adjacent,
     sum(r.count * exp(-0.00770 * (timestamp() - r.lastSeenMs) / 86400000.0)) AS decayedWeight
RETURN adjacent ORDER BY decayedWeight DESC LIMIT 20
```

Полученные смежные навыки передаются в `calcMatch` как `pExpandedSkills`. Итоговый skill score:

```
skillScore = exactJaccard × 0.70 + softJaccard × 0.30
```

Это позволяет давать частичный балл кандидатам с соседними навыками. Например:
- Профиль: `[React, TypeScript]`
- Граф: `React → Next.js (847 co-occ)`, `TypeScript → Angular (312 co-occ)`
- Вакансия требует: `[Next.js, PostgreSQL]`
- Без графа: 0% skill match
- С графом: ≈ 30% soft match → вакансия попадает в выдачу

### Temporal decay на CO_OCCURS_WITH

Полупериод — **90 дней** (`λ = ln(2)/90 ≈ 0.00770`).

```
weight(t) = count × e^(-λ × days_since_last_seen)
```

`lastSeenMs` обновляется при каждом `syncVacancySkills`. Устаревшие паттерны (навыки из вакансий 6-месячной давности) постепенно теряют вес по сравнению со свежими данными.

### Жизненный цикл данных

```
Новая вакансия сохранена
  └─ syncVacancySkills(vacancyId, rawSkills)
       ├─ findOrCreate() для каждого навыка  [KG + LLM если новый]
       └─ recordCoOccurrence(skillIds)        [CO_OCCURS_WITH +1, lastSeenMs = now]

Профиль обновлён
  └─ syncProfileSkills(profileId, rawSkills)
       ├─ findOrCreate() для каждого навыка
       ├─ Prisma: ProfileSkill replace
       └─ syncUserSkills(profileId, skillIds) [(:User)-[:HAS_SKILL]->(:Skill)]

Рекомендации запрошены
  └─ getRecommendedForProfile(position, profileSkills)
       ├─ getExpandedSkillNames(profileSkills, 20)  [CO_OCCURS_WITH traverse]
       └─ calcMatch(..., expandedSkills)             [70% exact + 30% soft]
```

---

## Roadmap дальнейшего развития

### Phase 1 — Graph Analytics ✅ Реализовано

### Phase 2 — Semantic Profile Vector ✅ Реализовано

---

### Phase 1 — Graph Analytics (детали реализации)

**Skill communities / кластеры**

Neo4j GDS (Graph Data Science) позволяет запускать community detection прямо в базе:

```cypher
CALL gds.louvain.stream('skillGraph')
YIELD nodeId, communityId
RETURN gds.util.asNode(nodeId).name AS skill, communityId
ORDER BY communityId, skill
```

Результат: кластеры типа `{React, Next.js, Redux, Tailwind}` или `{Python, FastAPI, Pandas, NumPy}`. Это основа для:
- "Skill tracks" на фронте: показывать пользователю следующий логичный шаг в его треке
- Улучшения matching: вакансии и кандидаты из одного кластера получают бонус

**Что нужно:**
- Поднять Neo4j GDS plugin (добавить в docker-compose `NEO4J_PLUGINS: '["apoc", "graph-data-science"]'`)
- Создать named graph projection: `CALL gds.graph.project('skillGraph', 'Skill', {CO_OCCURS_WITH: {orientation: 'UNDIRECTED', properties: 'count'}})`
- Добавить `communityId` как свойство узла `Skill`, обновлять еженедельно
- Expose через `GET /skills/graph/communities`

---

### Phase 2 — Semantic Profile Vector (2–3 недели)

Вместо сравнения строк через Jaccard, вычислять **профильный вектор** как взвешенное среднее эмбеддингов навыков кандидата:

```
profileVector = Σ (embedding(skill_i) × level_weight_i) / N

level_weight: beginner=0.5, intermediate=1.0, expert=1.5
```

Затем сравнивать `profileVector` с `vacancyVector` (аналогично, из навыков вакансии) через cosine similarity в Neo4j:

```cypher
MATCH (u:User {id: $profileId})
MATCH (v:Vacancy {id: $vacancyId})
WITH u.skillVector AS pv, v.skillVector AS vv
RETURN gds.similarity.cosine(pv, vv) AS semanticMatch
```

**Что нужно:**
- Добавить `skillVector: float[]` на узел `User` (агрегат эмбеддингов навыков)
- Добавить `skillVector: float[]` на узел `Vacancy`
- Обновлять при `syncUserSkills` / `syncVacancySkills`
- Заменить 30% soft-match на cosine similarity между векторами

Это устраняет главный недостаток Jaccard — он не понимает синонимы и близкие технологии.

---

### Phase 3 — ML Feature Engineering из графа ✅ Реализовано

### Phase 4 — Knowledge Graph as Skill Ontology ✅ Реализовано

---

### Phase 3 — ML Feature Engineering из графа (детали реализации)

Обогатить фичи для `ml-service` (LightGBM) данными из Neo4j:

```python
# В ml-service/src/features/graph_features.py

def extract_graph_features(profile_skill_ids, vacancy_skill_ids, neo4j_session):
    return {
        # Средняя дистанция (hop count) между навыками профиля и вакансии
        'avg_skill_distance': query_shortest_paths(profile_skill_ids, vacancy_skill_ids),
        # Доля навыков вакансии в том же кластере что и навыки профиля
        'cluster_overlap': query_community_overlap(profile_skill_ids, vacancy_skill_ids),
        # Общее число навыков в «расширенном» профиле (глубина 2 хопа)
        'expanded_profile_size': query_2hop_neighborhood(profile_skill_ids),
        # Co-occurrence strength: насколько часто профильные навыки встречаются вместе с навыками вакансии
        'cooccurrence_strength': query_cooccurrence_sum(profile_skill_ids, vacancy_skill_ids),
    }
```

Эти 4 фичи добавляются к существующим 45 фичам LightGBM — ожидаемый прирост NDCG@10 на 5–10%.

---

### Phase 4 — Knowledge Graph as Skill Ontology (2–4 месяца)

Перейти от плоского `CO_OCCURS_WITH` к полноценной онтологии навыков:

```
(:Skill)-[:IS_A]->(:Skill)             // Next.js IS_A React framework
(:Skill)-[:REQUIRES]->(:Skill)         // Kubernetes REQUIRES Docker
(:Skill)-[:ENABLES]->(:Skill)          // TypeScript ENABLES better React
(:Skill)-[:DEPRECATED_BY]->(:Skill)   // Webpack DEPRECATED_BY Vite (partial)
(:Skill)-[:MARKET_DEMAND {score, updatedAt}]->(:MarketSnapshot)
```

**IS_A / REQUIRES** заполнять через:
1. LLM batch job: для каждой пары навыков с высоким CO_OCCURS_WITH — запросить у LLM тип связи
2. Curated seed data: вручную заполнить критичные пары (React → JavaScript, Kubernetes → Docker)

**MARKET_DEMAND** из парсера вакансий: количество вакансий с этим навыком за последние 30 дней → нормализованный score 0–100. Обновлять еженедельно.

**Применение:**
- `IS_A` позволяет засчитывать "знание React" как частичное "знание JavaScript"
- `MARKET_DEMAND` используется в рекомендациях курсов и skill gap советах
- `DEPRECATED_BY` помогает предупреждать кандидатов о устаревших технологиях в вакансии

---

## Полезные Cypher-запросы для исследования

```cypher
-- Топ-20 самых связанных навыков
MATCH (s:Skill)-[r:CO_OCCURS_WITH]-()
RETURN s.name, count(r) AS connections, sum(r.count) AS totalWeight
ORDER BY totalWeight DESC LIMIT 20;

-- Найти путь между двумя навыками
MATCH path = shortestPath((a:Skill {name: "React"})-[:CO_OCCURS_WITH*..5]-(b:Skill {name: "Python"}))
RETURN [n in nodes(path) | n.name] AS skillPath;

-- Навыки пользователя и смежные (1 хоп)
MATCH (u:User {id: $profileId})-[:HAS_SKILL]->(s:Skill)-[r:CO_OCCURS_WITH]-(adjacent:Skill)
WHERE NOT (u)-[:HAS_SKILL]->(adjacent)
RETURN adjacent.name, sum(r.count) AS relevance
ORDER BY relevance DESC LIMIT 15;

-- Статистика графа
MATCH (s:Skill) WITH count(s) AS skills
MATCH (u:User) WITH skills, count(u) AS users
MATCH ()-[r:CO_OCCURS_WITH]-() WITH skills, users, count(r)/2 AS coOccurrences
RETURN skills, users, coOccurrences;

-- Навыки с decay < 0.1 (фактически мёртвые связи)
MATCH ()-[r:CO_OCCURS_WITH]-()
WHERE r.lastSeenMs IS NOT NULL
  AND toFloat(r.count) * exp(-0.00770 * toFloat(timestamp() - r.lastSeenMs) / 86400000.0) < 0.1
RETURN count(r) AS deadEdges;
```

---

## Операционные заметки

### Первый запуск
```bash
docker compose up neo4j -d
# Дождаться health check (~60 секунд)

# Auto-seed запустится автоматически при старте backend
# Или вручную:
npx ts-node --project tsconfig.json prisma/scripts/seed-neo4j.ts
```

### Neo4j Browser
`http://localhost:7474` — логин `neo4j` / `careermate_neo4j`

### Мониторинг
```bash
# Размер графа
curl http://localhost:3001/api/v1/skills/graph/stats

# Смежные навыки для React
curl "http://localhost:3001/api/v1/skills/graph/related?name=React&limit=10"
```

### Переменные окружения
| Переменная | По умолчанию | Описание |
|---|---|---|
| `NEO4J_URI` | — | `bolt://localhost:7687` в dev |
| `NEO4J_USER` | `neo4j` | Пользователь |
| `NEO4J_PASSWORD` | — | Пароль |
| `NEO4J_DATABASE` | `neo4j` | База данных |

Если `NEO4J_URI` не задан — KG отключён, система работает на Prisma-only режиме (graceful degradation).
