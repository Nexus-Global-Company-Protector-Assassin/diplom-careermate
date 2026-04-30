# CareerMate — Claude Memory File

> Этот файл читается Claude Code при каждом запуске.
> После каждой значимой сессии — обновляй соответствующие секции.

---

## 🏗️ Архитектура проекта

**Монорепо** со следующими модулями:
- `frontend/` — Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, NextAuth.js. Порт **:3000**
- `backend/` — NestJS + TypeScript, PostgreSQL + Prisma ORM, Redis + BullMQ, JWT + Passport. Порт **:3001**
- `agent/` — AI-агент (NestJS + LangChain + Qdrant). Порт **:3002** (`NEXT_PUBLIC_AGENT_URL`)
- `data-parsers/hh_parser/` — парсер вакансий с hh.ru (Python)
- `devops/` — Docker, CI/CD конфиги
- `docs/` — документация

**Запуск:** `npm run dev` (frontend :3000, backend :3001)
**БД:** PostgreSQL через Prisma, Redis для очередей/кэша
**Хранилище:** MinIO (dev) / S3 (prod)

---

## 🧠 Ключевые архитектурные решения

### AI-пайплайн генерации резюме (два независимых потока)

**Поток 1 — agent (`:3002`)** — тяжёлая AI-логика:
- `agent/src/agent/tools/generate-resume.tool.ts` — адаптация резюме под вакансию (cached)
- `agent/src/agent/tools/review-resume.tool.ts` — глубокий анализ + улучшенная версия
- `agent/src/agent/tools/create-resume.tool.ts` — создание с нуля (2 шага: вопросы → генерация)
- `agent/src/agent/tools/parse-resume.tool.ts` — парсинг файла
- Используют `LlmGatewayService` + structured output через Zod-схемы

**Поток 2 — backend (`:3001`)** — лёгкая AI-логика:
- `backend/src/modules/ai/ai.service.ts` — cover letter, vacancy analysis, interview prep, career chat
- Использует LangChain chains из `backend/src/modules/ai/langchain/`
- `CoverLetterChain`, `VacancyAnalysisChain`, `InterviewPrepChain`, `CareerChatChain`

**Правило маршрутизации:** frontend смотрит на `NEXT_PUBLIC_AGENT_URL` для agent-запросов, на `API_BASE_URL` для backend-запросов.

### 2026-04-24: Stanford CAR-метод добавлен во все промпты генерации резюме
Стандарт Stanford Career Education (CAR = Challenge → Action → Result) внедрён во все три инструмента агента и в cover letter generation:
- Каждый achievement bullet обязан начинаться с Action Verb + конкретное действие + измеримый результат
- Плохо: "Занимался разработкой API" → Хорошо: "Разработал REST API на NestJS с 5000 RPS, сократив latency с 400мс до 80мс"
- Чеклист ATS-совместимости добавлен в review-resume
- Google XYZ ("Accomplished X as measured by Y by doing Z") = эквивалент CAR

### 2026-04-24: Standalone cover letter подключён к AI
До этого `/resumes/cover-letter` (standalone генератор, без вакансии) возвращал шаблонный текст без AI.
Решение: `ResumesModule` теперь импортирует `AiModule`, `ResumesService` инжектирует `AiService`.
Standalone CL теперь вызывает `aiService.generateCoverLetter()` с собранным контекстом из профиля.

### Два пути cover letter:
1. **Standalone** (`/resumes/cover-letter` → `ResumesService.generateCoverLetter`) — из профиля + company/position
2. **Vacancy-linked** (`/vacancies/:id/cover-letter` → `VacanciesService.generateCoverLetter`) — из резюме + полная вакансия

---

## 🐳 DevOps & CI/CD (переработано 2026-04-24)

### Стратегия деплоя
- **Все сервисы** → VPS через SSH, Docker Compose с образами из GHCR (frontend + backend + agent + postgres + redis)
- nginx на порту 80 роутит: `/` → frontend:3000, `/api/*` → backend:3001, `/auth/*` → backend:3001, `/ai/*` → agent:3002
- **Инфра** → `devops/docker/docker-compose.prod.yml` (только `image:`, без `build:`)
- **Dev** → `docker-compose.yml` в корне (postgres, redis, minio, mailhog, agent)

### Docker Registry (GHCR)
Образы публикуются в GitHub Container Registry автоматически из `deploy.yml`:
- Теги: `sha-<7chars>` (трекабельность) + `latest` (для ручных деплоев)
- `BACKEND_IMAGE=ghcr.io/<org>/careermate-backend:sha-abc1234`
- `AGENT_IMAGE=ghcr.io/<org>/careermate-agent:sha-abc1234`
- `GITHUB_TOKEN` достаточно — дополнительных секретов для GHCR не нужно

### Dockerfiles — канонические версии
| Сервис | Файл | Особенности |
|---|---|---|
| frontend | `frontend/Dockerfile` | Node 20, multi-stage, non-root, standalone output |
| backend | `backend/Dockerfile` | Node 20, multi-stage, dumb-init, non-root |
| agent | `agent/Dockerfile` | Node 20, multi-stage, dumb-init, non-root (переработан 2026-04-24) |

**Старые** `devops/docker/Dockerfile.backend` и `devops/docker/Dockerfile.frontend` — устаревшие, CI/CD использует файлы из директорий сервисов.

### CI/CD пайплайн

**`ci.yml`** (на push/PR в main/develop):
```
changes (dorny/paths-filter)
  ↓
lint + typecheck (условно, только изменённые сервисы)
test-backend (postgres + redis services, только если backend изменился)
test-agent (только если agent изменился)
security (Trivy, результаты → GitHub Security tab)
  ↓
ci-gate (единая точка для branch protection)
```

**`deploy.yml`** (на push в main):
```
build [matrix: backend, agent, параллельно] → GHCR
deploy-frontend [параллельно с build] → Vercel
  ↓
migrate (npx prisma migrate deploy против prod DATABASE_URL)
  ↓
deploy-backend (SSH → docker pull → docker compose up → health check polling)
  ↓
smoke-test (retry-цикл, Slack-нотификация)
```

### Ключевые решения по безопасности (2026-04-24)
- **Postgres и Redis НЕ имеют `ports:`** в prod — только `expose:` (внутри Docker-сети)
- Миграции в **отдельном сервисе** `migrate` с `restart: "no"`, backend зависит от `service_completed_successfully`
- Resource limits на все prod-контейнеры (memory + cpus)
- `docker image prune` только с `--filter dangling=true` — не удаляет образы других проектов

### Секреты GitHub Actions (нужно добавить в Settings → Secrets)
```
VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
SSH_HOST, SSH_USER, SSH_PRIVATE_KEY
DATABASE_URL (prod)
PRODUCTION_API_URL, PRODUCTION_FRONTEND_URL
SLACK_WEBHOOK (опционально)
CODECOV_TOKEN (опционально)
```

### Ручной деплой на VPS
```bash
./devops/scripts/deploy.sh production
# Загружает .env.production, бэкапит БД, pull images, migrate, rolling restart, health polling
```

---

## 📦 Модули backend (NestJS)

- `auth/` — JWT + OAuth2
- `users/` — пользователи
- `profiles/` — профили и CV
- `resumes/` — хранение резюме, upload в MinIO/S3, cover letter generation (через AI)
- `vacancies/` — вакансии, парсинг hh.ru, AI-анализ (Ghost Job Detection, архетипы)
- `interviews/` — подготовка к интервью, STAR+R генерация
- `ai/` — LangChain цепочки: career chat, vacancy analysis, interview prep, cover letter
- `analytics/` — аналитика профиля
- `skills/` — извлечение навыков через AI
- `poc/` — прототипы

---

## 🗄️ База данных

**ORM:** Prisma
**Схема:** `backend/prisma/`

### Ключевые модели
- `Profile` — профиль кандидата (fullName, desiredPosition, skills[], aboutMe, workExperience JSON)
- `Resume` — резюме (profileId, title, subtitle, content Markdown/text, type, status, fileKey?, reviewData JSON)
  - type: `resume` | `cover_letter` | `uploaded_file`
  - status: `active` | `draft` | `outdated`
- `Vacancy` — вакансия (hhId, title, employer, skills[], salaryLabel, experience, schedule)
- `VacancyResponse` — отклик (profileId, position, company, status, statusColor)

**Важно:** `fileKey` в модели `Resume` есть в коде, но может не быть в Prisma schema (pending migration). Это pre-existing issue.

---

## 🔑 Переменные окружения

Шаблон в `.env.example`. Ключевые группы:
- DB: `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- Redis: `REDIS_URL`, `REDIS_PASSWORD`
- AI: `LLM_API_KEY` (backend + agent), Pinecone credentials
- Auth: `JWT_SECRET`, OAuth credentials
- Storage: `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`
- Frontend: `NEXT_PUBLIC_API_URL` (→ :3001), `NEXT_PUBLIC_AGENT_URL` (→ :3002)

---

## 🐛 Известные проблемы (pre-existing, не трогать без задачи)

### TypeScript ошибки в backend (pre-existing)
```
resumes.service.ts — Property 'fileKey' does not exist — нужна Prisma миграция
vacancies.service.ts — 'publishedAt' does not exist — нужна Prisma миграция
embeddings.service.ts — Cannot find module '@qdrant/js-client-rest' — не установлен
auth.service.ts — Cannot find module 'bcryptjs' — не установлен
```
**Agent (`agent/`) компилируется чисто** — `npx tsc --noEmit` без ошибок.

### Shimming PopoverTrigger
`asChild` на PopoverTrigger для skill input не работает с shadcn — заменено на native dropdown (commit `097ef70`).

---

## 📋 Текущий статус разработки

### Что работает ✅
- Аутентификация (JWT, header показывает реального пользователя из профиля/JWT)
- Профиль пользователя с навыками
- Загрузка резюме (PDF/DOCX) в MinIO/S3
- AI-ревью загруженного резюме (agent :3002)
- Генерация резюме под вакансию (agent :3002)
- Создание резюме с нуля через вопросы (agent :3002)
- AI cover letter для вакансии (backend :3001, Stanford-структура)
- Standalone cover letter generator (backend :3001, через AI)
- Анализ вакансий (Ghost Job Detection, 7 блоков A-G)
- Подготовка к интервью (STAR+R генерация)
- История резюме и откликов
- Парсинг вакансий hh.ru
- CI/CD: GitHub Actions с GHCR, path-filtering, health-check polling, Vercel + VPS деплой

### В процессе 🔄
- Промпты резюме по Stanford CAR-методу (внедрено 2026-04-24, нужно тестирование)

### Phase 1.5 → Phase 2 инфраструктура (2026-04-25) ✅

#### Phase 1 gap — seniority dimension
- `PreferenceVector` и `VacancyFeatures` расширены 4-м измерением `seniority` (junior/mid/senior/lead)
- `UserPreferencesService.extractSeniority()` — детекция из заголовка вакансии
- Аккумуляция в `compute()` и scoring в `computePersonalScore()` — автоматически через generic loop

#### MLModelVersion таблица (Prisma)
- Добавлена модель `MLModelVersion` (version, algorithm, trainedAt, metrics, isActive, artefactPath)
- Миграция: `20260425000001_add_ml_model_version`

#### Python ml-service (stub, порт :3003)
- `ml-service/` — FastAPI + scikit-learn/LightGBM infrastructure
- `/health`, `/ml/rank` (POST), `/ml/reload`, `/ml/train` endpoints
- Feature engineering: 21 vacancy + 19 user + 5 cross features
- `predictor.py` — load model if exists, fallback to heuristic stub (freshness + preference alignment)
- `dataset_builder.py` — SQL→pandas, positive/negative examples из VacancyInteraction + RecommendationImpression
- `trainer.py` — LightGBM (fallback LogReg), precision@10, NDCG@10, AUC, записывает MLModelVersion в DB
- Dockerfile + docker-compose.yml service + volume `ml_models`

#### NestJS MlRankingService
- `backend/src/modules/ml/ml-ranking.service.ts`
- Shadow mode (default `ML_SHADOW_MODE=true`): вызывает ml-service, логирует разницу в TOP-3, применяет rule-based scores
- `ML_SHADOW_MODE=false` → переключение на ML-ранжирование
- Fallback при недоступности: возвращает пустой Map → caller продолжает с rule-based

#### Env vars
```
ML_SERVICE_URL=http://ml-service:3003   # когда сервис поднят
ML_SHADOW_MODE=true                     # false = использовать ML scores
```

#### Утилиты / фиксы тестов
- `vacancies.utils.ts` — pure-функции `detectArchetype` + `calcVacancyFreshness` без тяжёлых зависимостей
- `backend/__mocks__/empty-module.js` + `moduleNameMapper` в jest для `@qdrant` (pre-existing, не установлен)
- `tsconfig.json`: `isolatedModules: true`

### Career Assessment Quiz (2026-04-26) ✅
- **Тест**: 10 вопросов (5 универсальных + 5 доменных) о личности и стиле работы, организованы по 6 доменам (IT, Finance, Marketing, Management, Creative, Other)
- **Скоринг**: 6 измерений (Analytical, Technical, Social, Creative, Leadership, Structured), косинусное сходство против 30 карьерных путей → клиент передаёт топ-5 в AI
- **Карьерные пути**: 30 ролей в CAREER_PATHS с dimensionProfile-вектором, salaryRange, description
- **AI**: `CareerPathChain` (JsonOutputParser) → `AiService.generateCareerPathAnalysis()` → топ-3 с роадмапом Junior→Lead, текущими навыками и теми, что нужно изучить
- **Backend**: `CareerAssessmentModule` с `POST /career-assessment` + `GET /career-assessment/latest`, Redis-кэш 7 дней, mock-режим без LLM_API_KEY
- **Prisma**: новая таблица `CareerAssessment` (миграция `20260426000001_add_career_assessment`)
- **Frontend**: `CareerQuizModal` (домен → 10 вопросов → loading → close), `CareerPathResult` (3 карточки с роадмапом accordion, pros/cons), секция в analytics-content.tsx
- **Тесты**: 14 frontend (career-scoring: compute/match/select) + 7 backend (service: cache, NotFoundException, DB, ordering)
- **Константы**: `career-questions.ts` (60 вопросов в банке), `career-paths.ts` (30 путей)

### Resume → Profile Auto-Fill (2026-04-25) ✅
- **Утилиты**: `map-parsed-to-profile.ts` (smart-merge: заполняет только пустые поля), `profile-completeness.ts` (7 полей, веса суммируются в 100)
- **`ProfileCompletenessCard`** — карточка с прогрессбаром и чипами пропущенных полей, отображается до 100% на странице профиля
- **`ResumeImportModal`** — 3-шаговый модал (Upload → Preview → Success), переиспользует `useUploadResume` + `useUpdateProfile`
- **Баннер в `MainLayout`** — появляется при score < 70%, dismissible через sessionStorage
- **Кнопка "Импорт из резюме"** — в заголовке страницы `/profile`
- **Тесты**: `frontend/src/features/profile/__tests__/profile-utils.test.ts` — 16 тестов (jest + ts-jest)
- **Удалён** старый `handleFileUpload` + `fileInputRef` из `profile-content.tsx` (заполнял только локальный стейт, не сохранял в БД)
- ParsedProfileDto расширен полем `careerGoals?`

### Поведенческие сигналы (2026-04-24) ✅
- **Модель**: `VacancyInteraction` (profileId, vacancyId, type: click/apply/favorite/analyze/dismiss) — unique per (profile, vacancy, type)
- **Миграция**: `20260424000002_add_vacancy_interactions`
- **Backend**: `recordInteraction(vacancyId, type)` — upsert, обновляет timestamp; `getRecommendedForProfile` — после ранжирования применяет behavioral boost (+20% combinedScore для предпочтительных архетипов) и фильтрует dismissed
- **Endpoint**: `POST /vacancies/:id/interaction { type }`
- **Frontend**: `useTrackInteraction` хук; трекинг в: `handleAnalyze` (analyze), `handleApply` (apply), `toggleFavorite` (favorite), `handleInterviewPrep` (click); кнопка "Не интересует" на каждой карточке → dismiss + скрытие карточки на клиенте

### Tomoru-inspired matching (2026-04-24) ✅
- **Профиль**: добавлены 3 поля предпочтений: `workFormatPreference` (remote/hybrid/onsite), `companyTypePreference` (startup/scaleup/enterprise/agency/product), `managementStylePreference` (flat/structured/autonomous/mentorship)
- **Миграция**: `backend/prisma/migrations/20260424000001_add_profile_preferences/migration.sql` — применится при следующем `prisma migrate deploy`
- **DTO**: поля добавлены в `CreateProfileDto` (UpdateProfileDto наследует через PartialType)
- **Frontend профиль**: новая карточка "Предпочтения поиска" с модалом (3 select-поля); данные сохраняются в БД через `syncToDb`
- **matchReasons**: `calcMatch` теперь возвращает `{ score, reasons[] }` — человекочитаемые объяснения совместимости ("✓ Навыки совпадают: React, TypeScript", "✗ Нет в профиле: Docker")
- **Frontend вакансии**: на карточке вакансии отображаются `matchReasons` в виде цветных пилюль (синие — позитивные, оранжевые — негативные)

### LLM-оптимизация (2026-04-24) ✅
- **P0**: Redis-кэш для `review-resume` (MD5(text+context)) и `parse-resume` (MD5(rawText)), TTL 24h
- **P1**: Redis-кэш для backend `evaluateVacancyInDepth`, `generateInterviewPrep`, `generateCoverLetter` — `cacheWrap` в `AiService`
- **P2 agent**: `parse-resume`, `analyze-profile`, `create-resume.generateQuestions` → `LLM_MODEL_NAME_FAST`
- **P2 backend**: `generateResponse` (chat) → `fastChat`; добавлен `fastChat` геттер в `LlmProviderService`
- **Polza.ai prompt caching**: auto-caching есть, но порог 1024 токенов — backend chain'ы (120–600 токенов) не дотягивают

### Phase 2 инфраструктура (2026-04-25) ✅
- ML-сервис stub готов (`ml-service/`), FastAPI запускается, shadow mode активен
- `MLModelVersion` таблица в Prisma для отслеживания обученных моделей
- Включить ML-ранжирование: поставить `ML_SHADOW_MODE=false` + `ML_SERVICE_URL=http://ml-service:3003`
- Обучение: `python -m src.training.trainer --min-samples 500` (нужно ~500 взаимодействий)

### Dev environment fixes (2026-04-28) ✅
- **Backend startup** — добавлен `JWT_REFRESH_SECRET` в `.env` и `backend/.env` (был только в `.env.example`). Без него `RtStrategy` падал с `Configuration key "JWT_REFRESH_SECRET" does not exist`, NestJS не стартовал → фронт получал `ERR_CONNECTION_REFUSED` на `/auth/login`
- **Stale tsbuildinfo** — `nest start --watch` мог показывать ложные TS-ошибки (`embeddings.service.ts: QdrantVectorStore`) из-за устаревшего `backend/tsconfig.tsbuildinfo`. Свежий `tsc --noEmit` проходит чисто. При зависших ошибках компиляции в watch-режиме — удалить `*.tsbuildinfo`
- **Create-resume questions schema** — `ResumeQuestionSchema.id`: `z.string()` → `z.coerce.string().optional()`. LLM (gemini-fast) возвращал `id` как число или вообще пропускал поле. Без coerce Zod падал с "Expected string, received number"; с coerce без optional `String(undefined)` давал литерал `"undefined"` для всех вопросов → React `key={undefined}` дубликаты. Решение: optional + post-обработка в `CreateResumeTool.generateQuestions` — назначает `q1, q2, ...` если LLM вернул пустой/повторяющийся id. Тесты: `agent/src/agent/schemas/create-resume.schema.spec.ts` (3 кейса)
- **Auto-refresh access token** — `frontend/src/shared/api/api-client.ts`. JWT access живёт 15 мин, refresh — 7 дней, но фронт раньше не обновлял access автоматически → через 15 мин любой запрос к backend возвращал 401, всплывал toast "Сессия истекла", сгенерированное резюме не сохранялось (`POST /resumes` падал). Теперь при 401 (кроме `/auth/login|register|refresh|logout`) ApiClient вызывает `POST /auth/refresh` с refresh-token Bearer, сохраняет новые токены и **повторяет** оригинальный запрос. Singleton `refreshPromise` исключает гонки при параллельных 401. Если refresh тоже не прошёл — `clearSessionAndRedirect()` чистит токены и редиректит на `/`

### Resume preview & contacts fix (2026-04-29) ✅
- **Preview modal off-screen** — `frontend/src/features/resume/resume-content.tsx`. Модал «Просмотр» резюме (`previewModalOpen`) не имел `max-h`/`overflow-y-auto`, длинный контент уходил за viewport. Добавлено `max-h-[90vh] overflow-hidden flex flex-col` на `DialogContent` + `flex-1 overflow-y-auto min-h-0` на внутренний контейнер + `break-words` на блок текста.
- **Email/phone не попадали в сгенерированное резюме** — agent's `ProfileData` (analyze-profile.tool.ts) расширен полями `email`, `phone`, `location`, `linkedinUrl`, `githubUrl`, `portfolioUrl`, `telegram`. `CreateResumeTool.buildProfileContext` теперь рендерит отдельный блок `Контакты:` с явным перечислением, промпт инструктирован использовать ТОЛЬКО переданные контакты (не выдумывать). Frontend `buildProfileForAgent` декодирует email из JWT `access_token`, прокидывает `phone/location/linkedin/github/portfolio` напрямую и парсит `Telegram:`/`GitHub:`/`Email:` из старого `aboutMe`-формата (где данные хранились конкатенированной строкой).
- **Тесты**: `agent/src/agent/tools/create-resume.tool.spec.ts` — 5 кейсов на `buildProfileContext` (контакты, partial-fields, omit-when-empty, aboutMe-separation).

### Email verification + Google OAuth (2026-04-29) ✅
- **Регистрация по коду** — двухшаговый процесс: `POST /auth/register/request-code` (создаёт `EmailVerificationCode` с `codeHash` + `passwordHash`, отправляет 6-значный код через Resend, 60s cooldown между запросами) → `POST /auth/register/verify` (сверяет код, создаёт `User` с `emailVerified=true`, возвращает JWT). Пользователь не создаётся пока код не подтверждён → нет orphan-юзеров. TTL кода 10 мин, lockout после 5 неверных попыток.
- **Resend интеграция** — `MailService` (`backend/src/modules/mail/`), HTML-шаблон с градиентом, fallback в dev: если `RESEND_API_KEY` пустой или равен placeholder `your-resend-api-key` — код логируется в консоль вместо отправки. From: `CareerMate <onboarding@resend.dev>`.
- **Google OAuth** — `passport-google-oauth20` стратегия (`auth/strategies/google.strategy.ts`), эндпоинты `GET /auth/google` (редирект на Google) → `GET /auth/google/callback` (callback, выдаёт токены). `handleGoogleAuth` ищет пользователя по `oauthId`, потом по email (link существующего email-аккаунта), иначе создаёт нового с `emailVerified=true`. Токены передаются на фронт через URL fragment (`#at=...&rt=...`) — не попадают в server logs.
- **Frontend** — `RegisterForm` переписан на 2 шага (credentials → 6-digit OTP input с `autoComplete="one-time-code"`, 60s resend countdown). `LoginForm` и `RegisterForm` оба показывают `GoogleButton` сверху с разделителем "или email". Новая страница `/auth/callback` парсит hash, сохраняет токены, редиректит на `/dashboard`.
- **Prisma** — `User.emailVerified Boolean @default(false)` (существующие юзеры авто-помечены `true` в миграции), новая модель `EmailVerificationCode` (`id, email, codeHash, passwordHash, expiresAt, attempts, used, createdAt`, индекс по `[email, used, expiresAt]`). Миграция `20260429000001_add_email_verification` применена.
- **Env vars (новые)** — `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `FRONTEND_URL`. Шаблоны в `.env.example`.
- **Тесты** — 14 кейсов в `auth.service.spec.ts` (request-code: cooldown, password hashing, normalization, invalidation; verify-code: expired, wrong code attempts, lockout, race condition; Google OAuth: new user / existing oauthId / link to email-password account) + 3 кейса в `mail.service.spec.ts` (dev mode logging, placeholder key detection, HTML build). Все 17 тестов зелёные.

### MVP Cleanup (2026-04-28) ✅
- **Избранные вакансии** — `FavoriteVacancy` модель в Prisma (миграция `20260428000001_add_favorite_vacancy`), `GET/POST /vacancies/favorites` с реальным toggle, оптимистичные обновления на фронте через React Query
- **Responses/Applications** — полностью вырезаны: эндпоинты убраны из контроллера, UI (кнопка "Откликнуться", applyModal, таблица откликов) убраны, аналитика переключена на favorites
- **Career Goal** — `saveGoal()` теперь сохраняет в БД через `PUT /profiles/me` (поля `desiredPosition`, `location`, `desiredSalaryMin`, `experienceYears`), loading state на кнопке
- **Analytics** — achievement "Активный соискатель" → "Исследователь" (10 избранных), weekly report теперь считает favorites вместо responses, career progress "Отклики идут" → "Вакансии сохранены"

### Production deployment (2026-04-29) ✅
- **nginx.conf** переписан: HTTP-only (port 80), без SSL/домена. Маршруты: `/api/*` → backend:3001, `/auth/*` → backend:3001, `/ai/*` → agent:3002, `/` → frontend:3000
- **docker-compose.prod.yml** дополнен всеми недостающими env vars: `JWT_REFRESH_SECRET`, `RESEND_API_KEY`, Google OAuth, `QDRANT_URL/API_KEY/COLLECTION`, `CORS_ORIGIN`, `FRONTEND_URL`, `REDIS_URL` для агента, `AGENT_PORT: 3002`
- **AGENT_PORT баг**: агент использовал `AGENT_PORT`, docker-compose передавал `PORT` → агент стартовал на 3003 вместо 3002. Исправлено: `AGENT_PORT: 3002`
- **Agent health endpoint**: `POST /ai/health` не совпадал с curl GET. Добавлен `agent/src/health.controller.ts` (GET /health) + `@Get('health')` в AgentController
- **Prisma Alpine OpenSSL**: добавлены `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` + `openssl` пакет в backend Dockerfile
- **Duplicate migration**: `20260419190749_add_normalized_skills` дублировал `20260415000002_add_skills_tables` → сделан idempotent (IF NOT EXISTS + DO EXCEPTION)
- **Создан** `.env.production.example`, `devops/scripts/setup-vps.sh`, обновлён `devops/README.md`

### CI/CD pipeline fixes (2026-04-30) ✅
Серия починок, после которых `deploy.yml` проходит end-to-end:
- **Docker image lowercase**: `github.repository` содержит заглавные буквы → `tr '[:upper:]' '[:lower:]'` в build и deploy jobs
- **Docker Hub rate limit**: postgres/redis/nginx дополнены `pull_policy: if_not_present` в docker-compose.prod.yml
- **nginx не стартовал**: не был включён в `$COMPOSE up -d` → добавлен явно
- **nginx stale upstream IP** (главная причина agent health check timeout): nginx кэширует DNS при старте, при пересоздании agent контейнера продолжает слать запросы на старый IP → 502. Исправлено двумя слоями:
  1. `resolver 127.0.0.11 valid=10s ipv6=off;` + `set $upstream "service:port"; proxy_pass http://$upstream;` в nginx.conf — заставляет переразрешать DNS по TTL
  2. `docker exec careermate-nginx nginx -s reload` в deploy script после compose up — немедленно сбрасывает DNS кэш
- **Smoke test "Check Frontend"**: проверял `PRODUCTION_API_URL/api/health`, но nginx роутит `/api/` на backend (NestJS), а NestJS prefix — `api/v1`. Исправлено на `PRODUCTION_API_URL/ai/health`
- **Slack webhook**: добавлен `continue-on-error: true` на Notify steps (секрет опциональный)

### Планируется 📌
- **Password reset** — отложено, нет email-сервиса
- **Phase 2 training** — после накопления 500+ взаимодействий запустить первое обучение LightGBM
- **RecommendationImpression логирование** ✅ уже есть — данные накапливаются
- Исправить pre-existing TypeScript ошибки (fileKey, publishedAt в Prisma)
- Подключить домен + SSL (Let's Encrypt) после регистрации домена — обновить nginx.conf и Google OAuth callback

---

## 🤖 Рекомендательная система (ML Roadmap)

> Подробная документация: `docs/architecture/recommendation-ml-roadmap.md`

### Текущая архитектура подбора вакансий
1. SQL (keyword match по `searchQuery`) + Pinecone (semantic ANN) → TOP-50 кандидатов
2. `calcMatch()` — 6-компонентный скор (role/skills/seniority/salary/desc/archetype)
3. Hybrid: `0.6 × matchScore + 0.4 × semanticScore`
4. Behavioral re-ranking: boost ×1.2 для preferred архетипов (из `VacancyInteraction`), фильтрация dismissed
5. TOP-10 → frontend с `matchReasons[]`

### Путь к ML (4 фазы)
| Фаза | Что | Данных нужно | Статус |
|---|---|---|---|
| **Phase 0** | Rule-based + behavioral boost ×1.2 | 0 | ✅ Готово |
| **Phase 1** | Weighted signals + decay, preference vector | 0 | 📌 Следующий шаг |
| **Phase 2** | LightGBM (Python ml-service :3003), 30 признаков | 500+ interactions | 📌 Планируется |
| **Phase 3** | Two-tower NN, vacancy embeddings → Pinecone | 5k+ interactions | 📌 Будущее |
| **Phase 4** | Contextual bandits, explore/exploit | DAU-зрелость | 📌 Будущее |

### Поведенческие сигналы (реализовано 2026-04-24)
- Модель `VacancyInteraction`: `type ∈ {click, apply, favorite, analyze, dismiss}`
- Endpoint: `POST /vacancies/:id/interaction`
- Frontend: автотрекинг на всех CTA + кнопка "Не интересует"
- **Текущий limitation**: boost захардкожен (1.2), нет decay, только archetype dimension

### Что нужно добавить для Phase 1
```typescript
// В vacancies.service.ts — заменить hardcoded ×1.2 на:
preference_score[dim] = Σ weight[type] × e^(-λ × days_ago)
weight: { analyze:4, apply:5, favorite:3, click:1, dismiss:-6 }
λ = ln(2)/30  // период полураспада 30 дней
dimensions: archetype, salary_band, work_format, seniority
```

### Критичные таблицы для ML
- `VacancyInteraction` — поведенческие сигналы ✅ есть
- `RecommendationImpression` — что показали (нужно для negative examples) 📌 нет ещё
- `MLModelVersion` — версии моделей и метрики 📌 нет ещё

---

## 💡 Паттерны и конвенции

### API
- Backend: `API_BASE_URL/resumes/*`, `API_BASE_URL/vacancies/*`, etc.
- Agent: `AGENT_URL/ai/review-resume`, `AGENT_URL/ai/generate-resume`, etc.
- Все мутации на фронте через TanStack Query `useMutation`

### NestJS
- Каждый модуль: `module.ts`, `service.ts`, `controller.ts`, `*.spec.ts`
- AI-логика в сервисах, не в контроллерах
- LangChain chains в `backend/src/modules/ai/langchain/` — один файл = один chain

### Промпты LLM
- **Structured output** в агенте: `llmGateway.generateJson(messages, ZodSchema, options)`
- **String output** в бэкенде: LangChain chain → `StringOutputParser` или `JsonOutputParser`
- Temperature: 0.2-0.3 для генерации резюме, 0.4 для вопросов, 0.7+ для чата
- Все промпты на русском. Технические термины — на английском внутри текста.

### Резюме (Stanford CAR-стандарт — принято 2026-04-24)
- Action Verb → конкретное действие → измеримый результат (%, мс, $, пользователи)
- Summary: 3-4 предложения без "я/мне/мы"
- ATS: стандартные заголовки, нет таблиц/колонок, ключевые слова из JD
- Структура: ФИО + контакты → Summary → Опыт → Навыки → Образование → Доп.

### Dockerfile-стандарт (принято 2026-04-24)
- Все образы: Node 20 alpine, 3 стадии (deps / builder / production)
- Non-root user (`nestjs` / `agent` / `nextjs`), `dumb-init` как entrypoint
- `npm prune --production` в финальной стадии
- `.dockerignore` рядом с каждым Dockerfile
- `HEALTHCHECK` на каждом сервисе

---

## 📝 Инструкции для Claude

1. **Перед началом работы** — перечитай этот файл полностью
2. **ОБЯЗАТЕЛЬНО: Уточняй перед реализацией** — перед тем как писать любой код, задай уточняющие вопросы: какой именно результат ожидается, есть ли edge cases, какие модули затрагиваются. Не приступай к коду пока не получил подтверждение от пользователя. Исключение: простые одностроковые правки, где намерение очевидно.
3. **ОБЯЗАТЕЛЬНО: Тесты после каждой задачи** — после завершения реализации: (а) если тестов для изменённого кода нет — напиши их; (б) запусти тесты (`npm test` в backend/ или agent/); (в) если падают — чини код или тест до зелёного состояния. Нет тестов = задача не сдана.
4. **В процессе работы** — если принимается важное решение, сразу предложи добавить его в соответствующую секцию
5. **После завершения задачи** — обнови секции "Текущий статус", "Известные проблемы" и "Архитектурные решения" если есть что добавить
6. **Стек неизменен** — не предлагай замену NestJS/Next.js/Prisma без явной просьбы
7. **Язык** — комментарии в коде на английском, общение на русском
8. **Автообновление** — после каждой завершённой задачи автоматически обновляй соответствующие секции этого файла без дополнительного запроса. Фиксируй: что сделано, какие решения приняты, что сломалось и как починили.
9. **Pre-existing TS-ошибки** — не трогать fileKey/publishedAt/bcryptjs ошибки без явной задачи. Agent компилируется чисто.
10. **AI промпты** — все новые промпты для резюме должны следовать Stanford CAR-методу (см. секцию "Паттерны")
11. **Dockerfile** — новые сервисы должны следовать стандарту: Node 20, multi-stage, non-root, dumb-init, HEALTHCHECK (см. секцию "Паттерны")
12. **CI/CD** — не менять `sleep N` как способ ожидания — использовать health check polling циклами

---

*Последнее обновление: 2026-04-30*
