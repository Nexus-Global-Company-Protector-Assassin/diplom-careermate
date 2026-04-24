# Переход к самообучаемой системе подбора вакансий

> Дорожная карта перехода от rule-based персонализации к lightweight ML рекомендательной системе.  
> Стек: NestJS · PostgreSQL · Pinecone · Redis · Python (Phase 3+)

---

## Текущее состояние (Phase 0)

Что есть сегодня:

```
profile.skills + desiredPosition
        ↓
calcMatch() — 6-компонентная формула (role/skills/seniority/salary/desc/archetype)
        ↓
behavioral boost ×1.2 если archetype совпадает с историей кликов
        ↓
TOP-10 вакансий
```

**Проблемы Phase 0:**
- Boost захардкожен (1.2) — не зависит от количества/качества сигналов
- Только архетип как измерение предпочтений
- Нет decay: клик 3 месяца назад = клик сегодня
- Нет разницы между `analyze` (сильный сигнал) и `click` (слабый)
- Нет предсказания — только фильтрация

---

## Целевая архитектура (конечная цель)

```
┌─────────────────────────────────────────────────────────┐
│                   RETRIEVAL (широкий поиск)             │
│  Candidate Generation:                                  │
│  · Keyword match (Prisma SQL)                           │
│  · Semantic search (Pinecone — уже есть)                │
│  · Collaborative signals (Phase 3+)                     │
│  → TOP-200 кандидатов                                   │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│                   RANKING (точное ранжирование)         │
│  ML-модель на признаках (profile × vacancy):            │
│  · user history embeddings                              │
│  · vacancy content features                             │
│  · interaction signals (weighted + decayed)             │
│  → предсказание P(interact | user, vacancy)             │
│  → TOP-10 с объяснением                                 │
└─────────────────────┬───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│                   RE-RANKING (бизнес-логика)            │
│  · diversity (не показывать 10 одинаковых вакансий)     │
│  · freshness penalty (ghost job detection уже есть)     │
│  · explore/exploit (ε-greedy или UCB)                   │
└─────────────────────────────────────────────────────────┘
```

---

## Фазы перехода

### Phase 1 — Weighted Signals + Decay
**Когда:** прямо сейчас. Не требует данных.  
**Сложность:** 3/10  
**Эффект:** честная адаптивная персонализация

#### Как работает

Вместо бинарного boost (есть/нет) — накопительный preference score:

```
preference_score[dimension] = Σ weight[type] × decay(interaction.createdAt)

weight:  analyze=4, apply=5, favorite=3, click=1, dismiss=-6
decay:   e^(-λ × days_ago),  λ = ln(2)/30  ← период полураспада 30 дней
```

Dimensions для накопления:
- `archetype`: Frontend, Backend, ML/Data, DevOps...
- `salary_band`: low(<80k), mid(80-200k), high(>200k)
- `work_format`: remote, hybrid, onsite (после внедрения Phase 1 профиля)
- `company_size`: startup, enterprise (по сигналам из employer name/description)

#### Применение к ранжированию

```typescript
// Pseudo-code для getRecommendedForProfile

const prefs = await computeUserPreferences(profileId);
// prefs = {
//   archetype: { Frontend: 0.82, Backend: 0.31 },
//   salary_band: { mid: 0.64 },
//   work_format: { remote: 0.91 }
// }

for vacancy in candidates:
  personalScore = dot(prefs, vacancy.features)
  combinedScore = 0.5 * matchScore + 0.3 * semanticScore + 0.2 * personalScore
```

#### Что добавить в код

1. `computeUserPreferences(profileId)` — агрегирует `VacancyInteraction` с decay
2. Заменить hardcoded `×1.2` на `dot product` между preference vector и vacancy feature vector
3. Кэшировать `preferences` в Redis (TTL: 1 час)

---

### Phase 2 — Logistic Regression / LightGBM
**Когда:** ~500-1000 уникальных взаимодействий (примерно 50-100 активных пользователей за месяц)  
**Сложность:** 6/10  
**Эффект:** персонализация на уровне "умного" рекомендера

#### Что это такое

Бинарная классификация: предсказываем вероятность что пользователь взаимодействует с вакансией.

```
X = [user_features, vacancy_features, interaction_context]
y = 1 если (analyze OR apply OR favorite), 0 если (показали, но ignored > 2 дней)
model.predict_proba(X) → P(positive_interaction)
```

#### Feature set

**User features (из профиля + истории):**
```python
user_features = {
    # Static
    "experience_years": 3,
    "seniority_level": 2,          # 0=Jun, 1=Mid, 2=Sen
    "top_skills_embedding": [...],  # mean embedding навыков (text-embedding-3-small)
    
    # Dynamic (из истории)
    "preferred_archetype_vec": [0.82, 0.31, 0.12, ...],  # 8 архетипов
    "preferred_salary_band": 1,
    "session_length": 12,           # кол-во вакансий просмотрено сегодня
    "avg_days_between_sessions": 3,
}
```

**Vacancy features:**
```python
vacancy_features = {
    "archetype_vec": [1, 0, 0, ...],
    "salary_normalized": 0.65,      # относительно среднего по рынку
    "skill_overlap_ratio": 0.73,    # Jaccard(user.skills, vacancy.skills)
    "freshness_score": 0.9,
    "title_embedding": [...],       # Pinecone — уже есть!
    "description_length_log": 6.2,
    "has_salary": True,
    "days_since_published": 3,
}
```

**Cross features (user × vacancy):**
```python
cross_features = {
    "title_similarity": cosine(user.desired_position_emb, vacancy.title_emb),
    "skill_gap_size": len(missing_skills),
    "seniority_match": user.seniority == vacancy.seniority,
    "salary_ratio": vacancy.salary_avg / user.desired_salary,
}
```

#### Архитектура Python сервиса

```
ml-service/
├── src/
│   ├── features/
│   │   ├── user_features.py        # сборка user feature vector
│   │   ├── vacancy_features.py     # сборка vacancy feature vector
│   │   └── cross_features.py       # cross-product features
│   ├── training/
│   │   ├── dataset_builder.py      # SQL → pandas DataFrame
│   │   ├── trainer.py              # LightGBM / LogReg обучение
│   │   └── evaluator.py            # precision@k, NDCG, AUC
│   ├── serving/
│   │   ├── predictor.py            # загрузка модели → predict
│   │   └── api.py                  # FastAPI endpoint
│   └── scheduler.py                # retrain каждые N новых interactions
├── models/
│   └── ranker_v{version}.pkl       # сериализованная модель
└── Dockerfile
```

#### API контракт

```
POST /ml/rank
{
  "profile_id": "uuid",
  "vacancy_ids": ["id1", "id2", ..., "id200"]
}
→
{
  "ranked": [
    { "vacancy_id": "id7", "score": 0.91, "explanation": {...} },
    { "vacancy_id": "id23", "score": 0.87, ... },
    ...
  ]
}
```

NestJS вызывает `ml-service` после получения TOP-200 кандидатов из Pinecone+SQL.

#### Датасет для обучения

```sql
-- Positive examples: vacancy взаимодействовали
SELECT
    vi.profile_id,
    vi.vacancy_id,
    1 AS label,
    vi.type,
    vi.created_at
FROM "VacancyInteraction" vi
WHERE vi.type IN ('analyze', 'apply', 'favorite')

UNION ALL

-- Negative examples: vacancy была рекомендована, но игнорирована > 2 дней
SELECT
    shown.profile_id,
    shown.vacancy_id,
    0 AS label,
    'ignored' AS type,
    shown.created_at
FROM recommendation_impressions shown
LEFT JOIN "VacancyInteraction" vi
    ON vi.profile_id = shown.profile_id
    AND vi.vacancy_id = shown.vacancy_id
WHERE vi.id IS NULL
    AND shown.created_at < NOW() - INTERVAL '2 days'
```

> Нужна таблица `recommendation_impressions` — логировать какие вакансии были показаны пользователю. Добавить в Phase 2.

#### Когда переобучать

```python
# scheduler.py
RETRAIN_THRESHOLD = 200  # новых взаимодействий с последнего обучения

def should_retrain():
    new_interactions = db.count(
        "SELECT COUNT(*) FROM VacancyInteraction WHERE created_at > last_train_at"
    )
    return new_interactions >= RETRAIN_THRESHOLD
```

---

### Phase 3 — Two-Tower Neural Network
**Когда:** ~5000+ взаимодействий, ~500+ активных пользователей  
**Сложность:** 8/10  
**Эффект:** Netflix-уровень персонализации

#### Принцип

Два отдельных энкодера (башни):

```
User Tower:                    Vacancy Tower:
  profile features               vacancy content
  interaction history            skills, title, description
        ↓                               ↓
  user_embedding[128]          vacancy_embedding[128]
        ↓                               ↓
        └──────── dot product ──────────┘
                       ↓
              relevance_score ∈ [0, 1]
```

**Ключевое преимущество над LightGBM:**  
Vacancy Tower вычисляется один раз для всех вакансий → результаты хранятся в Pinecone (у нас уже есть!) как vectors. При запросе: вычислить только User Tower → ANN search в Pinecone → мгновенный TOP-200.

#### Интеграция с существующим Pinecone

```
Текущий Pinecone:  vacancy_content_embedding (text-embedding-3-small)
Phase 3 Pinecone:  vacancy_tower_embedding    (128-dim, обученный)

Namespace: "vacancies-v1" → уже есть
           "vacancies-ml-v1" → Phase 3
```

#### Техстек

```python
# PyTorch (или TensorFlow)
import torch
import torch.nn as nn

class UserTower(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Sequential(
            nn.Linear(user_feature_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 128),
        )
    def forward(self, x): return F.normalize(self.fc(x), dim=-1)

class VacancyTower(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Sequential(
            nn.Linear(vacancy_feature_dim, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 128),
        )
    def forward(self, x): return F.normalize(self.fc(x), dim=-1)

# Loss: In-batch negative sampling (как у Google BERT4Rec)
loss = nn.CrossEntropyLoss()
scores = torch.matmul(user_emb, vacancy_emb.T)  # (B, B)
labels = torch.arange(scores.size(0))           # diagonal = positive
```

---

### Phase 4 — Contextual Bandits + Explore/Exploit
**Когда:** продакшн, несколько тысяч DAU  
**Сложность:** 9/10  

Система начинает **эксплорировать**: намеренно показывает вакансии чуть ниже по скору, чтобы собирать новые сигналы и не застрять в эхо-камере.

```
ε-greedy:   с вероятностью ε показываем случайную вакансию из TOP-50
UCB:        score[i] += √(2 ln(N) / n_i)
            N = всего рекомендаций показано, n_i = показов вакансии i
```

---

## Хранение данных для ML

### Новые таблицы

```prisma
// Логирование показов — нужно для отрицательных примеров
model RecommendationImpression {
  id          String   @id @default(uuid())
  profileId   String
  vacancyId   String
  position    Int      // позиция в выдаче (1-10)
  score       Float    // combinedScore на момент показа
  modelVersion String  // "rule-based-v1", "lgbm-v2"
  createdAt   DateTime @default(now())

  @@index([profileId, createdAt])
}

// Версии моделей + метрики
model MLModelVersion {
  id          String   @id @default(uuid())
  version     String   @unique
  algorithm   String   // "lgbm", "logreg", "two-tower"
  trainedAt   DateTime
  precision10 Float?   // precision@10
  ndcg10      Float?   // NDCG@10
  auc         Float?
  isActive    Boolean  @default(false)
  artefactPath String  // путь к .pkl / .pt файлу
}
```

### Что логировать с каждым показом

```typescript
// При вызове getRecommendedForProfile — после формирования TOP-10
await prisma.recommendationImpression.createMany({
  data: rankedVacancies.map((v, idx) => ({
    profileId: profile.id,
    vacancyId: v.id,
    position: idx + 1,
    score: v.combinedScore,
    modelVersion: 'rule-based-v1',
  })),
  skipDuplicates: true,
});
```

---

## Метрики качества

| Метрика | Что измеряет | Цель |
|---|---|---|
| **Precision@10** | Доля релевантных в TOP-10 | > 0.4 |
| **NDCG@10** | Качество порядка ранжирования | > 0.5 |
| **CTR** | Клики / показы | > 15% |
| **Apply Rate** | Отклики / показы | > 3% |
| **Dismiss Rate** | "Не интересует" / показы | < 10% |
| **Session Depth** | Сколько вакансий просматривает за сессию | > 5 |

### Offline vs Online оценка

```
Offline (при разработке):
  · Train на interactions до даты T
  · Validate на interactions после T
  · Метрики: Precision@K, NDCG@K, AUC

Online (в продакшне):
  · A/B test: 50% пользователей видят rule-based, 50% — ML-модель
  · Метрики: Apply Rate, Session Depth, Dismiss Rate
  · Статистическая значимость: t-test, p < 0.05
```

---

## Детальный план перехода

```
Сейчас
  ↓
Phase 1 (2-3 дня)
  · Weighted signals + decay в getRecommendedForProfile
  · Preference vector по 4 измерениям (archetype, salary_band, format, seniority)
  · Redis-кэш preference vectors (TTL 1h)
  ↓
Phase 1.5 (1 день)
  · Логировать RecommendationImpression
  · Накапливать данные (нужно ~4-8 недель трафика)
  ↓
Phase 2 (1-2 недели)
  · Python ml-service с FastAPI
  · Dataset builder (SQL → pandas)
  · LightGBM на ~30 признаках
  · Retrain scheduler (каждые 200 новых interactions)
  · Shadow mode: предсказываем, но не применяем, сравниваем с rule-based
  · Переключение после валидации метрик
  ↓
Phase 3 (1-2 месяца, при 5k+ interactions)
  · Two-tower model (PyTorch)
  · Vacancy embeddings → Pinecone namespace "vacancies-ml-v1"
  · Online обучение (incrmental fine-tuning)
  ↓
Phase 4 (продакшн-зрелость)
  · Contextual bandits
  · Multi-armed bandit для explore/exploit
```

---

## Архитектура сервисов (Phase 2+)

```
Frontend → NestJS API (:3001)
               ↓
    getRecommendedForProfile()
               ↓
    ┌──────────┴──────────┐
    │                     │
 Retrieval             Ranking
 (SQL + Pinecone)   (ml-service)
 → TOP-200          ← scores[]
    │                     │
    └──────────┬──────────┘
               ↓
         Re-ranking (diversity + freshness)
               ↓
         TOP-10 + matchReasons
               ↓
         Log RecommendationImpressions
```

```yaml
# docker-compose.yml (Phase 2+)
services:
  backend:     # NestJS :3001
  ml-service:  # FastAPI :3003 (Python)
  ml-trainer:  # scheduled job (cron)
  postgres:
  redis:
  pinecone:    # external
```

---

## Что использует Netflix / Yandex и как это соотносится

| Компания | Retrieval | Ranking | Explore |
|---|---|---|---|
| Netflix | Two-tower ANN | Constrained optimization | Bandits |
| Yandex Market | MatrixNet (GBDT) | CatBoost | ε-greedy |
| Spotify | Word2Vec on плейлистах | LightFM | Thompson Sampling |
| **CareerMate Phase 1** | SQL + Pinecone | rule-based weights | нет |
| **CareerMate Phase 2** | SQL + Pinecone | LightGBM | нет |
| **CareerMate Phase 3** | Two-tower + Pinecone | Two-tower dot product | ε-greedy |

Ключевое отличие от Netflix: у них миллионы пользователей и collaborative filtering работает из-за плотности данных. На старте с тысячами пользователей **content-based (Phase 2, LightGBM на признаках)** работает лучше коллаборативных методов.

---

## Минимальный viable Path для инвесторов

Если нужно показать "ML" уже сейчас:

1. **Phase 1** (3 дня) — честно называется "adaptive personalization based on behavioral signals"
2. **Логирование показов** (1 день) — собираем данные
3. **Offline анализ** (1 день) — показываем precision@K на исторических данных как доказательство работы
4. **Roadmap до Phase 2** — конкретные сроки и метрики

Это честно, реализуемо быстро и даёт инвесторам понятную траекторию.

---

*Документ создан: 2026-04-24*  
*Версия: 1.0*  
*Следующий шаг: реализовать Phase 1 (weighted signals + decay)*
