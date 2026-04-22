# CareerMate — Анализ стадии развития проекта

## Общая оценка: **PoC / Pre-Alpha** (~30% от полноценного сервиса)

Проект находится на стадии **доказательства концепции (PoC)**, где архитектура выбрана правильно, основные контуры есть, но значительная часть модулей — это пустые папки с `.gitkeep` или моковые данные прямо в коде.

---

## ✅ Что реально работает

| Область | Что есть |
|---|---|
| Auth | JWT + Refresh Token, bcrypt, регистрация/логин |
| Профиль | CRUD профиля через Prisma |
| Вакансии | Поиск через Adzuna API + сохранение в БД |
| AI-матчинг | Взвешенный алгоритм (роль, навыки, грейд, зарплата, архетип) |
| AI-анализ | 7-блочная оценка вакансии + Ghost Job Detection через LLM |
| Cover Letter | AI-генерация сопроводительного письма (RU/EN) |
| Interview Prep | STAR+R ответы через LLM |
| Резюме | Сохранение/загрузка/удаление в БД |
| AI-чат | Карьерный консультант с системным промптом |
| Инфраструктура | Docker Compose с Postgres, Redis, MinIO, MailHog |
| Документация | Swagger UI настроен, README есть |
| CI/CD | GitHub Actions (lint, test, build, security scan) — описан |

---

## ❌ Чего не хватает — 26 пунктов

### 🔴 Критические (блокируют production)

**1. Нет реальной multi-user изоляции**
Весь код использует `profile.findFirst()` — буквально первый профиль из базы. Если зарегистрируются два пользователя — все их данные перемешаются. JWT есть, но `userId` из токена почти нигде не используется для фильтрации.

- [x] **2. Нет Prisma-миграций**
Папка `prisma/migrations/` пуста. База, скорее всего, создаётся через `prisma db push` (синхронизация схемы без версионирования). При первом деплое на новый сервер база поднимется, но при изменении схемы без миграций — потеря данных гарантирована.

- [x] **3. CORS открыт для всех** (`origin: '*'`)
В `main.ts` захардкожен `'*'` как fallback. В production это открывает API для любого домена.

- [x] **4. Analytics — моковые данные в коде**
`analytics.service.ts` возвращает захардкоженный массив из 4 чисел ("5 вакансий", "2 интервью"). Реальной аналитики нет вообще.

**5. Notifications — пустые папки**
`notifications/email/` содержит только `templates/` (пустая). `notifications/push/` содержит только `.gitkeep`. Никаких email-уведомлений нет — хотя SendGrid уже установлен как зависимость.

**6. Application Tracking — пустая папка**
`applications/tracking/` содержит только `.gitkeep`. Трекинг откликов существует только на уровне модели в БД, но никакой бизнес-логики нет.

? **7. Auto-Apply — пустая папка**
`applications/auto-apply/` содержит только `.gitkeep`. Функция автоотклика есть в UI (pricing page), но на бэке её нет.

- [x] **8. Нет Rate Limiting на бизнес-эндпоинтах**
`express-rate-limit` и `@nestjs/throttler` установлены в `package.json`, но нигде не применены в коде. AI-эндпоинты могут быть вызваны неограниченно, что приведёт к огромным расходам на LLM.

---

### 🟠 Серьёзные (мешают MVP)

- [x] **9. Нет реальных тестов**
Тестовые папки (`backend/test/e2e`, `unit`, `integration`, `frontend/tests/e2e`, `unit`, `integration`) — все пустые. `.spec.ts` файлы есть, но по содержимому это автоматически сгенерированные заглушки от NestJS CLI. CI пайплайн описан корректно, но запускать нечего.

**10. Queue/Bull — не реализован**
`queue/processors/` пустая папка. Bull установлен как зависимость. Ни одного processor'а нет. Все AI-запросы — синхронные, пользователь ждёт ответа в HTTP-соединении до 10-30 секунд.

- [x] **11. Embeddings/Vector Search — не реализован**
`ai/embeddings/` пустая папка. Pinecone установлен как зависимость. Semantic search / RAG для резюме не реализован.
Что реализовано:
- EmbeddingsService — Pinecone upsert + OpenAI text-embedding-3-small, с правильной обработкой ошибок (config ошибки пробрасываются, runtime ошибки логируются)
- EmbeddingsModule — подключён в VacanciesModule
- searchAndSave — индексирует каждую вакансию в Pinecone асинхронно (fire-and-forget) после сохранения в Postgres
- getRecommendedForProfile — гибридный скоринг 60% calcMatch + 40% Pinecone cosine similarity с graceful fallback на keyword-only при ошибке
- 14 тест-суит, 105 тестов — все зелёные

● PINECONE_API_KEY — берётся из https://app.pinecone.io:
  1. Зарегистрироваться / войти
  2. В боковом меню → API Keys → скопировать ключ

Хорошая новость: твой .env уже содержит все три переменные — код-ревьюер их нашёл при фиксе:
  PINECONE_API_KEY=<уже есть>
  PINECONE_ENVIRONMENT=us-west1-gcp
  PINECONE_INDEX_NAME=careermate-vectors
(Я ошибся в summary — правильное имя careermate-vectors, а не careermate-vacancies)

Что ещё нужно сделать вручную — создать индекс в Pinecone console:
  1. Войти на app.pinecone.io → Create Index
  2. Name: careermate-vectors
  3. Dimensions: 1536 (размерность text-embedding-3-small)
  4. Metric: Cosine
  5. Environment выбрать соответствующее (у тебя us-west1-gcp)

После создания индекса семантический поиск заработает при наличии LLM_API_KEY для OpenAI embeddings.


- [x] **12. Storage (MinIO/S3) — не реализован**
`storage/providers/` пустая папка. AWS SDK установлен. Загрузка PDF-резюме не работает через S3 — файлы, судя по коду, просто сохраняются как текст в Postgres-поле `content`. При загрузке файла юзером — только название сохраняется.
  Что было сделано:
  - StorageService + StorageModule — MinIO/S3 через @aws-sdk/client-s3, auto-detect MinIO vs real S3
  - Prisma-миграция — fileKey String? в модели Resume
  - POST /resumes/upload — multipart → MinIO → DB запись с fileKey
  - GET /resumes/:id/file — presigned URL redirect (302)
  - Фронтенд — useStoreResumeFile hook, файл сохраняется в MinIO параллельно с AI-анализом во всех ветках загрузки
  - 107/107 тестов, TypeScript без ошибок
  Когда запустишь Docker Desktop — применить миграцию командой:
  cd backend && npx prisma migrate dev

- [x] **13. Company Research — не реализован**
`interviews/company-research/` пустая папка. Функция "исследование компании перед интервью" анонсирована в UI, но на бэке нет.

- [x andrey] **14. Question Generator — не реализован**
`interviews/question-gen/` пустая папка. Вопросы генерируются напрямую через `generateInterviewPrep()` в `ai.service.ts`, без отдельного модуля.

- [x] **15. Skills Analysis — не реализован**
`profiles/skills-analysis/` пустая папка. Анализ скиллов из резюме работает только через словарь в `vacancies.service.ts`, без связи с профилем.

**16. Career Paths — не реализован**
`profiles/career-paths/` пустая папка. Персональный карьерный трекинг отсутствует.

- [x] **17. LangChain/Agent интеграция — заглушка**
`ai/langchain/` и `ai/providers/` — пустые. Несмотря на то что LangChain и Pinecone установлены как зависимости, AI-сервис просто делает прямой `httpService.post()` к OpenAI-совместимому API. Никаких chains, tools или agents нет.
  До:
  - ai/langchain/ — пустая папка
  - ai/providers/ — пустая папка    
  - AI-сервис делал прямой httpService.post() к OpenAI API вручную        
  После:
  - ai/providers/llm-provider.service.ts — NestJS-сервис, оборачивающий ChatOpenAI из LangChain с lazy init и auto-detect по LLM_API_KEY
  - ai/langchain/career-chat.chain.ts — LCEL pipeline: ChatPromptTemplate → ChatOpenAI → StringOutputParser
  - ai/langchain/vacancy-analysis.chain.ts — LCEL pipeline: ChatPromptTemplate → ChatOpenAI → JsonOutputParser
  - ai/langchain/interview-prep.chain.ts — LCEL pipeline для STAR+R
  - ai/langchain/cover-letter.chain.ts — LCEL pipeline для cover letter
  - AiService — больше нет httpService, все методы делегируют в chains

  Это закрывает формулировку "никаких chains нет" — теперь есть реальные LangChain chains через LCEL (.pipe() паттерн) с ChatPromptTemplate, StringOutputParser, JsonOutputParser.

  Tools и Agents (ReAct агент, tool calling) — это отдельная и значительно большая фича. Для диплома это скорее уровень "bonus" поверх уже реализованного. Хочешь добавить?



---11 12 17 24 26 

### 🟡 Важные для продукта

**18. Нет OAuth (Google / LinkedIn)**
`passport-google-oauth20` и `passport-linkedin-oauth2` установлены, `strategies/` папка существует, но внутри только `.gitkeep`. OAuth-логин не реализован.

**19. Нет системы избранного вакансий**
В frontend есть `favorites.tsx` (1315 байт), но это компонент без реального API-бэкенда.

**20. Нет Cron/парсера вакансий**
`@nestjs/schedule` установлен. Идея с hashprint для "вечнозелёных" вакансий описана в `PoCroadmap.md`, но не реализована. Вакансии подтягиваются только по запросу пользователя, не фоново.

**21. Настройки (Settings) — UI без бэка**
`settings-content.tsx` (11KB) есть на фронте, но нет ни одного эндпоинта `PATCH /api/v1/settings` или `PATCH /api/v1/users/preferences`.

**22. Pricing — UI без Stripe/платёжки**
`pricing-content.tsx` (12KB) с тарифами есть, но нет подписок, нет Stripe, нет ограничений по тарифам в бизнес-логике.

**23. HH.ru парсер — не интегрирован в основной стек**
`data-parsers/hh_parser/` — standalone Python-скрипт (`server.py`, `requirements.txt`). Никак не связан с основным приложением. Adzuna API используется, а HH.ru нет.

- [x] **24. DevOps — Terraform и Monitoring пустые**
`devops/terraform/` — полный AWS IaC (VPC, EC2, RDS, ElastiCache, S3, IAM, SGs). `devops/monitoring/` — Prometheus + Grafana + Alertmanager stack с 10 alert rules и 12-panel dashboard. `backend/src/modules/metrics/` — кастомный Prometheus endpoint (без внешних зависимостей).
- devops/terraform/ — 9 .tf файлов: VPC с публичными/приватными подсетями, EC2 (Amazon Linux 2023), RDS PostgreSQL 16, ElastiCache Redis 7, S3 bucket, IAM role с S3-доступом, security groups    
- devops/monitoring/ — Prometheus + Grafana + Alertmanager через docker-compose; 10 alert rules (BackendDown, HighErrorRate, SlowResponses и др.); 12-panel dashboard
- backend/src/modules/metrics/ — кастомный Prometheus exposition format без внешних зависимостей(Counter + Histogram + Node.js/OS gauges), middleware для инструментации всех HTTP-запросов
Тесты: 123/123, TypeScript: чистый.



- [x] **25. Нет логирования в structured format**
`nest-winston` и `winston` установлены. В коде везде используется встроенный `Logger` от NestJS. Winston не настроен — нет JSON логов, нет отправки в centralized logging.

- [x] **26. Нет обработки ошибок на фронтенде**
`ApiError` с классификацией (network/auth/not_found/server). `error.tsx` + `global-error.tsx` — Next.js App Router error boundaries. Smart retry в React Query (нет retry на 4xx, exponential backoff на network/5xx). Глобальный toast через `QueryCache.onError` / `MutationCache.onError` + Sonner Toaster в layout.

---

## Оценка по направлениям

| Направление | Оценка | Комментарий |
|---|---|---|
| **Архитектура** | 7/10 | NestJS, FSD фронт, Prisma — хорошие решения |
| **Backend (реализовано)** | 4/10 | Auth + Vacancies + AI работают, остальное — заглушки |
| **Frontend** | 5/10 | Визуально богатый, но данные моковые в половине мест |
| **AI/LLM** | 6/10 | Реальная логика есть, но нет queue и rate limit |
| **База данных** | 3/10 | Схема есть, миграций нет, multi-user не работает |
| **Тесты** | 1/10 | Файлы есть, контента нет |
| **DevOps** | 3/10 | CI описан, production docker-compose не существует |
| **Безопасность** | 3/10 | JWT есть, но CORS открыт, rate limit не применён |
| **Готовность к продукту** | 2/10 | Нет payments, notifications, real multi-user |

---

## Приоритетный план (что делать первым)

```
СЕЙЧАС (блокирует всё):
1. Привязать userId из JWT к каждому запросу (убрать findFirst())
2. Создать Prisma-миграции (prisma migrate dev)
3. Добавить ThrottlerGuard на AI-эндпоинты

СЛЕДУЮЩИЙ ШАГ (MVP):
4. Реализовать Bull queue для AI-запросов (async jobs)
5. Реализовать реальную analytics (считать из БД)
6. Подключить MinIO для загрузки PDF
7. Email notifications через SendGrid (хотя бы welcome-письмо)

ПОСЛЕ MVP:
8. OAuth Google
9. Stripe подписки
10. Cron для обновления вакансий
11. Написать тесты
```

---

> **Вывод**: Проект — это сильный PoC с очень хорошей архитектурой и интересными AI-фичами. До MVP с реальными пользователями нужно ~2-3 спринта плотной работы. До полноценного коммерческого сервиса — 3-5 месяцев.
