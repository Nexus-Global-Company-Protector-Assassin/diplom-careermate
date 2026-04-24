# CareerMate — Claude Memory File

> Этот файл читается Claude Code при каждом запуске.
> После каждой значимой сессии — обновляй соответствующие секции.

---

## 🏗️ Архитектура проекта

**Монорепо** со следующими модулями:
- `frontend/` — Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, NextAuth.js. Порт **:3000**
- `backend/` — NestJS + TypeScript, PostgreSQL + Prisma ORM, Redis + BullMQ, JWT + Passport. Порт **:3001**
- `agent/` — AI-агент (NestJS + LangChain + Pinecone). Порт **:3002** (`NEXT_PUBLIC_AGENT_URL`)
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

## 📦 Модули backend (NestJS)

- `auth/` — JWT + OAuth2
- `users/` — пользователи
- `profiles/` — профили и CV
- `resumes/` — хранение резюме, upload в MinIO/S3, cover letter generation (теперь через AI)
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
- DB: `DATABASE_URL`
- Redis: `REDIS_URL`
- AI: `LLM_API_KEY` (backend + agent), Pinecone credentials
- Auth: `JWT_SECRET`, OAuth credentials
- Storage: MinIO/S3 credentials (`STORAGE_ENDPOINT`, `STORAGE_BUCKET`, etc.)
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
- Standalone cover letter generator (backend :3001, теперь через AI)
- Анализ вакансий (Ghost Job Detection, 7 блоков A-G)
- Подготовка к интервью (STAR+R генерация)
- История резюме и откликов
- Парсинг вакансий hh.ru

### В процессе 🔄
- Промпты резюме по Stanford CAR-методу (внедрено 2026-04-24, нужно тестирование)

### Планируется 📌
- Исправить pre-existing TypeScript ошибки (fileKey, publishedAt в Prisma)

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

---

## 📝 Инструкции для Claude

1. **Перед началом работы** — перечитай этот файл полностью
2. **В процессе работы** — если принимается важное решение, сразу предложи добавить его в соответствующую секцию
3. **После завершения задачи** — обнови секции "Текущий статус", "Известные проблемы" и "Архитектурные решения" если есть что добавить
4. **Стек неизменен** — не предлагай замену NestJS/Next.js/Prisma без явной просьбы
5. **Язык** — комментарии в коде на английском, общение на русском
6. **Автообновление** — после каждой завершённой задачи автоматически обновляй соответствующие секции этого файла без дополнительного запроса. Фиксируй: что сделано, какие решения приняты, что сломалось и как починили.
7. **Pre-existing TS-ошибки** — не трогать fileKey/publishedAt/bcryptjs ошибки без явной задачи. Agent компилируется чисто.
8. **AI промпты** — все новые промпты для резюме должны следовать Stanford CAR-методу (см. секцию "Паттерны")

---

*Последнее обновление: 2026-04-24*
