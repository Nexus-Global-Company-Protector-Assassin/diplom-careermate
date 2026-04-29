# CareerMate — Главный маршрут пользователя

> Текстовая схема пути пользователя от входа в систему до генерации сопроводительного письма и подготовки к интервью по STAR-методу.

---

## Схема маршрута

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ВХОД                                                        │
│  / (RootPage → AuthPage)                                        │
│  - Логин по email/пароль (NextAuth + JWT)                       │
│  - Или OAuth (Google/GitHub)                                    │
│  → backend POST /auth/login → JWT в cookie                      │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ПОСЛЕ ВХОДА (первый раз)                                    │
│  /dashboard                                                     │
│  - Header показывает имя из профиля/JWT                         │
│  - Если профиль пустой → баннер «Заполните профиль»             │
│    (MainLayout, ProfileCompletenessCard < 70%)                  │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. ПРОФИЛЬ (быстрый старт)                                     │
│  /profile                                                       │
│  Вариант A — ручное заполнение:                                 │
│    fullName, desiredPosition, skills[], aboutMe, опыт           │
│  Вариант B — «Импорт из резюме» (ResumeImportModal):            │
│    Upload PDF/DOCX → agent /ai/parse-resume                     │
│    → preview → smart-merge в Profile                            │
│  + Карточка «Предпочтения поиска»:                              │
│    workFormat, companyType, managementStyle                     │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. РЕЗЮМЕ                                                      │
│  /resume                                                        │
│  Три пути генерации:                                            │
│   ① Загрузить готовое  → MinIO/S3 + agent /ai/review-resume     │
│      → отзыв (cached, Stanford CAR-чеклист)                     │
│   ② Создать с нуля      → agent /ai/create-resume               │
│      шаг 1: вопросы (fastChat) → шаг 2: генерация               │
│   ③ Адаптировать под вакансию  → agent /ai/generate-resume      │
│      (вызывается из карточки вакансии)                          │
│  Сохраняется в Resume (type=resume, status=active)              │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. ВАКАНСИИ — ПОДБОР                                           │
│  /vacancies                                                     │
│  backend GET /vacancies/recommended:                            │
│   ① SQL keyword + Pinecone semantic → TOP-50                    │
│   ② calcMatch (6-компонентный скор) → matchReasons[]            │
│   ③ Hybrid: 0.6×match + 0.4×semantic                            │
│   ④ Behavioral re-ranking (boost ×1.2 preferred archetype,      │
│      фильтрация dismissed) → TOP-10                             │
│  Карточка вакансии: matchReasons-пилюли, кнопки CTA             │
│  Каждое действие → POST /vacancies/:id/interaction              │
│   (click / favorite / dismiss)                                  │
└──────┬──────────────┬──────────────┬─────────────────┬──────────┘
       │              │              │                 │
       ▼              ▼              ▼                 ▼
┌────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 6a. АНАЛИЗ │ │ 6b. COVER    │ │ 6c. INTER-   │ │ 6d. ОТКЛИК   │
│ ВАКАНСИИ   │ │     LETTER   │ │     VIEW PREP│ │              │
│            │ │              │ │              │ │              │
│ POST       │ │ POST         │ │ POST         │ │ POST         │
│ /vacancies │ │ /vacancies/  │ │ /interviews/ │ │ /vacancies/  │
│ /:id/      │ │ :id/cover-   │ │ prep         │ │ :id/apply    │
│ analyze    │ │ letter       │ │              │ │              │
│            │ │              │ │              │ │ + interaction│
│ AiService  │ │ AiService    │ │ AiService    │ │ type=apply   │
│ Vacancy-   │ │ generate-    │ │ generate-    │ │              │
│ Analysis   │ │ CoverLetter  │ │ Interview-   │ │ Создаётся    │
│ Chain      │ │ Chain        │ │ Prep         │ │ Vacancy-     │
│            │ │              │ │              │ │ Response     │
│ → 7 блоков │ │ Контекст:    │ │ → STAR+R     │ │              │
│   A-G      │ │  резюме +    │ │   ответы:    │ │              │
│ → Ghost    │ │  вакансия +  │ │   Situation  │ │              │
│   Job      │ │  профиль     │ │   Task       │ │              │
│   Detection│ │              │ │   Action     │ │              │
│ → архетип  │ │ Stanford     │ │   Result     │ │              │
│            │ │ CAR-структура│ │   +Reflection│ │              │
│ interaction│ │              │ │              │ │              │
│ type=      │ │ Markdown +   │ │ Список       │ │              │
│ analyze    │ │ копирование  │ │ типичных     │ │              │
│            │ │              │ │ вопросов с   │ │              │
│            │ │ Сохранение в │ │ STAR-        │ │              │
│            │ │ Resume       │ │ заготовками  │ │              │
│            │ │ (type=cover_ │ │              │ │              │
│            │ │  letter)     │ │ interaction  │ │              │
│            │ │              │ │ type=click   │ │              │
└────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

## Параллельная ветка

```
┌─────────────────────────────────────────────────────────────────┐
│  /resume → «Standalone cover letter» (без вакансии)             │
│  POST /resumes/cover-letter                                     │
│  ResumesService → AiService.generateCoverLetter()               │
│  (контекст из профиля + company/position руками)                │
└─────────────────────────────────────────────────────────────────┘
```

## Поддержка (доступно из любой точки)

```
┌─────────────────────────────────────────────────────────────────┐
│  /analytics  — Career Quiz (10 вопросов, 6 dimensions →         │
│                CareerPathChain → топ-3 пути с роадмапом)        │
│  /settings   — настройки аккаунта                               │
│  Career chat — AiService.generateResponse (fastChat)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ключевые маршруты в коде

| Шаг | Frontend | Backend / Agent |
|---|---|---|
| Вход | `frontend/src/features/auth/auth-page.tsx` | `backend/src/modules/auth` (`POST /auth/login`) |
| Профиль | `/profile` + `ResumeImportModal` | `backend/profiles` + `agent /ai/parse-resume` |
| Резюме | `/resume` | `agent /ai/{review,generate,create}-resume` |
| Подбор | `/vacancies` | `backend GET /vacancies/recommended` |
| Анализ | карточка вакансии | `backend POST /vacancies/:id/analyze` (AiService) |
| Cover letter | модал на карточке | `backend POST /vacancies/:id/cover-letter` |
| **STAR** | модал «Подготовка к интервью» | `backend POST /interviews/prep` (`InterviewPrepChain`) |
| Поведение | автотрекинг на CTA | `POST /vacancies/:id/interaction` |

---

## Золотой путь

**Вход → Профиль (импорт из резюме) → Резюме → Вакансии → карточка вакансии → Cover Letter + STAR-подготовка → Отклик**
