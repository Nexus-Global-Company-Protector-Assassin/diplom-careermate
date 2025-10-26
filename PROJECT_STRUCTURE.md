# 📂 CareerMate - Project Structure

Подробное описание структуры проекта CareerMate.

## Обзор

CareerMate - это monorepo проект, использующий npm workspaces для управления frontend и backend приложениями.

\`\`\`
careermate/
├── frontend/          # Next.js приложение
├── backend/           # NestJS приложение
├── docs/              # Документация
├── scripts/           # Утилиты и скрипты
├── shared/            # Общий код
├── tests/             # Интеграционные тесты
└── docker/            # Docker конфигурации
\`\`\`

---

## 📁 Корневая директория

\`\`\`
careermate/
├── .env.example              # Пример переменных окружения
├── .gitignore               # Git ignore правила
├── .prettierrc              # Prettier конфигурация
├── docker-compose.yml       # Docker Compose конфигурация
├── package.json             # Root package.json (workspaces)
├── README.md                # Главный README
├── REQUIREMENTS.md          # Требования и зависимости
├── PROJECT_STRUCTURE.md     # Этот файл
└── LICENSE                  # MIT License
\`\`\`

---

## 🎨 Frontend Structure (Next.js 14)

\`\`\`
frontend/
├── src/
│   ├── app/                          # App Router (Next.js 14)
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx         # Login page
│   │   │   ├── register/
│   │   │   │   └── page.tsx         # Register page
│   │   │   └── layout.tsx           # Auth layout
│   │   │
│   │   ├── (dashboard)/              # Dashboard route group
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         # Main dashboard
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx         # Profile page
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx     # Edit profile
│   │   │   ├── resumes/
│   │   │   │   ├── page.tsx         # Resumes list
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx     # Resume detail
│   │   │   │   └── new/
│   │   │   │       └── page.tsx     # Create resume
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx         # Jobs list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # Job detail
│   │   │   ├── applications/
│   │   │   │   └── page.tsx         # Applications tracker
│   │   │   ├── interview-prep/
│   │   │   │   └── page.tsx         # Interview prep
│   │   │   └── layout.tsx           # Dashboard layout
│   │   │
│   │   ├── api/                      # API routes (Next.js API)
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts     # NextAuth config
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css               # Global styles
│   │
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── select.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...                  # Другие UI компоненты
│   │   │
│   │   ├── layout/                   # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   │
│   │   ├── forms/                    # Form components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── ResumeForm.tsx
│   │   │   └── JobSearchForm.tsx
│   │   │
│   │   ├── dashboard/                # Dashboard specific
│   │   │   ├── DashboardStats.tsx
│   │   │   ├── RecentApplications.tsx
│   │   │   ├── JobRecommendations.tsx
│   │   │   └── WeeklyReport.tsx
│   │   │
│   │   ├── resumes/                  # Resume components
│   │   │   ├── ResumeCard.tsx
│   │   │   ├── ResumeEditor.tsx
│   │   │   ├── ResumePreview.tsx
│   │   │   └── TemplateSelector.tsx
│   │   │
│   │   └── jobs/                     # Job components
│   │       ├── JobCard.tsx
│   │       ├── JobList.tsx
│   │       ├── JobFilters.tsx
│   │       └── JobDetails.tsx
│   │
│   ├── lib/                          # Libraries & utilities
│   │   ├── api.ts                    # API client
│   │   ├── auth.ts                   # Auth helpers
│   │   ├── utils.ts                  # Utility functions
│   │   ├── constants.ts              # Constants
│   │   └── validators.ts             # Zod schemas
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useProfile.ts
│   │   ├── useResumes.ts
│   │   ├── useJobs.ts
│   │   ├── useApplications.ts
│   │   └── useToast.ts
│   │
│   ├── services/                     # API services
│   │   ├── auth.service.ts
│   │   ├── profile.service.ts
│   │   ├── resume.service.ts
│   │   ├── job.service.ts
│   │   ├── application.service.ts
│   │   └── analytics.service.ts
│   │
│   ├── types/                        # TypeScript types
│   │   ├── user.types.ts
│   │   ├── profile.types.ts
│   │   ├── resume.types.ts
│   │   ├── job.types.ts
│   │   ├── application.types.ts
│   │   └── api.types.ts
│   │
│   └── styles/                       # Additional styles
│       ├── globals.css
│       └── themes.css
│
├── public/                           # Static files
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero.png
│   │   └── avatars/
│   ├── fonts/
│   └── icons/
│
├── .env.local                        # Local environment
├── .eslintrc.json                    # ESLint config
├── next.config.js                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── package.json                      # Frontend dependencies
└── README.md                         # Frontend README
\`\`\`

---

## ⚙️ Backend Structure (NestJS)

\`\`\`
backend/
├── src/
│   ├── main.ts                       # Application entry point
│   ├── app.module.ts                 # Root module
│   │
│   ├── auth/                         # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── strategies/               # Passport strategies
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── google.strategy.ts
│   │   │   └── linkedin.strategy.ts
│   │   ├── guards/                   # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── decorators/               # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       ├── register.dto.ts
│   │       └── refresh-token.dto.ts
│   │
│   ├── users/                        # Users module
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   │
│   ├── profiles/                     # Profiles module
│   │   ├── profiles.module.ts
│   │   ├── profiles.service.ts
│   │   ├── profiles.controller.ts
│   │   ├── entities/
│   │   │   └── profile.entity.ts
│   │   ├── dto/
│   │   │   ├── create-profile.dto.ts
│   │   │   └── update-profile.dto.ts
│   │   ├── career-paths/             # Career paths sub-module
│   │   │   ├── career-paths.service.ts
│   │   │   └── career-paths.controller.ts
│   │   └── skills-analysis/          # Skills analysis
│   │       └── skills-analysis.service.ts
│   │
│   ├── resumes/                      # Resumes module
│   │   ├── resumes.module.ts
│   │   ├── resumes.service.ts
│   │   ├── resumes.controller.ts
│   │   ├── entities/
│   │   │   └── resume.entity.ts
│   │   ├── dto/
│   │   │   ├── create-resume.dto.ts
│   │   │   └── generate-resume.dto.ts
│   │   ├── templates/                # Resume templates
│   │   │   ├── modern.template.ts
│   │   │   ├── classic.template.ts
│   │   │   └── creative.template.ts
│   │   └── generators/               # PDF generators
│   │       ├── pdf-generator.service.ts
│   │       └── html-renderer.service.ts
│   │
│   ├── jobs/                         # Jobs module
│   │   ├── jobs.module.ts
│   │   ├── jobs.service.ts
│   │   ├── jobs.controller.ts
│   │   ├── entities/
│   │   │   └── job.entity.ts
│   │   ├── dto/
│   │   │   ├── search-jobs.dto.ts
│   │   │   └── create-job.dto.ts
│   │   ├── scrapers/                 # Job board scrapers
│   │   │   ├── hh-scraper.service.ts
│   │   │   ├── linkedin-scraper.service.ts
│   │   │   └── indeed-scraper.service.ts
│   │   └── matching/                 # Job matching
│   │       ├── matching.service.ts
│   │       └── scoring.service.ts
│   │
│   ├── applications/                 # Applications module
│   │   ├── applications.module.ts
│   │   ├── applications.service.ts
│   │   ├── applications.controller.ts
│   │   ├── entities/
│   │   │   └── application.entity.ts
│   │   ├── dto/
│   │   │   ├── create-application.dto.ts
│   │   │   └── update-application.dto.ts
│   │   ├── auto-apply/               # Auto-apply feature
│   │   │   └── auto-apply.service.ts
│   │   └── tracking/                 # Status tracking
│   │       └── tracking.service.ts
│   │
│   ├── interviews/                   # Interviews module
│   │   ├── interviews.module.ts
│   │   ├── interviews.service.ts
│   │   ├── interviews.controller.ts
│   │   ├── entities/
│   │   │   └── interview-prep.entity.ts
│   │   ├── dto/
│   │   │   └── prepare-interview.dto.ts
│   │   ├── company-research/         # Company research
│   │   │   └── company-research.service.ts
│   │   └── question-gen/             # Question generation
│   │       └── question-generator.service.ts
│   │
│   ├── ai/                           # AI module
│   │   ├── ai.module.ts
│   │   ├── ai.service.ts
│   │   ├── langchain/                # LangChain integration
│   │   │   ├── chains.service.ts
│   │   │   ├── profile-analysis.chain.ts
│   │   │   ├── resume-generation.chain.ts
│   │   │   ├── job-matching.chain.ts
│   │   │   └── cover-letter.chain.ts
│   │   ├── embeddings/               # Vector embeddings
│   │   │   ├── embeddings.service.ts
│   │   │   └── pinecone.service.ts
│   │   ├── providers/                # LLM providers
│   │   │   ├── custom-llm.provider.ts
│   │   │   └── openai.provider.ts
│   │   └── prompts/                  # Prompt templates
│   │       ├── resume-prompts.ts
│   │       ├── job-matching-prompts.ts
│   │       └── interview-prompts.ts
│   │
│   ├── notifications/                # Notifications module
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts
│   │   ├── email/                    # Email notifications
│   │   │   ├── email.service.ts
│   │   │   └── templates/
│   │   │       ├── welcome.template.ts
│   │   │       ├── weekly-report.template.ts
│   │   │       └── job-alert.template.ts
│   │   └── push/                     # Push notifications
│   │       └── push.service.ts
│   │
│   ├── analytics/                    # Analytics module
│   │   ├── analytics.module.ts
│   │   ├── analytics.service.ts
│   │   ├── analytics.controller.ts
│   │   └── reports/                  # Report generation
│   │       ├── weekly-report.service.ts
│   │       └── stats.service.ts
│   │
│   ├── common/                       # Common utilities
│   │   ├── decorators/
│   │   │   ├── api-paginated-response.decorator.ts
│   │   │   └── timeout.decorator.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── prisma-exception.filter.ts
│   │   ├── guards/
│   │   │   └── throttler.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── timeout.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── interfaces/
│   │       ├── paginated-response.interface.ts
│   │       └── api-response.interface.ts
│   │
│   ├── config/                       # Configuration
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── jwt.config.ts
│   │   ├── ai.config.ts
│   │   └── app.config.ts
│   │
│   ├── database/                     # Database utilities
│   │   └── database.module.ts
│   │
│   ├── queues/                       # Queue module
│   │   ├── queues.module.ts
│   │   └── processors/
│   │       ├── resume.processor.ts
│   │       ├── email.processor.ts
│   │       └── scraper.processor.ts
│   │
│   └── workers/                      # Background workers
│       ├── resume-generator.worker.ts
│       ├── job-scraper.worker.ts
│       ├── auto-apply.worker.ts
│       └── weekly-report.worker.ts
│
├── prisma/                           # Prisma ORM
│   ├── schema.prisma                 # Database schema
│   ├── migrations/                   # Database migrations
│   └── seed.ts                       # Seed data
│
├── test/                             # Tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── .env                              # Environment variables
├── .eslintrc.js                      # ESLint config
├── tsconfig.json                     # TypeScript config
├── nest-cli.json                     # NestJS CLI config
├── package.json                      # Backend dependencies
└── README.md                         # Backend README
\`\`\`

---

## 📚 Documentation Structure

\`\`\`
docs/
├── README.md                         # Docs overview
│
├── api/                              # API documentation
│   ├── README.md                     # API overview
│   ├── authentication.md             # Auth endpoints
│   ├── endpoints.md                  # All endpoints
│   └── errors.md                     # Error handling
│
├── architecture/                     # Architecture docs
│   ├── system-design.md             # System design (main doc)
│   ├── database-schema.md           # Database schema
│   ├── ai-architecture.md           # AI/LLM architecture
│   └── scaling.md                   # Scaling strategies
│
├── guides/                           # Developer guides
│   ├── quick-start.md               # Quick start guide
│   ├── frontend-development.md      # Frontend guide
│   ├── backend-development.md       # Backend guide
│   ├── ai-integration.md            # AI integration
│   ├── testing.md                   # Testing guide
│   └── troubleshooting.md           # Common issues
│
└── deployment/                       # Deployment docs
    ├── production.md                # Production deployment
    ├── docker.md                    # Docker guide
    ├── cicd.md                      # CI/CD setup
    └── monitoring.md                # Monitoring setup
\`\`\`

---

## 🔧 Scripts & Utilities

\`\`\`
scripts/
├── setup.js                          # Setup script (Node.js)
├── setup.sh                          # Setup script (Bash)
├── setup.ps1                         # Setup script (PowerShell)
└── migrations/                       # Data migration scripts
    └── migrate-users.js
\`\`\`

---

## 🧪 Tests Structure

\`\`\`
tests/
├── e2e/                              # End-to-end tests
│   ├── auth.spec.ts
│   ├── profile.spec.ts
│   ├── resume.spec.ts
│   └── jobs.spec.ts
│
├── integration/                      # Integration tests
│   ├── database.test.ts
│   ├── redis.test.ts
│   └── ai.test.ts
│
└── load/                             # Load testing (k6)
    ├── api-load.js
    └── ai-generation.js
\`\`\`

---

## 🐳 Docker Structure

\`\`\`
docker/
├── frontend.Dockerfile               # Frontend production
├── backend.Dockerfile                # Backend production
└── nginx/                            # Nginx config
    └── nginx.conf
\`\`\`

---

## 📦 Shared Code

\`\`\`
shared/
├── types/                            # Shared TypeScript types
│   ├── user.types.ts
│   ├── job.types.ts
│   └── api.types.ts
│
└── utils/                            # Shared utilities
    ├── validators.ts
    └── formatters.ts
\`\`\`

---

## 🗃️ Data & Uploads

\`\`\`
uploads/                              # Local uploads (gitignored)
├── resumes/
│   └── {userId}/
├── cover-letters/
│   └── {userId}/
└── temp/

logs/                                 # Application logs (gitignored)
├── error.log
├── combined.log
└── access.log
\`\`\`

---

## Навигация по проекту

### Где найти...

| Что искать | Где находится |
|------------|---------------|
| **API endpoints** | `backend/src/*/\*.controller.ts` |
| **Business logic** | `backend/src/*/\*.service.ts` |
| **Database models** | `backend/prisma/schema.prisma` |
| **React pages** | `frontend/src/app/*/page.tsx` |
| **React components** | `frontend/src/components/` |
| **API types** | `frontend/src/types/` |
| **Utilities** | `frontend/src/lib/` или `backend/src/common/` |
| **Config** | `.env`, `*config.{js,ts}` |
| **Documentation** | `docs/` |

---

## Команды для навигации

\`\`\`bash
# Поиск файлов
find . -name "*.service.ts"          # Все сервисы
find . -name "*.controller.ts"       # Все контроллеры
find . -name "page.tsx"              # Все страницы

# Grep по коду
grep -r "useAuth" frontend/          # Использование useAuth
grep -r "@Post" backend/src/         # Все POST endpoints
\`\`\`

---

**Последнее обновление:** 2025-01-26
