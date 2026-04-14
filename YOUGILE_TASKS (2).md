# CareerMate - Задачи для Yougile (Первые 2 спринта)

## Общая информация
- **Цель MVP:** Запуск за 5-6 месяцев
- **Длительность спринта:** 2 недели
- **Команда:** Frontend, Backend, ML, DevOps, PM/Системный аналитик

---

## 🎨 FRONTEND (Next.js 14 + React)

### СПРИНТ 1 (Недели 1-2): Базовая инфраструктура и авторизация

#### Задача 1.1: Настройка проекта Next.js
**Приоритет:** Критический
**Оценка:** 8 часов
**Описание:**
- Инициализация Next.js 14 проекта с App Router
- Настройка TypeScript конфигурации
- Установка и настройка Tailwind CSS
- Интеграция shadcn/ui компонентов
- Настройка ESLint и Prettier
- Создание базовой структуры папок (components, lib, hooks, services)

**Критерии приемки:**
- [ ] Проект успешно запускается на `localhost:3000`
- [ ] TypeScript корректно работает без ошибок
- [ ] Tailwind CSS применяется корректно
- [ ] shadcn/ui компоненты установлены и готовы к использованию

---

#### Задача 1.2: Настройка NextAuth.js
**Приоритет:** Критический
**Оценка:** 6 часов
**Описание:**
- Установка и настройка NextAuth.js
- Создание API route `/api/auth/[...nextauth]`
- Настройка JWT стратегии
- Интеграция с backend API для авторизации
- Создание middleware для защищенных маршрутов

**Критерии приемки:**
- [ ] NextAuth.js корректно настроен
- [ ] Сессия сохраняется в cookies
- [ ] Protected routes работают корректно

---

#### Задача 1.3: Страницы авторизации (Login/Register)
**Приоритет:** Критический
**Оценка:** 12 часов
**Описание:**
- Создать страницу `/login`
- Создать страницу `/register`
- Создать форму логина с валидацией (React Hook Form + Zod)
- Создать форму регистрации с валидацией
- Реализовать обработку ошибок
- Добавить loading состояния
- Добавить редирект после успешной авторизации

**Критерии приемки:**
- [ ] Формы валидируют данные корректно
- [ ] Отображаются понятные сообщения об ошибках
- [ ] После успешного логина редирект на `/dashboard`
- [ ] Дизайн соответствует макетам

---

#### Задача 1.4: Layout компоненты
**Приоритет:** Высокий
**Оценка:** 8 часов
**Описание:**
- Создать Root Layout (`app/layout.tsx`)
- Создать Auth Layout (`app/(auth)/layout.tsx`)
- Создать Dashboard Layout с Header и Sidebar
- Создать компонент Header (с навигацией и user menu)
- Создать компонент Sidebar (навигация по разделам)
- Сделать адаптивный дизайн (mobile, tablet, desktop)

**Критерии приемки:**
- [ ] Layouts корректно применяются к страницам
- [ ] Header показывает информацию о пользователе
- [ ] Sidebar навигация работает
- [ ] Мобильная версия с burger menu

---

#### Задача 1.5: API Client и сервисы
**Приоритет:** Высокий
**Оценка:** 6 часов
**Описание:**
- Создать базовый API client (axios)
- Настроить interceptors (для токенов, обработки ошибок)
- Создать auth.service.ts (login, register, logout, refresh)
- Настроить React Query для кэширования
- Добавить типизацию для API запросов/ответов

**Критерии приемки:**
- [ ] API client работает с backend
- [ ] Токены автоматически добавляются к запросам
- [ ] Ошибки обрабатываются централизованно
- [ ] React Query корректно кэширует данные

---

### СПРИНТ 2 (Недели 3-4): Профиль пользователя и Dashboard

#### Задача 2.1: Страница Dashboard
**Приоритет:** Критический
**Оценка:** 10 часов
**Описание:**
- Создать страницу `/dashboard`
- Создать компонент DashboardStats (карточки со статистикой)
- Создать компонент RecentApplications (список последних откликов)
- Создать компонент JobRecommendations (рекомендованные вакансии)
- Подключить к API для получения данных
- Добавить skeleton loaders

**Критерии приемки:**
- [ ] Dashboard отображает статистику пользователя
- [ ] Данные загружаются с backend
- [ ] Показываются loading состояния
- [ ] Адаптивный дизайн

---

#### Задача 2.2: Страница просмотра профиля
**Приоритет:** Критический
**Оценка:** 8 часов
**Описание:**
- Создать страницу `/profile`
- Отобразить информацию профиля (имя, контакты, опыт, навыки)
- Создать компонент для отображения опыта работы
- Создать компонент для отображения образования
- Создать компонент для отображения навыков (tags)
- Добавить кнопку "Редактировать профиль"

**Критерии приемки:**
- [ ] Профиль корректно отображается
- [ ] Данные загружаются с backend
- [ ] Кнопка редактирования ведет на `/profile/edit`

---

#### Задача 2.3: Форма редактирования профиля
**Приоритет:** Критический
**Оценка:** 16 часов
**Описание:**
- Создать страницу `/profile/edit`
- Создать форму с полями:
  - Личная информация (имя, телефон, локация)
  - Желаемая позиция и зарплата
  - О себе (textarea)
  - Опыт работы (динамический список)
  - Образование (динамический список)
  - Навыки (input с тегами)
  - Ссылки (LinkedIn, GitHub, Portfolio)
- Реализовать валидацию всех полей
- Добавить автосохранение (draft)
- Реализовать отправку данных на backend

**Критерии приемки:**
- [ ] Все поля корректно работают и валидируются
- [ ] Можно добавлять/удалять опыт работы и образование
- [ ] Данные сохраняются на backend
- [ ] Автосохранение работает (каждые 30 сек)
- [ ] Показываются понятные сообщения об ошибках

---

#### Задача 2.4: UI компоненты (shadcn/ui)
**Приоритет:** Высокий
**Оценка:** 8 часов
**Описание:**
- Установить и настроить необходимые shadcn/ui компоненты:
  - Button
  - Input
  - Card
  - Dialog
  - Form
  - Select
  - Toast
  - Badge
  - Avatar
- Кастомизировать стили под дизайн проекта
- Создать reusable UI компоненты

**Критерии приемки:**
- [ ] Все компоненты установлены и работают
- [ ] Стили соответствуют дизайн-системе
- [ ] Компоненты переиспользуются в разных местах

---

#### Задача 2.5: Hooks и утилиты
**Приоритет:** Средний
**Оценка:** 6 часов
**Описание:**
- Создать `useAuth` hook (текущий пользователь, logout)
- Создать `useProfile` hook (получение и обновление профиля)
- Создать `useToast` hook (notifications)
- Создать utils функции (форматирование дат, валидация и т.д.)
- Создать constants файл

**Критерии приемки:**
- [ ] Hooks работают корректно
- [ ] TypeScript типизация присутствует
- [ ] Utils функции покрыты тестами (опционально для MVP)

---

## ⚙️ BACKEND (NestJS + PostgreSQL)

### СПРИНТ 1 (Недели 1-2): Базовая инфраструктура и авторизация

#### Задача 1.1: Настройка проекта NestJS
**Приоритет:** Критический
**Оценка:** 8 часов
**Описание:**
- Инициализация NestJS проекта
- Настройка TypeScript конфигурации
- Установка необходимых зависимостей (@nestjs/config, @nestjs/jwt, etc.)
- Создание модульной структуры (auth, users, profiles, resumes, etc.)
- Настройка environment variables (.env)
- Настройка ESLint и Prettier

**Критерии приемки:**
- [ ] Проект успешно запускается на `localhost:3001`
- [ ] Environment variables загружаются корректно
- [ ] Модульная структура создана

---

#### Задача 1.2: Настройка PostgreSQL + Prisma
**Приоритет:** Критический
**Оценка:** 10 часов
**Описание:**
- Установка и настройка Prisma ORM
- Создание базовой схемы БД (users, profiles)
- Настройка connection string
- Создание первой миграции
- Генерация Prisma Client
- Создание DatabaseModule

**Схема:**
```prisma
model User {
  id                    String    @id @default(uuid())
  email                 String    @unique
  passwordHash          String?
  oauthProvider         String?
  oauthId               String?
  subscriptionTier      String    @default("free")
  subscriptionExpiresAt DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  lastLoginAt           DateTime?

  profile               Profile?
}

model Profile {
  id                  String   @id @default(uuid())
  userId              String   @unique
  fullName            String?
  phone               String?
  location            String?
  desiredPosition     String?
  desiredSalaryMin    Int?
  desiredSalaryMax    Int?
  experienceYears     Int?
  education           Json?
  workExperience      Json?
  skills              Json?
  languages           Json?
  aboutMe             String?
  careerGoals         String?
  linkedinUrl         String?
  githubUrl           String?
  portfolioUrl        String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Критерии приемки:**
- [x] Prisma успешно подключен к PostgreSQL
- [x] Миграции применяются без ошибок
- [x] Prisma Studio открывается и показывает таблицы

---

#### Задача 1.3: Auth Module (JWT + Passport)
**Приоритет:** Критический
**Оценка:** 14 часов
**Описание:**
- Создать AuthModule
- Реализовать JWT Strategy (access + refresh tokens)
- Создать AuthController с эндпоинтами:
  - POST `/auth/register`
  - POST `/auth/login`
  - POST `/auth/refresh`
  - POST `/auth/logout`
- Создать AuthService с логикой:
  - Регистрация (hash пароля с bcrypt)
  - Логин (проверка пароля, генерация токенов)

#### Задача 1.4: Users Module
**Приоритет:** Высокий
**Оценка:** 6 часов
**Описание:**
- Создать UsersModule
- Создать UsersService с методами:
  - `findById(id)`
  - `findByEmail(email)`
  - `create(data)`
  - `update(id, data)`
- Создать UsersController с эндпоинтами:
  - GET `/users/me` (текущий пользователь)
  - PUT `/users/me` (обновление данных)
- Добавить валидацию DTO (class-validator)

**Критерии приемки:**
- [ ] Эндпоинты защищены JwtAuthGuard
- [ ] Можно получить данные текущего пользователя
- [ ] Можно обновить email (с проверкой уникальности)

---

#### Задача 1.5: Настройка Redis + кэширование
**Приоритет:** Высокий
**Оценка:** 6 hours
**Описание:**
- Установка ioredis
- Создание RedisModule
- Настройка подключения к Redis
- Реализовать кэширование для:
  - User sessions
  - Rate limiting counters
- Создать CacheService wrapper

**Критерии приемки:**
- [x] Redis успешно подключен
- [x] Можно сохранять и получать данные из кэша
- [x] TTL корректно работает

---

### СПРИНТ 2 (Недели 3-4): Profiles Module

#### Задача 2.1: Profiles Module (CRUD)
**Приоритет:** Критический
**Оценка:** 12 часов
**Описание:**
- Создать ProfilesModule
- Создать ProfilesService с методами:
  - `getProfile(userId)`
  - `createProfile(userId, data)`
  - `updateProfile(userId, data)`
  - `deleteProfile(userId)`
- Создать ProfilesController с эндпоинтами:
  - GET `/profiles/me`
  - POST `/profiles/me`
  - PUT `/profiles/me`
  - DELETE `/profiles/me`
- Создать DTO для создания/обновления профиля
- Добавить валидацию всех полей

**Критерии приемки:**
- [ ] CRUD операции работают корректно
- [ ] Валидация предотвращает некорректные данные
- [ ] JSON поля (education, workExperience) корректно сохраняются
- [ ] Ошибки обрабатываются и возвращают понятные сообщения

---

#### Задача 2.2: Валидация и DTO
**Приоритет:** Высокий
**Оценка:** 8 часов
**Описание:**
- Создать DTO классы:
  - `CreateProfileDto`
  - `UpdateProfileDto`
  - `WorkExperienceDto`
  - `EducationDto`
  - `SkillDto`
- Добавить валидацию для всех полей (class-validator):
  - Email format
  - Phone format
  - URL format (LinkedIn, GitHub)
  - Min/Max salary values
  - Experience years range (0-50)
  - Required fields validation
- Создать custom validators если нужно

**Критерии приемки:**
- [ ] Все DTO корректно валидируют данные
- [ ] Ошибки валидации возвращают понятные сообщения
- [ ] TypeScript типы генерируются корректно

---

#### Задача 2.3: Global Exception Filter
**Приоритет:** Средний
**Оценка:** 4 часа
**Описание:**
- Создать HttpExceptionFilter
- Создать PrismaExceptionFilter (для ошибок БД)
- Стандартизировать формат ошибок API:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "timestamp": "2025-01-26T10:00:00Z",
  "path": "/api/profiles/me"
}
```
- Добавить логирование ошибок

**Критерии приемки:**
- [ ] Все ошибки обрабатываются централизованно
- [ ] Формат ошибок единообразный
- [ ] Ошибки логируются

---

#### Задача 2.4: Swagger/OpenAPI документация
**Приоритет:** Средний
**Оценка:** 6 часов
**Описание:**
- Установка @nestjs/swagger
- Настройка Swagger в main.ts
- Добавить декораторы к контроллерам:
  - @ApiTags
  - @ApiOperation
  - @ApiResponse
  - @ApiBearerAuth
- Документировать все DTO
- Добавить примеры запросов/ответов

**Критерии приемки:**
- [ ] Swagger UI доступен на `/api/docs`
- [ ] Все эндпоинты документированы
- [ ] Можно тестировать API через Swagger UI

---

#### Задача 2.5: Rate Limiting и Security
**Приоритет:** Высокий
**Оценка:** 6 часов
**Описание:**
- Установка @nestjs/throttler
- Настроить rate limiting:
  - 100 req/min для авторизованных
  - 10 req/min для анонимных
- Добавить CORS настройку
- Добавить helmet для security headers
- Настроить compression (gzip)

**Критерии приемки:**
- [ ] Rate limiting работает корректно
- [ ] CORS разрешает запросы только с frontend домена
- [ ] Security headers установлены
- [ ] Compression включен

---

## 🤖 ML/AI (MCP + Tools + Retrieval, без fine-tune)
СПРИНТ 1 (Недели 1–2): Базовая MCP-интеграция + первый Tool
Задача 1.1: Настройка окружения для MCP/Agent слоя

Приоритет: Критический
Оценка: 6 часов


Описание:
Создать отдельную папку для agent/MCP слоя, например:
backend/src/agent (или backend/src/ai, но внутри явно разделить: llm, tools, orchestrator)
Установить зависимости (конкретные библиотеки можно выбрать под ваш стек, главное — смысл):
MCP SDK / библиотека для MCP-совместимых tools (TS)
валидатор схем (JSON Schema / Zod)
axios (или fetch) для запросов к LLM
(опционально) клиент VectorDB/pgvector, если retrieval уже на старте
Настроить env variables:
LLM_API_BASE_URL
LLM_API_KEY
LLM_MODEL_NAME
EMBEDDINGS_MODEL_NAME (если embeddings через API)
VECTOR_STORE_* (Pinecone/Qdrant/pgvector — что выберете)
AI_TIMEOUT_MS, AI_MAX_RETRIES
Создать AgentModule (NestJS) и подключить в AppModule.
Критерии приемки:
 Структура папок создана (tools/, orchestrator/, llm/, schemas/)
 Все env-переменные заведены (и есть .env.example)
 AgentModule создан и импортирован в AppModule
 Локальный запуск поднимает backend без ошибок

Задача 1.2: LLM Gateway (не “Custom LLM”, а единый шлюз)
Приоритет: Критический
Оценка: 10 часов

Описание:
Создать LLMGateway (или LLMClient) — единое место для вызовов модели:
generateText(prompt, options)
generateJson(prompt, jsonSchema, options) (важно для MCP: структурированные ответы)
embed(text) (если embeddings нужны)
Реализовать:
retry логика (3 попытки + exponential backoff)
timeout (например, 30 секунд)
нормальная обработка ошибок + нормальные сообщения для логов
логирование:
время запроса
размер prompt/контекста
token usage (если провайдер отдаёт)
Важно: никаких “умных решений” тут — это просто надёжный клиент.
Критерии приемки:
 Успешные запросы возвращают корректный результат
 generateJson возвращает JSON, который проходит schema validation
 Retry/timeout работают
 Логи фиксируют latency + (по возможности) токены/стоимость

Задача 1.3: MCP Tool — analyze_profile (вместо “Chain”)
Приоритет: Высокий
Оценка: 12 часов

Описание:
Создать MCP-инструмент (tool) analyze_profile:
input: profileId или структурированный profileData
output: строго по JSON Schema (не “как получится”)
Реализовать анализ профиля:
извлечение ключевых навыков
определение уровня (Junior/Middle/Senior)
skill gaps
score 0–100
Сделать строгую схему ответа (JSON Schema / Zod) и:
валидировать ответ
если не прошёл — сделать 1–2 “repair” попытки (переуточнить промпт: “верни строго по схеме”)
Добавить кэширование результата (Redis, TTL: 24h)
Пример (суть промпта сохраняется, но важен формат):
“Верни JSON, строго по схеме, без лишних полей/текста”
Желательно temperature ниже (0.2–0.4), чтобы меньше рандома.
Критерии приемки:
 Tool возвращает JSON строго по схеме
 Валидатор ловит ошибки формата
 Есть repair-поведение (перегенерация при невалидном JSON)
 Кэширование работает (повтор быстрее)
 Ошибки логируются и понятны (не “что-то пошло не так”)

Задача 1.4: Orchestrator / Agent Runner (MCP-оркестрация в коде)
Приоритет: Высокий
Оценка: 8 часов

Описание:

Создать AgentRunnerService (оркестратор):

собирает контекст (профиль из БД)

вызывает нужный tool (analyze_profile)

сохраняет результат (опционально) в БД

возвращает результат наружу

Создать AgentController или AiController:

POST /ai/analyze-profile (или /agent/run/analyze-profile)

Добавить rate limiting (например 5 запросов/день на free tier)

Добавить лог “agent run trace”:

runId

входные данные (в виде хэша)

какие tools вызывались

время и статус каждого шага

Критерии приемки:

 Эндпоинт защищен авторизацией

 End-to-end: profileId → analysis JSON

 Rate limiting работает

 Логи run trace помогают понять “что делал агент”

Задача 1.5: Кэширование MCP-tool результатов + инвалидация

Приоритет: Средний
Оценка: 6 часов

Описание:

Реализовать CacheService (для agent/tools):

cache key: ai:profile-analysis:{userId}:{hash(profileData)}

TTL: 24 часа

Инвалидация при обновлении профиля пользователя

Логи/метрики:

cache hit/miss

среднее время ответа с кэшем и без

Критерии приемки:

 Повторные запросы идут из кэша

 При изменении профиля кэш сбрасывается

 hit/miss логируются

СПРИНТ 2 (Недели 3–4): Career Paths как MCP Tool + модуль CRUD
Задача 2.1: Career Path Database Schema

Приоритет: Высокий
Оценка: 4 часа

Описание:

Prisma модель CareerPath — можно оставить как у вас, она норм:

Миграция и применение

Критерии приемки:

 Таблица создана

 Миграция применяется без ошибок

Задача 2.2: MCP Tool — generate_career_paths (вместо “Chain”)

Приоритет: Критический
Оценка: 14 часов

Описание:

Создать tool generate_career_paths

На вход:

userId/profileId (и опционально “цель/рынок/валюта”)

На выход:

JSON массив 3–5 карьерных путей строго по схеме

Обязательное:

schema validation

repair на невалидный JSON

(Опционально, но сильно улучшает качество) добавить retrieval:

подтянуть из вашей базы “список ролей/skills” или “частые требования” (даже маленький справочник)

чтобы ответы были менее “общими”

Критерии приемки:

 Возвращается 3–5 путей

 Формат валиден по схеме

 Результаты выглядят релевантно профилю (ручная проверка на 10 профилях)

 Ошибки/фейлы не ломают весь запрос (понятный fallback)

Задача 2.3: Career Paths Module (Backend)

Приоритет: Критический
Оценка: 10 часов

Описание:

CareerPathsService:

generateCareerPaths(userId) → вызывает MCP tool generate_career_paths, сохраняет в БД

getCareerPaths(userId)

selectCareerPath(userId, pathId)

deleteCareerPath(userId, pathId)

CareerPathsController:

POST /career-paths/generate

GET /career-paths

PUT /career-paths/:id/select

DELETE /career-paths/:id

Авторизация + проверки userId

Критерии приемки:

 Все эндпоинты работают

 Данные сохраняются и читаются

 Выбор одного пути (isSelected) работает корректно

 Защита авторизацией

Задача 2.4: Frontend — Career Path UI

Приоритет: Высокий
Оценка: 12 часов

Описание: (почти без изменений)

/career-paths

CareerPathCard:

title, description

requiredSkills tags

timeline

salary range

кнопка “выбрать”

Подключение к API

Loading/empty/error состояния

Критерии приемки:

 Генерация работает

 Карточки отображаются корректно

 Выбор пути работает

 Есть loading состояния

 Адаптивность

Задача 2.5: Quality / Prompt Engineering → “Tool Quality + Eval + Cost”

Приоритет: Средний
Оценка: 8 часов

Описание:

Вместо “A/B тестирования промптов ради промптов” делаем практичную систему качества MCP-tools:

библиотека prompt templates (версии)

параметры LLM (temperature, max tokens)

мини-eval на фиксированных профилях:

валидность JSON

доля “воды”

доля противоречий (галлюцинаций относительно профиля)

оптимизация стоимости:

сокращение контекста

кэширование

reuse retrieval результатов

Документация “как писать tool prompts”, чтобы команда могла повторять.

Критерии приемки:

 Есть версияция промптов (v1/v2)

 Есть набор тест-кейсов (10–20 профилей) и прогон

 Доля невалидного JSON → стремится к нулю (или хотя бы <5%)

 Параметры зафиксированы и документированы

Важное резюме: что поменялось концептуально

“Chain” → Tool (MCP)

“Custom LLM” → LLM Gateway (просто клиент)

“магия в LangChain” → контроль в коде (валидация, ретраи, кеш, трассировка)

“качество через дообучение” → качество через схемы + grounded контекст + eval
---

## 🐳 DEVOPS (Docker + CI/CD)

### СПРИНТ 1 (Недели 1-2): Docker и локальная разработка

#### Задача 1.1: Docker Compose для локальной разработки
**Приоритет:** Критический
**Оценка:** 8 часов
**Описание:**
- Создать `docker-compose.yml` для dev окружения
- Добавить сервисы:
  - PostgreSQL (порт 5432)
  - Redis (порт 6379)
  - PgAdmin (порт 5050)
  - Redis Commander (порт 8081)
  - MinIO (опционально, для S3-совместимого хранилища)
  - MailHog (для тестирования email)
- Настроить volumes для персистентности данных
- Создать healthchecks для всех сервисов
- Добавить .env файлы для конфигурации

**Критерии приемки:**
- [x] `docker-compose up -d` запускает все сервисы
- [ ] PostgreSQL доступен и работает
- [ ] Redis доступен и работает
- [ ] Web UI (PgAdmin, Redis Commander) доступны
- [ ] Данные сохраняются между перезапусками

---

#### Задача 1.2: Dockerfile для Backend
**Приоритет:** Высокий
**Оценка:** 6 часов
**Описание:**
- Создать `backend/Dockerfile` для production
- Использовать multi-stage build:
  - Stage 1: Build (node:20-alpine)
  - Stage 2: Production (node:20-alpine)
- Оптимизировать размер образа:
  - Использовать .dockerignore
  - Минимизировать слои
  - Использовать alpine образы
- Добавить healthcheck
- Настроить non-root user

**Критерии приемки:**
- [ ] Docker образ успешно собирается
- [ ] Размер образа оптимизирован (<200MB)
- [ ] Приложение запускается в контейнере
- [ ] Healthcheck работает

---

#### Задача 1.3: Dockerfile для Frontend
**Приоритет:** Высокий
**Оценка:** 6 часов
**Описание:**
- Создать `frontend/Dockerfile` для production
- Multi-stage build:
  - Stage 1: Dependencies
  - Stage 2: Build
  - Stage 3: Production (nginx или standalone)
- Настроить Next.js standalone output
- Оптимизировать размер образа

**Критерии приемки:**
- [ ] Docker образ успешно собирается
- [ ] Next.js приложение работает в production mode
- [ ] Static assets отдаются корректно

---

#### Задача 1.4: Setup скрипты
**Приоритет:** Средний
**Оценка:** 6 часов
**Описание:**
- Создать `scripts/setup.sh` (для macOS/Linux)
- Создать `scripts/setup.ps1` (для Windows)
- Создать `scripts/setup.js` (кроссплатформенный Node.js скрипт)
- Скрипт должен:
  - Проверять наличие Node.js, npm, Docker
  - Копировать .env.example в .env
  - Устанавливать зависимости (npm install)
  - Запускать docker-compose
  - Применять миграции БД
  - Выводить итоговую информацию (URLs, credentials)

**Критерии приемки:**
- [ ] Скрипт работает на разных ОС
- [ ] Проверки зависимостей работают
- [ ] Проект полностью настраивается одной командой
- [ ] Инструкции выводятся в конце

---

#### Задача 1.5: Документация разработчика
**Приоритет:** Средний
**Оценка:** 4 часа
**Описание:**
- Обновить README.md с инструкциями:
  - Требования к системе
  - Установка (шаг за шагом)
  - Запуск приложения
  - Доступные команды
  - Troubleshooting
- Создать CONTRIBUTING.md
- Создать docs/guides/quick-start.md
- Добавить badges (build status, license, etc.)

**Критерии приемки:**
- [ ] Новый разработчик может поднять проект по README
- [ ] Все команды задокументированы
- [ ] Troubleshooting покрывает частые проблемы

---

### СПРИНТ 2 (Недели 3-4): CI/CD и Deploy

#### Задача 2.1: GitHub Actions - CI Pipeline
**Приоритет:** Критический
**Оценка:** 10 часов
**Описание:**
- Создать `.github/workflows/ci.yml`
- Настроить CI пайплайн:
  - Checkout code
  - Setup Node.js
  - Install dependencies
  - Lint (frontend + backend)
  - Type check (TypeScript)
  - Run unit tests
  - Build проектов
- Настроить кэширование node_modules
- Добавить parallel jobs для frontend и backend

**Пример workflow:**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

**Критерии приемки:**
- [ ] CI запускается на каждый push и PR
- [ ] Все проверки проходят успешно
- [ ] Время выполнения оптимизировано (<5 минут)
- [ ] Кэширование работает

---

#### Задача 2.2: GitHub Actions - CD Pipeline (Staging)
**Приоритет:** Высокий
**Оценка:** 12 часов
**Описание:**
- Создать `.github/workflows/deploy-staging.yml`
- Настроить автоматический деплой на staging:
  - Триггер: push в ветку `develop`
  - Сборка Docker образов
  - Push образов в registry (GitHub Container Registry)
  - Деплой на staging сервер
- Настроить secrets в GitHub:
  - DATABASE_URL
  - REDIS_URL
  - AI_API_KEY
  - Другие sensitive данные
- Добавить Slack/Discord уведомления о деплоях

**Критерии приемки:**
- [ ] Автоматический деплой работает на push в develop
- [ ] Docker образы публикуются в registry
- [ ] Staging окружение обновляется
- [ ] Уведомления приходят

---

#### Задача 2.3: Production Deployment (Railway/Render)
**Приоритет:** Высокий
**Оценка:** 10 часов
**Описание:**
- Настроить деплой backend на Railway/Render
- Настроить деплой frontend на Vercel
- Создать production базу данных (Railway PostgreSQL / Neon)
- Настроить production Redis (Upstash / Redis Cloud)
- Настроить environment variables
- Настроить custom domain (опционально)
- Создать production .env файл

**Критерии приемки:**
- [ ] Backend доступен по URL (https://api.careermate.com)
- [ ] Frontend доступен по URL (https://careermate.com)
- [ ] База данных работает стабильно
- [ ] Redis работает
- [ ] HTTPS настроен

---

#### Задача 2.4: Database Migrations Strategy
**Приоритет:** Средний
**Оценка:** 6 часов
**Описание:**
- Создать стратегию для миграций:
  - Автоматические миграции на staging
  - Ручные миграции на production (с подтверждением)
- Создать `scripts/migrate.sh` скрипт
- Настроить rollback стратегию
- Добавить резервное копирование БД перед миграцией
- Документировать процесс миграций

**Критерии приемки:**
- [ ] Миграции применяются автоматически на staging
- [ ] На production требуется ручное подтверждение
- [ ] Rollback работает
- [ ] Backup создается перед миграцией

---

#### Задача 2.5: Monitoring и Logging Setup
**Приоритет:** Средний
**Оценка:** 8 часов
**Описание:**
- Настроить Sentry для error tracking:
  - Интеграция в frontend (Next.js)
  - Интеграция в backend (NestJS)
  - Настроить source maps
- Настроить базовое логирование:
  - Winston logger в backend
  - Structured logs (JSON format)
  - Log levels (error, warn, info, debug)
- Настроить healthcheck эндпоинты:
  - `/health` - basic health
  - `/health/ready` - readiness probe
  - `/health/live` - liveness probe

**Критерии приемки:**
- [ ] Ошибки отправляются в Sentry
- [ ] Логи структурированы и читаемы
- [ ] Healthcheck эндпоинты работают
- [ ] Source maps загружаются в Sentry

---

## 📊 МЕНЕДЖЕР / СИСТЕМНЫЙ АНАЛИТИК

### СПРИНТ 1 (Недели 1-2): Планирование и документация

#### Задача 1.1: Детализация требований MVP
**Приоритет:** Критический
**Оценка:** 12 часов
**Описание:**
- Создать детальные user stories для MVP:
  - Регистрация и авторизация
  - Создание/редактирование профиля
  - AI анализ профиля
  - Генерация карьерных путей
  - Просмотр дашборда
- Для каждой user story определить:
  - Acceptance criteria
  - Приоритет (Must have / Should have / Nice to have)
  - Зависимости
  - Риски
- Создать product backlog в Yougile
- Приоритизировать задачи

**Критерии приемки:**
- [ ] User stories созданы и описаны
- [ ] Acceptance criteria четко определены
- [ ] Backlog приоритизирован
- [ ] Команда понимает требования

---

#### Задача 1.2: Создание Product Roadmap
**Приоритет:** Высокий
**Оценка:** 8 часов
**Описание:**
- Создать roadmap на 6 месяцев до MVP
- Разбить на фазы:
  - Phase 1 (Месяцы 1-2): Auth + Profile
  - Phase 2 (Месяцы 3-4): AI + Career Paths + Resume Gen
  - Phase 3 (Месяцы 5-6): Jobs + Applications + Polish
- Определить ключевые milestones
- Создать Gantt chart (опционально)
- Согласовать с командой

**Критерии приемки:**
- [ ] Roadmap создан и согласован
- [ ] Milestones определены
- [ ] Риски идентифицированы
- [ ] Timeline реалистичен

---

#### Задача 1.3: Дизайн пользовательских flow
**Приоритет:** Высокий
**Оценка:** 10 часов
**Описание:**
- Создать user flow диаграммы:
  - Registration flow
  - Profile creation flow
  - Career path generation flow
  - Resume generation flow (для будущего)
- Определить все сценарии (happy path + edge cases)
- Создать wireframes для ключевых экранов (Figma)
- Провести review с командой

**Критерии приемки:**
- [ ] User flows документированы
- [ ] Edge cases учтены
- [ ] Wireframes созданы
- [ ] Команда понимает flows

---

#### Задача 1.4: Определение метрик успеха
**Приоритет:** Средний
**Оценка:** 6 часов
**Описание:**
- Определить ключевые метрики для MVP:
  - **User Activation:** % пользователей, заполнивших профиль
  - **AI Usage:** % пользователей, использовавших AI анализ
  - **Retention:** % пользователей, вернувшихся через неделю
  - **Time to Value:** среднее время до первого AI анализа
- Определить целевые значения метрик
- Настроить отслеживание метрик (PostHog / Mixpanel)
- Создать dashboard для метрик

**Критерии приемки:**
- [ ] Метрики определены и задокументированы
- [ ] Целевые значения установлены
- [ ] Tracking настроен
- [ ] Dashboard создан

---

#### Задача 1.5: Risk Management Plan
**Приоритет:** Средний
**Оценка:** 6 часов
**Описание:**
- Идентифицировать риски проекта:
  - Технические риски (AI API недоступность, производительность)
  - Ресурсные риски (нехватка времени, budget)
  - Бизнес риски (низкий интерес пользователей)
- Для каждого риска:
  - Вероятность (Low/Medium/High)
  - Влияние (Low/Medium/High)
  - План митигации
  - Contingency план
- Создать risk register
- Регулярно обновлять (еженедельно)

**Критерии приемки:**
- [ ] Риски идентифицированы и приоритизированы
- [ ] Планы митигации созданы
- [ ] Risk register поддерживается
- [ ] Команда осведомлена о рисках

---

### СПРИНТ 2 (Недели 3-4): Управление и координация

#### Задача 2.1: Sprint Planning и Daily Standups
**Приоритет:** Критический
**Оценка:** Ongoing (2 часа/неделю)
**Описание:**
- Провести Sprint Planning в начале спринта:
  - Review backlog
  - Оценка задач (story points / часы)
  - Commitment на спринт
  - Установка sprint goal
- Организовать Daily Standups (15 минут/день):
  - Что сделано вчера
  - Что планируется сегодня
  - Есть ли блокеры
- Вести sprint board в Yougile
- Обновлять burndown chart

**Критерии приемки:**
- [ ] Sprint Planning проведен
- [ ] Daily Standups проходят регулярно
- [ ] Sprint board актуален
- [ ] Команда синхронизирована

---

#### Задача 2.2: Координация между командами
**Приоритет:** Высокий
**Оценка:** Ongoing (4 часа/неделю)
**Описание:**
- Координировать работу между Frontend, Backend, ML, DevOps:
  - Синхронизация API контрактов
  - Решение блокеров и зависимостей
  - Приоритизация задач
- Проводить sync meetings (2 раза/неделю):
  - API Review Meeting
  - Integration Planning
- Документировать решения и action items
- Отслеживать cross-team dependencies

**Критерии приемки:**
- [ ] Команды синхронизированы
- [ ] API контракты согласованы
- [ ] Зависимости отслеживаются
- [ ] Блокеры решаются быстро

---

#### Задача 2.3: Quality Assurance планирование
**Приоритет:** Высокий
**Оценка:** 8 часов
**Описание:**
- Создать QA стратегию для MVP:
  - Unit testing (обязательно для backend, опционально для frontend)
  - Integration testing (критичные flows)
  - E2E testing (регистрация, profile, AI анализ)
  - Manual testing checklist
- Определить testing environments:
  - Local
  - Staging
  - Production
- Создать bug tracking process
- Настроить test coverage tracking

**Критерии приемки:**
- [ ] QA стратегия документирована
- [ ] Testing environments настроены
- [ ] Bug tracking process работает
- [ ] Coverage tracking настроен

---

#### Задача 2.4: Документация API контрактов
**Приоритет:** Высокий
**Оценка:** 10 часов
**Описание:**
- Документировать все API эндпоинты для первых 2 спринтов:
  - `/auth/*` - Authentication
  - `/users/*` - Users
  - `/profiles/*` - Profiles
  - `/ai/*` - AI services
  - `/career-paths/*` - Career paths
- Для каждого эндпоинта:
  - Request format (params, body, headers)
  - Response format (success + error cases)
  - Status codes
  - Examples
- Создать API contract document
- Согласовать с frontend и backend

**Критерии приемки:**
- [ ] Все эндпоинты документированы
- [ ] Frontend и Backend согласовали контракты
- [ ] Examples присутствуют
- [ ] Документация доступна команде

---

#### Задача 2.5: Sprint Review и Retrospective
**Приоритет:** Средний
**Оценка:** 4 часа (в конце каждого спринта)
**Описание:**
- Провести Sprint Review:
  - Demo выполненных задач
  - Сбор feedback от stakeholders
  - Обновление backlog
- Провести Sprint Retrospective:
  - Что прошло хорошо
  - Что можно улучшить
  - Action items на следующий спринт
- Документировать lessons learned
- Обновить процессы на основе ретро

**Критерии приемки:**
- [ ] Sprint Review проведен
- [ ] Feedback собран
- [ ] Retrospective проведена
- [ ] Action items созданы и назначены

---

## 📋 СВОДНАЯ ТАБЛИЦА ЗАДАЧ ПО СПРИНТАМ

### СПРИНТ 1 (Недели 1-2) - Фокус: Инфраструктура + Auth

| Команда | Количество задач | Общая оценка (часы) |
|---------|-----------------|---------------------|
| **Frontend** | 5 | 48 |
| **Backend** | 5 | 50 |
| **ML/AI** | 5 | 42 |
| **DevOps** | 5 | 30 |
| **PM/SA** | 5 | 48 |
| **ИТОГО** | **25** | **218** |

### СПРИНТ 2 (Недели 3-4) - Фокус: Профиль + AI

| Команда | Количество задач | Общая оценка (часы) |
|---------|-----------------|---------------------|
| **Frontend** | 5 | 50 |
| **Backend** | 5 | 36 |
| **ML/AI** | 5 | 48 |
| **DevOps** | 5 | 46 |
| **PM/SA** | 5 | 34 |
| **ИТОГО** | **25** | **214** |

---

## 📌 ПРИОРИТЕТЫ И ЗАВИСИМОСТИ

### Критический путь (Must Complete):

**Спринт 1:**
1. DevOps: Docker Compose setup → Все команды зависят от этого
2. Backend: Database + Prisma → Все backend задачи зависят
3. Backend: Auth Module → Frontend Auth зависит
4. Frontend: Next.js setup → Все frontend задачи зависят
5. ML: AI Environment setup → AI задачи зависят

**Спринт 2:**
1. Backend: Profiles Module → Frontend Profile зависит
2. ML: Career Path Generation → Frontend Career Paths зависит
3. DevOps: CI/CD → Деплой зависит
4. Frontend: Profile UI → E2E flow зависит

### Можно выполнять параллельно:

**Спринт 1:**
- Frontend (Layouts) + Backend (Users Module)
- Frontend (API Client) + Backend (Redis)
- DevOps (Dockerfile) пока Backend/Frontend разрабатываются

**Спринт 2:**
- Frontend (Dashboard) + Backend (Swagger)
- ML (Career Path Chain) + DevOps (CI/CD)
- Frontend (UI Components) независимо

---

## 🎯 РЕКОМЕНДАЦИИ ПО ИСПОЛЬЗОВАНИЮ В YOUGILE

### Как создавать задачи:

1. **Создать проект:** "CareerMate MVP"
2. **Создать спринты:** "Спринт 1 (1-2 недели)", "Спринт 2 (3-4 недели)"
3. **Создать колонки:**
   - Backlog
   - To Do
   - In Progress
   - Review
   - Done

4. **Для каждой задачи добавить:**
   - Название задачи
   - Описание (из этого документа)
   - Приоритет (Критический/Высокий/Средний)
   - Оценка времени (часы)
   - Assignee (разработчик)
   - Критерии приемки (checklist)
   - Метки (Frontend/Backend/ML/DevOps/PM)

5. **Создать зависимости между задачами** (используя функцию "связанные задачи")

### Примеры меток (Tags):

- `critical` - Критические задачи
- `frontend` - Фронтенд задачи
- `backend` - Бэкенд задачи
- `ml-ai` - ML/AI задачи
- `devops` - DevOps задачи
- `pm` - Project Management
- `bug` - Баги
- `tech-debt` - Технический долг
- `documentation` - Документация

---

## ✅ ЧЕКЛИСТ ГОТОВНОСТИ К СПРИНТУ

### Перед началом Спринта 1:

- [ ] Все члены команды прочитали этот документ
- [ ] Задачи созданы в Yougile
- [ ] Оценки согласованы
- [ ] Зависимости определены
- [x] Docker и dev окружение настроены
- [ ] Доступы к сервисам получены (GitHub, hosting, AI API)
- [ ] Проведен Sprint Planning meeting

### Перед началом Спринта 2:

- [ ] Спринт 1 завершен (все критические задачи выполнены)
- [ ] Ретроспектива Спринта 1 проведена
- [ ] Action items из ретро учтены
- [ ] Backlog Спринта 2 приоритизирован
- [ ] API контракты для Спринта 2 согласованы

---

## 📞 КОНТАКТЫ И КОММУНИКАЦИЯ

### Рекомендуемые каналы:

- **Yougile**: Управление задачами, трекинг прогресса
- **Slack/Discord**: Оперативная коммуникация
- **GitHub**: Code reviews, технические дискуссии
- **Notion/Confluence**: Документация, knowledge base
- **Zoom/Meet**: Встречи, Daily Standups

### Расписание встреч:

- **Daily Standup**: Каждый день, 15 минут, 10:00
- **Sprint Planning**: Каждые 2 недели, 2 часа, понедельник
- **Sprint Review**: Каждые 2 недели, 1 час, пятница
- **Sprint Retrospective**: Каждые 2 недели, 1 час, пятница (после Review)
- **API Sync Meeting**: 2 раза в неделю, 30 минут, среда и пятница

---

**Успехов в разработке! 🚀**

**Последнее обновление:** 2025-01-26
