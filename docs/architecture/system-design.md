# 🏗️ Системный дизайн CareerMate
## Архитектура высоконагруженного AI-платформы для поиска работы

---

## 📋 Executive Summary

**Проект:** CareerMate - AI-платформа для автоматизации поиска работы  
**Целевая нагрузка (через 12 месяцев):** 100K+ пользователей, 1M+ AI-запросов/месяц  
**Критические требования:** 
- Низкая латентность AI-ответов (<3s)
- Высокая доступность (99.9% uptime)
- Масштабируемость под рост в 10x
- GDPR/персональные данные compliance

---

## 🎯 Функциональные требования

### Ключевые возможности системы:

**1. Профиль и анализ (User Profile & Analysis)**
- Регистрация/авторизация пользователей
- Хранение структурированных данных профиля (опыт, навыки, цели)
- AI-анализ опыта и формирование карьерных путей
- Расчет скоров соответствия (matching scores)

**2. Генерация контента (Content Generation)**
- Создание резюме в PDF (множественные стили)
- Генерация сопроводительных писем под вакансии
- Адаптация текстов под требования работодателей
- Оптимизация под ATS-системы

**3. Поиск и подбор вакансий (Job Matching)**
- Парсинг вакансий с внешних площадок (HH.ru, LinkedIn, Indeed)
- Векторный поиск по семантике
- Персонализированная рекомендательная система
- До 15 вакансий/неделю на пользователя

**4. Автоматические отклики (Auto-apply)**
- Полуавтоматические/автоматические отклики
- Трекинг статусов откликов
- Интеграция с API job boards
- Rate limiting и anti-ban механизмы

**5. Подготовка к интервью (Interview Prep)**
- Анализ компаний и отзывов
- Генерация типичных вопросов
- Симуляция интервью (в будущем)
- Советы по переговорам

**6. Аналитика и отчеты (Analytics)**
- Еженедельные отчеты по откликам
- Метрики эффективности (response rate, interview rate)
- A/B тестирование резюме
- Рекомендации по улучшению стратегии

---

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CDN (Cloudflare)                         │
│                    Static Assets + Edge Caching                  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Load Balancer (Vercel)                      │
└─────────────────────────────────────────────────────────────────┘
                                 │
                ┌────────────────┴───────────────┐
                ▼                                ▼
┌──────────────────────────┐      ┌──────────────────────────┐
│   Next.js Frontend       │      │   API Gateway            │
│   (SSR + Client Side)    │      │   (Rate Limiting, Auth)  │
│                          │      │                          │
│   - User Interface       │      │   - Auth Middleware      │
│   - Server Components    │      │   - Request Validation   │
│   - Server Actions       │      │   - API Versioning       │
└──────────────────────────┘      └──────────────────────────┘
                                               │
                                               ▼
                          ┌────────────────────────────────┐
                          │   NestJS Backend (App Server)  │
                          │                                │
                          │   ┌──────────────────────┐     │
                          │   │  Auth Module         │     │
                          │   │  (JWT + OAuth)       │     │
                          │   └──────────────────────┘     │
                          │   ┌──────────────────────┐     │
                          │   │  Profile Module      │     │
                          │   └──────────────────────┘     │
                          │   ┌──────────────────────┐     │
                          │   │  Resume Module       │     │
                          │   └──────────────────────┘     │
                          │   ┌──────────────────────┐     │
                          │   │  Jobs Module         │     │
                          │   └──────────────────────┘     │
                          │   ┌──────────────────────┐     │
                          │   │  Application Module  │     │
                          │   └──────────────────────┘     │
                          │   ┌──────────────────────┐     │
                          │   │  Interview Module    │     │
                          │   └──────────────────────┘     │
                          └────────────────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  AI Service Layer   │  │  Data Layer         │  │  External Services  │
│                     │  │                     │  │                     │
│  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │
│  │ LangChain     │  │  │  │ PostgreSQL    │  │  │  │ Job Boards    │  │
│  │ Orchestrator  │  │  │  │ (Primary DB)  │  │  │  │ APIs          │  │
│  └───────────────┘  │  │  └───────────────┘  │  │  │ (HH, LinkedIn)│  │
│  ┌───────────────┐  │  │  ┌───────────────┐  │  │  └───────────────┘  │
│  │ Your Custom   │  │  │  │ Redis         │  │  │  ┌───────────────┐  │
│  │ LLM Model     │  │  │  │ (Cache + Jobs)│  │  │  │ Email Service │  │
│  └───────────────┘  │  │  └───────────────┘  │  │  │ (SendGrid)    │  │
│  ┌───────────────┐  │  │  ┌───────────────┐  │  │  └───────────────┘  │
│  │ Vector DB     │  │  │  │ S3 / Storage  │  │  │  ┌───────────────┐  │
│  │ (Pinecone)    │  │  │  │ (Resumes,PDFs)│  │  │  │ PDF Generator │  │
│  └───────────────┘  │  │  └───────────────┘  │  │  │ (Puppeteer)   │  │
│  ┌───────────────┐  │  │  ┌───────────────┐  │  │  └───────────────┘  │
│  │ Embedding     │  │  │  │ BullMQ        │  │  │  ┌───────────────┐  │
│  │ Service       │  │  │  │ (Job Queue)   │  │  │  │ Analytics     │  │
│  └───────────────┘  │  │  └───────────────┘  │  │  │ (PostHog)     │  │
└─────────────────────┘  └─────────────────────┘  │  └───────────────┘  │
                                                  └─────────────────────┘
            │                          │
            ▼                          ▼
┌─────────────────────┐  ┌─────────────────────┐
│  Monitoring Stack   │  │  Background Workers │
│                     │  │                     │
│  - Sentry           │  │  - Resume Generator │
│  - Datadog          │  │  - Job Scraper      │
│  - Prometheus       │  │  - Email Sender     │
│  - Grafana          │  │  - Report Builder   │
└─────────────────────┘  └─────────────────────┘
```

---

## 🗄️ Детализация компонентов

### 1. Frontend Layer (Next.js 14)

**Технологии:**
- Next.js 14 (App Router, Server Components, Server Actions)
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- React Query (для client-side кэширования)
- Zod (валидация форм)

**Ключевые страницы:**
- `/` - Landing page (SSG)
- `/dashboard` - User dashboard (SSR + dynamic)
- `/profile` - Profile management (ISR)
- `/resumes` - Resume builder (Client-side heavy)
- `/jobs` - Job listings (SSR + infinite scroll)
- `/applications` - Application tracker (Real-time updates)
- `/interview-prep` - Interview preparation (SSR)

**Оптимизации:**
- Server Components для начальной загрузки
- Streaming SSR для тяжелых страниц
- Incremental Static Regeneration (ISR) для списка вакансий
- Route Prefetching
- Image Optimization через Next/Image
- Code Splitting по роутам

---

### 2. API Gateway + Backend (NestJS)

**Модульная архитектура NestJS:**

```typescript
src/
├── auth/                    # Аутентификация
│   ├── strategies/          # JWT, OAuth
│   ├── guards/              # Auth guards
│   └── decorators/          # Custom decorators
├── users/                   # Управление пользователями
│   ├── entities/
│   ├── dto/
│   └── users.service.ts
├── profiles/                # Профили и CV
│   ├── career-paths/
│   ├── skills-analysis/
│   └── profiles.service.ts
├── resumes/                 # Генерация резюме
│   ├── templates/
│   ├── generators/
│   └── resumes.service.ts
├── jobs/                    # Вакансии
│   ├── scrapers/            # Парсеры внешних сайтов
│   ├── matching/            # Matching алгоритмы
│   └── jobs.service.ts
├── applications/            # Отклики
│   ├── auto-apply/
│   ├── tracking/
│   └── applications.service.ts
├── interviews/              # Подготовка к интервью
│   ├── company-research/
│   ├── question-gen/
│   └── interviews.service.ts
├── ai/                      # AI сервисы
│   ├── langchain/
│   ├── embeddings/
│   └── ai.service.ts
├── notifications/           # Уведомления
│   ├── email/
│   ├── push/
│   └── notifications.service.ts
└── analytics/               # Аналитика
    ├── reports/
    └── analytics.service.ts
```

**API Design Principles:**
- RESTful endpoints + GraphQL для сложных запросов (опционально)
- API Versioning (`/api/v1/...`)
- Request/Response DTOs с валидацией (class-validator)
- Swagger/OpenAPI документация
- Rate Limiting (по user ID, IP)
- CORS настройка
- Request ID для трейсинга

**Примеры эндпоинтов:**
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/profiles/:id
PUT    /api/v1/profiles/:id
POST   /api/v1/resumes/generate
GET    /api/v1/jobs/recommendations
POST   /api/v1/applications/auto-apply
GET    /api/v1/interviews/company-info/:companyId
GET    /api/v1/analytics/weekly-report
```

---

### 3. AI Service Layer

**Архитектура AI-модуля:**

```
┌─────────────────────────────────────────┐
│         LangChain Orchestrator          │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Chain 1: Profile Analysis        │  │
│  │  - Extract skills                 │  │
│  │  - Identify gaps                  │  │
│  │  - Career path generation         │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Chain 2: Resume Generation       │  │
│  │  - Content generation             │  │
│  │  - ATS optimization               │  │
│  │  - Style adaptation               │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Chain 3: Job Matching            │  │
│  │  - Semantic search                │  │
│  │  - Scoring                        │  │
│  │  - Ranking                        │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Chain 4: Cover Letter Gen        │  │
│  │  - Personalization                │  │
│  │  - Company research integration   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Chain 5: Interview Prep          │  │
│  │  - Question generation            │  │
│  │  - Answer suggestions             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
            │                │
            ▼                ▼
    ┌─────────────┐  ┌──────────────┐
    │ Your Custom │  │ Vector Store │
    │ LLM Model   │  │ (Pinecone)   │
    └─────────────┘  └──────────────┘
```

**Ключевые компоненты:**

**3.1. Custom LLM Integration**
```typescript
// ai/providers/custom-llm.provider.ts
export class CustomLLMProvider {
  private endpoint: string;
  private apiKey: string;
  
  async generate(prompt: string, options: GenerateOptions): Promise<string> {
    // Retry logic
    // Timeout handling
    // Token counting
    // Cost tracking
  }
  
  async embed(text: string): Promise<number[]> {
    // Generate embeddings for vector search
  }
}
```

**3.2. Vector Database (Pinecone)**
- **Namespace 1:** User profiles embeddings
- **Namespace 2:** Job descriptions embeddings
- **Namespace 3:** Skills taxonomy embeddings
- **Namespace 4:** Company information embeddings

**Структура векторов:**
```json
{
  "id": "user_12345_profile",
  "values": [0.123, -0.456, ...],  // 1536-dim embedding
  "metadata": {
    "user_id": "12345",
    "experience_years": 5,
    "skills": ["Python", "JavaScript"],
    "location": "Moscow",
    "salary_min": 150000,
    "updated_at": "2025-10-24T10:00:00Z"
  }
}
```

**3.3. Prompt Engineering Best Practices**
```typescript
// ai/prompts/resume-generator.prompt.ts
export const RESUME_PROMPT = `
You are an expert resume writer with 15 years of experience.
Generate a professional resume section based on:

USER PROFILE:
{user_profile}

JOB REQUIREMENTS:
{job_requirements}

STYLE GUIDELINES:
{style_guidelines}

Output format: JSON with sections: summary, experience, skills, education
Focus on ATS optimization and quantifiable achievements.
`;
```

**3.4. Caching Strategy**
- Кэширование промптов с одинаковыми параметрами (Redis)
- TTL: 24 часа для статических результатов
- Инвалидация при изменении профиля

---

### 4. Data Layer

#### 4.1. PostgreSQL (Primary Database)

**Schema Design:**

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_tier, subscription_expires_at);

-- Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    desired_position VARCHAR(255),
    desired_salary_min INTEGER,
    desired_salary_max INTEGER,
    experience_years INTEGER,
    education JSONB,  -- Flexible structure
    work_experience JSONB,
    skills JSONB,
    languages JSONB,
    about_me TEXT,
    career_goals TEXT,
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);
CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_profiles_skills ON profiles USING GIN(skills);

-- Career Paths Table
CREATE TABLE career_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    required_skills JSONB,
    timeline_months INTEGER,
    salary_range JSONB,
    market_demand_score DECIMAL(3,2),
    confidence_score DECIMAL(3,2),
    generated_at TIMESTAMP DEFAULT NOW(),
    is_selected BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_career_paths_user ON career_paths(user_id);

-- Resumes Table
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content JSONB,  -- Structured resume data
    template_id VARCHAR(100),
    pdf_url VARCHAR(500),
    pdf_s3_key VARCHAR(500),
    is_default BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_resumes_user ON resumes(user_id);
CREATE INDEX idx_resumes_default ON resumes(user_id, is_default);

-- Jobs Table (scraped + curated)
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255),
    source VARCHAR(100),  -- 'hh', 'linkedin', 'indeed', 'manual'
    url VARCHAR(1000),
    title VARCHAR(500),
    company_name VARCHAR(500),
    company_id UUID,  -- Reference to companies table
    location VARCHAR(255),
    remote_type VARCHAR(50),  -- 'remote', 'hybrid', 'office'
    employment_type VARCHAR(50),  -- 'full-time', 'part-time', 'contract'
    salary_min INTEGER,
    salary_max INTEGER,
    currency VARCHAR(10),
    description TEXT,
    requirements TEXT,
    responsibilities TEXT,
    benefits TEXT,
    skills_required JSONB,
    experience_years_min INTEGER,
    experience_years_max INTEGER,
    published_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    apply_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(external_id, source)
);
CREATE INDEX idx_jobs_title ON jobs(title);
CREATE INDEX idx_jobs_company ON jobs(company_name);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_active ON jobs(is_active, published_at);
CREATE INDEX idx_jobs_skills ON jobs USING GIN(skills_required);
CREATE INDEX idx_jobs_salary ON jobs(salary_min, salary_max);

-- Applications Table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    resume_id UUID REFERENCES resumes(id),
    cover_letter_id UUID REFERENCES cover_letters(id),
    status VARCHAR(50) DEFAULT 'pending',  -- pending, sent, viewed, interview, rejected, accepted
    applied_at TIMESTAMP DEFAULT NOW(),
    response_at TIMESTAMP,
    interview_scheduled_at TIMESTAMP,
    notes TEXT,
    is_auto_applied BOOLEAN DEFAULT FALSE,
    external_application_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status, applied_at);

-- Cover Letters Table
CREATE TABLE cover_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id),
    content TEXT,
    generated_at TIMESTAMP DEFAULT NOW(),
    is_used BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_cover_letters_user ON cover_letters(user_id);

-- Companies Table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) UNIQUE,
    website VARCHAR(500),
    industry VARCHAR(255),
    size VARCHAR(50),
    location VARCHAR(255),
    description TEXT,
    culture_info JSONB,
    interview_style JSONB,
    glassdoor_rating DECIMAL(2,1),
    linkedin_url VARCHAR(500),
    logo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_companies_name ON companies(name);

-- Interview Preparation Table
CREATE TABLE interview_preparations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id),
    job_id UUID REFERENCES jobs(id),
    common_questions JSONB,
    suggested_answers JSONB,
    company_research JSONB,
    tips JSONB,
    generated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_interview_prep_user ON interview_preparations(user_id);

-- Weekly Reports Table
CREATE TABLE weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE,
    applications_sent INTEGER DEFAULT 0,
    responses_received INTEGER DEFAULT 0,
    interviews_scheduled INTEGER DEFAULT 0,
    jobs_viewed INTEGER DEFAULT 0,
    profile_views INTEGER DEFAULT 0,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_weekly_reports_user_date ON weekly_reports(user_id, week_start_date);

-- Activity Log (для аудита)
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100),
    resource_type VARCHAR(100),
    resource_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id, created_at);
CREATE INDEX idx_activity_logs_action ON activity_logs(action, created_at);
```

**Database Optimization:**
- Connection pooling (PgBouncer)
- Read replicas для тяжелых read-операций
- Partitioning для activity_logs (по времени)
- Materialized views для аналитики
- Регулярный VACUUM и ANALYZE

#### 4.2. Redis (Cache + Queue)

**Использование:**

**Cache Patterns:**
```typescript
// User session cache
`session:${userId}` → TTL: 24h

// AI response cache
`ai:resume:${userId}:${templateId}:${hash(profile)}` → TTL: 24h

// Job recommendations cache
`jobs:recommendations:${userId}` → TTL: 1h

// Rate limiting
`rate:${userId}:${endpoint}` → TTL: 1min

// Feature flags
`feature:${flagName}` → TTL: 5min
```

**Queue Patterns (BullMQ):**
```typescript
// Job queues
- resume-generation-queue
- cover-letter-queue
- job-scraping-queue
- email-notification-queue
- weekly-report-queue
- auto-apply-queue
```

#### 4.3. Object Storage (S3 / CloudFlare R2)

**Bucket Structure:**
```
careermate-storage/
├── resumes/
│   ├── {userId}/
│   │   ├── {resumeId}_v1.pdf
│   │   └── {resumeId}_v2.pdf
├── cover-letters/
│   └── {userId}/
│       └── {letterId}.pdf
├── user-uploads/
│   └── {userId}/
│       ├── profile-photo.jpg
│       └── certificates/
└── company-logos/
    └── {companyId}.png
```

**CDN Configuration:**
- CloudFront / Cloudflare CDN перед S3
- Signed URLs для приватных документов
- Automatic HTTPS
- Compression (gzip/brotli)

---

### 5. Background Workers

**Worker Architecture:**

```typescript
// workers/resume-generator.worker.ts
@Processor('resume-generation-queue')
export class ResumeGeneratorWorker {
  @Process()
  async generateResume(job: Job<ResumeGenerationJobData>) {
    const { userId, templateId, jobId } = job.data;
    
    // 1. Fetch user profile
    // 2. Fetch job requirements (if provided)
    // 3. Generate resume content via AI
    // 4. Generate PDF via Puppeteer
    // 5. Upload to S3
    // 6. Update DB with URL
    // 7. Send notification
    
    await job.updateProgress(100);
  }
}
```

**Worker Types:**

1. **Resume Generator Worker**
   - Приоритет: High
   - Concurrency: 5
   - Timeout: 60s

2. **Job Scraper Worker**
   - Приоритет: Medium
   - Concurrency: 10
   - Cron: Every 4 hours
   - Tasks: Parse HH.ru, LinkedIn, Indeed APIs

3. **Auto-Apply Worker**
   - Приоритет: High
   - Concurrency: 3
   - Rate limits: 10 applications/hour per user
   - Retry: 3 attempts with exponential backoff

4. **Email Notification Worker**
   - Приоритет: Low
   - Concurrency: 20
   - Batch processing

5. **Weekly Report Generator**
   - Приоритет: Low
   - Cron: Every Monday 9:00 AM
   - Generate reports for all active users

6. **Vector Embedding Worker**
   - Update Pinecone when profiles/jobs change
   - Batch processing: 100 items

---

### 6. External Integrations

#### 6.1. Job Boards APIs

**HH.ru API:**
```typescript
interface HHApiClient {
  searchVacancies(params: SearchParams): Promise<Vacancy[]>;
  getVacancyDetails(id: string): Promise<VacancyDetail>;
  applyToVacancy(vacancyId: string, resume: Resume): Promise<ApplicationResult>;
}
```

**Rate Limits:**
- HH.ru: 10 req/sec, 5000 req/day
- LinkedIn: 100 req/hour (unofficial API)
- Indeed: API access requires partnership

**Strategy:**
- Caching агрессивный (6-12 часов)
- Incremental updates вместо full refresh
- Webhook subscriptions где возможно
- Fallback на web scraping при ограничениях API

#### 6.2. Email Service (SendGrid / AWS SES)

**Email Types:**
```typescript
enum EmailTemplate {
  WELCOME = 'welcome',
  EMAIL_VERIFICATION = 'verify-email',
  PASSWORD_RESET = 'password-reset',
  WEEKLY_REPORT = 'weekly-report',
  JOB_RECOMMENDATION = 'job-recommendation',
  APPLICATION_STATUS = 'application-status',
  INTERVIEW_REMINDER = 'interview-reminder',
  SUBSCRIPTION_EXPIRING = 'subscription-expiring',
}
```

**Best Practices:**
- Transactional emails через SendGrid
- Bulk emails через AWS SES (cheaper)
- Unsubscribe links в каждом письме
- Email tracking (opens, clicks)
- A/B testing subject lines

#### 6.3. PDF Generation (Puppeteer)

```typescript
// services/pdf-generator.service.ts
export class PdfGeneratorService {
  async generateResumePdf(
    resumeData: ResumeData,
    templateId: string
  ): Promise<Buffer> {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    const html = this.renderTemplate(resumeData, templateId);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });
    
    await browser.close();
    return pdf;
  }
}
```

**Optimization:**
- Reuse browser instances (pool)
- Template pre-compilation
- Async generation in queue
- Cache generated PDFs

---

## 🚀 Масштабирование и производительность

### Horizontal Scaling Strategy

**Current (MVP):**
```
1x Next.js instance (Vercel)
1x NestJS instance (Railway)
1x PostgreSQL (Managed)
1x Redis (Managed)
```

**Scale to 10K users:**
```
3x Next.js instances (auto-scale)
3x NestJS instances
1x PostgreSQL Primary + 1x Read Replica
2x Redis instances (master-slave)
```

**Scale to 100K users:**
```
10x Next.js instances (auto-scale)
10x NestJS instances (behind LB)
1x PostgreSQL Primary + 3x Read Replicas
Redis Cluster (3 masters, 3 replicas)
CDN for all static assets
Separate AI service (FastAPI) with GPU instances
```

**Scale to 1M users:**
```
Auto-scaling groups (10-100 instances)
Database sharding by user_id
Multi-region deployment
Kafka for event streaming
Elasticsearch for job search
Separate microservices:
  - Auth Service
  - Profile Service
  - Resume Service
  - Job Service
  - AI Service (multiple instances)
```

### Caching Strategy (Multi-Layer)

```
┌──────────────────────────────────────┐
│   L1: Browser Cache (Service Worker) │
│   TTL: 24h, Size: 50MB               │
└──────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│   L2: CDN Cache (Cloudflare)         │
│   TTL: 1h-24h, Global                │
└──────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│   L3: Application Cache (Redis)      │
│   TTL: 5min-1h, Hot data             │
└──────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│   L4: Database Query Cache           │
│   TTL: Variable                      │
└──────────────────────────────────────┘
```

**Cache Invalidation Strategy:**
- Write-through для критичных данных
- TTL-based для статических данных
- Event-based для user profile changes
- Cache stampede prevention (lock pattern)

### Database Optimization

**Query Optimization:**
```sql
-- Bad: Sequential scan
SELECT * FROM jobs WHERE title LIKE '%developer%';

-- Good: Full-text search with index
SELECT * FROM jobs WHERE to_tsvector('english', title) @@ to_tsquery('developer');
CREATE INDEX idx_jobs_title_fts ON jobs USING GIN(to_tsvector('english', title));
```

**Read/Write Splitting:**
```typescript
// Write to primary
await prisma.$transaction(async (tx) => {
  await tx.user.create({ data: userData });
});

// Read from replica
await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;
```

**Connection Pooling:**
```typescript
// Prisma configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 20
}
```

### AI Performance Optimization

**1. Batch Processing**
```typescript
// Process 10 resume generations in parallel
const results = await Promise.allSettled(
  resumes.map(resume => aiService.generateResume(resume))
);
```

**2. Prompt Caching**
```typescript
// Cache common prompt patterns
const cacheKey = `prompt:${hash(systemPrompt + userContext)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

**3. Streaming Responses**
```typescript
// For long AI responses, stream to user
async function* streamAiResponse(prompt: string) {
  const stream = await aiService.streamGenerate(prompt);
  for await (const chunk of stream) {
    yield chunk;
  }
}
```

**4. Token Optimization**
```typescript
// Reduce token usage
- Compress context
- Use shorter prompts
- Implement semantic caching
- Use smaller models for simple tasks
```

---

## 🔒 Безопасность

### Authentication & Authorization

**JWT Strategy:**
```typescript
// Access token: 15 min
// Refresh token: 7 days
// Stored in httpOnly cookies

interface JWTPayload {
  sub: string;  // user_id
  email: string;
  role: 'user' | 'admin';
  tier: 'free' | 'premium';
  iat: number;
  exp: number;
}
```

**OAuth2 Integration:**
- Google OAuth
- LinkedIn OAuth
- GitHub OAuth

**Password Security:**
- bcrypt with salt rounds = 12
- Password complexity requirements
- Password reset with time-limited tokens
- Rate limiting на login attempts

### API Security

**Rate Limiting:**
```typescript
// По user_id
@UseGuards(ThrottlerGuard)
@Throttle(100, 60) // 100 requests per 60 seconds
async getJobs() {}

// По IP для анонимных
@Throttle(10, 60)
async register() {}

// Adaptive rate limiting для AI endpoints
async generateResume() {
  // Free tier: 5 per day
  // Premium: unlimited
}
```

**Input Validation:**
```typescript
// DTO validation with class-validator
export class CreateProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsEmail()
  email: string;

  @IsInt()
  @Min(0)
  @Max(50)
  experienceYears: number;

  @IsArray()
  @ArrayMaxSize(20)
  skills: string[];
}
```

**XSS Prevention:**
- Sanitize all user inputs (DOMPurify)
- Content Security Policy headers
- HttpOnly cookies для tokens

**SQL Injection Prevention:**
- Prisma ORM (parameterized queries)
- Never use raw SQL with user input

**CSRF Protection:**
- CSRF tokens для state-changing operations
- SameSite cookie attribute

### Data Privacy (GDPR Compliance)

**Data Classification:**
- **PII (Personally Identifiable Information):**
  - Email, phone, name, address
  - Encrypted at rest
  - Encrypted in transit (TLS 1.3)
  
- **Resume Data:**
  - Considered sensitive
  - User owns data
  - Right to delete (30 days)
  
- **Analytics Data:**
  - Anonymized
  - Aggregated

**Privacy Controls:**
```typescript
// User rights implementation
- Right to access (export all data)
- Right to delete (hard delete after 30 days)
- Right to portability (JSON/PDF export)
- Right to rectification (edit profile)
- Consent management (cookie banner)
```

**Data Retention:**
```typescript
// Automated cleanup
- Inactive accounts: 2 years → soft delete
- Deleted accounts: 30 days → hard delete
- Activity logs: 90 days → archive
- Generated PDFs: 1 year → delete
```

---

## 📊 Мониторинг и Observability

### Monitoring Stack

**1. Application Monitoring (Sentry)**
- Error tracking
- Performance monitoring
- Release tracking
- User feedback

**2. Infrastructure Monitoring (Datadog)**
- Server metrics (CPU, RAM, Disk)
- Database metrics (connections, queries, slow logs)
- Redis metrics (memory, hit rate)
- Custom business metrics

**3. Logs (ELK / Loki)**
```typescript
// Structured logging
logger.info('Resume generated', {
  userId,
  resumeId,
  templateId,
  generationTime: 1234, // ms
  tokenCount: 567,
  cost: 0.05, // USD
});
```

**4. Traces (Jaeger / Tempo)**
- Distributed tracing для API calls
- AI service latency tracking
- Database query performance

**5. Metrics (Prometheus + Grafana)**

**Key Metrics:**

**Business Metrics:**
```
- Active users (DAU, WAU, MAU)
- Conversion rate (free → paid)
- Churn rate
- LTV (Lifetime Value)
- CAC (Customer Acquisition Cost)
- ARPU (Average Revenue Per User)
```

**Product Metrics:**
```
- Resume generation success rate
- Average time to first job application
- Application response rate
- Interview booking rate
- Offer acceptance rate
- User satisfaction (NPS)
```

**Technical Metrics:**
```
- API latency (p50, p95, p99)
- Error rate (%)
- Uptime (%)
- AI generation time
- Database query time
- Cache hit rate
- Queue processing time
- Job scraping success rate
```

### Alerting Rules

**Critical Alerts (PagerDuty):**
```yaml
- API error rate > 5% for 5 min
- Database connection pool exhausted
- Payment processing failed
- AI service down
- Uptime < 99.9%
```

**Warning Alerts (Slack):**
```yaml
- API latency p95 > 1000ms
- Cache hit rate < 80%
- Queue backlog > 1000 jobs
- Disk usage > 80%
- AI cost spike > 2x normal
```

### Health Checks

```typescript
// /health endpoint
{
  status: 'healthy',
  timestamp: '2025-10-24T10:00:00Z',
  version: '1.2.3',
  checks: {
    database: { status: 'up', latency: 12 },
    redis: { status: 'up', latency: 3 },
    aiService: { status: 'up', latency: 245 },
    jobBoards: { status: 'degraded', latency: 1500 },
  }
}
```

---

## 🧪 Testing Strategy

### Testing Pyramid

```
        /\
       /  \
      / E2E \          10% - End-to-End Tests
     /______\
    /        \
   /Integration\       30% - Integration Tests
  /____________\
 /              \
/  Unit Tests    \     60% - Unit Tests
/__________________\
```

**Unit Tests (Jest):**
```typescript
// services/ai.service.spec.ts
describe('AIService', () => {
  it('should generate resume successfully', async () => {
    const result = await aiService.generateResume(mockProfile);
    expect(result).toHaveProperty('content');
    expect(result.content.length).toBeGreaterThan(0);
  });
  
  it('should handle AI service timeout', async () => {
    jest.spyOn(aiService, 'callLLM').mockRejectedValue(new TimeoutError());
    await expect(aiService.generateResume(mockProfile))
      .rejects.toThrow(TimeoutError);
  });
});
```

**Integration Tests:**
```typescript
// tests/integration/resume-generation.spec.ts
describe('Resume Generation Flow', () => {
  it('should create resume and upload to S3', async () => {
    const user = await createTestUser();
    const profile = await createTestProfile(user.id);
    
    const response = await request(app.getHttpServer())
      .post('/api/v1/resumes/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ templateId: 'modern' })
      .expect(201);
    
    expect(response.body).toHaveProperty('resumeId');
    expect(response.body.pdfUrl).toContain('https://cdn.');
  });
});
```

**E2E Tests (Playwright):**
```typescript
// tests/e2e/job-application.spec.ts
test('User can apply to job successfully', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'password123');
  await page.click('button[type=submit]');
  
  await page.goto('/jobs');
  await page.click('.job-card:first-child');
  await page.click('button:has-text("Apply")');
  
  await expect(page.locator('.success-message')).toBeVisible();
});
```

**Load Testing (k6):**
```javascript
// load-tests/ai-generation.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% under 2s
    http_req_failed: ['rate<0.01'],    // <1% errors
  },
};

export default function () {
  const payload = JSON.stringify({ templateId: 'modern' });
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.API_TOKEN}`,
    },
  };
  
  let res = http.post('https://api.careermate.com/v1/resumes/generate', payload, params);
  
  check(res, {
    'status is 201': (r) => r.status === 201,
    'resume generated': (r) => JSON.parse(r.body).resumeId,
  });
  
  sleep(1);
}
```

---

## 💰 Cost Estimation (6 месяцев)

### Infrastructure Costs

**MVP (0-1000 users):**
```
Vercel (Next.js hosting)         $0-20/month
Railway (NestJS + PostgreSQL)    $20/month
Redis Cloud                      $0 (free tier)
Pinecone (Vector DB)             $70/month
S3 / R2 Storage                  $5/month
SendGrid                         $0-15/month (400 emails/day free)
AI API costs                     $100-300/month
--------------------------------------------------
Total:                           $195-430/month
```

**Growth (1K-10K users):**
```
Vercel Pro                       $20/month
Railway Pro                      $50/month
Redis Cloud                      $30/month
Pinecone                         $200/month
S3 / R2 Storage                  $20/month
SendGrid                         $50/month
AI API costs                     $500-1000/month
Monitoring (Sentry + Datadog)    $100/month
--------------------------------------------------
Total:                           $970-1,470/month
```

**Scale (10K-100K users):**
```
Vercel Enterprise                $2,000/month
Railway / AWS                    $500/month
Redis Enterprise                 $200/month
Pinecone                         $1,000/month
S3 / R2 + CDN                    $200/month
SendGrid                         $300/month
AI API costs                     $3,000-5,000/month
Monitoring                       $500/month
--------------------------------------------------
Total:                           $7,700-9,700/month
```

### AI Cost Optimization

**Token Usage Estimation:**
- Resume generation: ~2,000 tokens per request
- Cover letter: ~1,000 tokens
- Career path analysis: ~3,000 tokens
- Job matching: ~500 tokens per search

**Monthly AI costs per user (premium):**
```
Resume: 4 generations × $0.04 = $0.16
Cover letters: 10 × $0.02 = $0.20
Career analysis: 2 × $0.06 = $0.12
Job matching: 60 searches × $0.01 = $0.60
--------------------------------------------------
Total per premium user: ~$1.08/month
```

**Break-even at $25/month subscription:**
- Gross margin: ~96% (AI costs only)
- Need ~1,000 premium users to cover all infrastructure

---

## 🚀 Deployment Strategy

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run test:e2e

  build-and-deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  build-and-deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t careermate-api .
      - name: Deploy to Railway
        run: railway up
```

### Environment Strategy

```
Development  →  Staging  →  Production
   (local)       (auto)      (manual)
```

**Environment Variables:**
```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
PINECONE_API_KEY=...
AI_MODEL_ENDPOINT=https://...
AI_MODEL_API_KEY=...
S3_BUCKET=careermate-prod
SENDGRID_API_KEY=...
SENTRY_DSN=...
NEXT_PUBLIC_API_URL=https://api.careermate.com
```

### Blue-Green Deployment

```
┌─────────────┐
│ Load Balancer│
└──────┬──────┘
       │
   ┌───┴────┐
   │        │
┌──▼──┐  ┌──▼──┐
│Blue │  │Green│
│(old)│  │(new)│
└─────┘  └─────┘

1. Deploy to Green
2. Run smoke tests
3. Switch traffic: Blue → Green
4. Monitor for 10 min
5. If OK: keep Green, shutdown Blue
6. If errors: rollback to Blue
```

### Rollback Strategy

```typescript
// Quick rollback via environment variable
if (process.env.EMERGENCY_FALLBACK === 'true') {
  // Use previous model version
  // Disable new features
  // Use cached responses
}
```

---

## 🔮 Будущие улучшения (Roadmap)

### Phase 1 (Месяцы 1-6): MVP
✅ Базовая регистрация и профиль  
✅ AI анализ опыта  
✅ Генерация резюме (1 стиль)  
✅ Подбор вакансий (manual)  
✅ Таблица откликов  

### Phase 2 (Месяцы 7-12): Growth
- [ ] Автоматические отклики (полуавтомат)
- [ ] 5+ стилей резюме
- [ ] Интеграция LinkedIn API
- [ ] Подготовка к интервью (расширенная)
- [ ] Mobile app (React Native)
- [ ] Платежи (Stripe)
- [ ] Реферальная программа

### Phase 3 (12-18 месяцев): Scale
- [ ] AI Mock Interview (voice)
- [ ] Salary negotiation assistant
- [ ] Career coaching (1-on-1)
- [ ] Company culture match scoring
- [ ] Skills gap analysis + course recommendations
- [ ] Multi-language support
- [ ] Enterprise B2B version

### Phase 4 (18-24 месяца): Advanced
- [ ] AI Video interview practice
- [ ] Networking suggestions (warm introductions)
- [ ] Career trajectory prediction
- [ ] Industry trend analysis
- [ ] Skill certification platform
- [ ] Job market insights dashboard
- [ ] API for third-party integrations

---

## 🎯 Критические риски и митигация

### Технические риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| AI API недоступен | Средняя | Высокое | Fallback модель, cache, graceful degradation |
| Job boards блокируют scraping | Высокая | Среднее | Официальные API, rate limiting, rotate IPs |
| Database перегрузка | Средняя | Высокое | Read replicas, connection pooling, caching |
| Высокая latency AI | Высокая | Среднее | Streaming, caching, optimize prompts |
| GDPR нарушения | Низкая | Критическое | Compliance checklist, legal review, audit logs |

### Бизнес риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Низкий conversion free→paid | Средняя | Высокое | A/B testing, value proposition, freemium limits |
| Конкуренты с большим бюджетом | Высокая | Среднее | Niche focus, AI quality, community |
| Пользователи не доверяют AI | Средняя | Среднее | Transparency, human review option, testimonials |
| Регуляторные ограничения | Низкая | Высокое | Legal monitoring, compliance-first approach |

---

## 📈 Key Performance Indicators (KPIs)

### Technical KPIs
- **Uptime:** >99.9%
- **API Latency (p95):** <500ms
- **AI Generation Time (p95):** <3s
- **Error Rate:** <0.1%
- **Cache Hit Rate:** >80%

### Product KPIs
- **User Activation:** >60% (complete profile)
- **Weekly Active Users:** >30% of registered
- **Resume Generation Success:** >95%
- **Time to First Application:** <24 hours
- **Application Response Rate:** >15%

### Business KPIs
- **MRR Growth:** >20% MoM
- **CAC:** <$50
- **LTV:** >$300
- **Churn:** <5% monthly
- **NPS:** >50

---

## ✅ Чеклист для запуска MVP

### Неделя 1-2: Инфраструктура
- [ ] Setup Next.js project
- [ ] Setup NestJS project
- [ ] Configure PostgreSQL + Prisma
- [ ] Setup Redis
- [ ] Configure Vercel deployment
- [ ] Configure Railway deployment
- [ ] Setup CI/CD pipeline
- [ ] Configure Sentry

### Неделя 3-4: Authentication
- [ ] JWT implementation
- [ ] OAuth (Google, LinkedIn)
- [ ] Password reset flow
- [ ] Email verification
- [ ] Rate limiting

### Неделя 5-6: User Profile
- [ ] Profile creation form
- [ ] Skills management
- [ ] Experience management
- [ ] Education management
- [ ] Profile validation

### Неделя 7-10: AI Integration
- [ ] Connect to your LLM
- [ ] Implement LangChain
- [ ] Setup Pinecone
- [ ] Profile analysis chain
- [ ] Career path generation
- [ ] Caching strategy

### Неделя 11-14: Resume Generation
- [ ] Resume data model
- [ ] AI content generation
- [ ] PDF generation (Puppeteer)
- [ ] Template system (1 style)
- [ ] S3 upload
- [ ] Background job processing

### Неделя 15-18: Job Matching
- [ ] Job scraper (HH.ru)
- [ ] Job database schema
- [ ] Vector embeddings
- [ ] Semantic search
- [ ] Recommendation algorithm
- [ ] Job listing UI

### Неделя 19-22: Applications
- [ ] Application tracking
- [ ] Cover letter generation
- [ ] Application status updates
- [ ] Application history
- [ ] Weekly reports

### Неделя 23-24: Testing & Launch
- [ ] Integration tests
- [ ] E2E tests
- [ ] Load testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Beta user testing
- [ ] Launch! 🚀

---

## 🎓 Lessons from Big Tech

### From Google
- **Design for 10x scale from day 1**
- Monitoring is not optional, it's a feature
- Degrade gracefully (circuit breakers)
- Measure everything

### From Netflix
- **Chaos Engineering**: Randomly kill services to test resilience
- Feature flags for gradual rollouts
- Personalization is king
- A/B test everything

### From Amazon
- **Two-pizza teams**: Small autonomous teams
- API-first design
- Customer obsession
- Work backwards from customer needs

### Applied to CareerMate
- Start small, but architecture should support 10x growth
- Implement monitoring from day 1
- Use feature flags for all major features
- A/B test resume templates, prompts, UI
- Keep teams small (2-4 people per module)
- User feedback loops at every stage

---

## 📚 Полезные ресурсы

### System Design
- "Designing Data-Intensive Applications" - Martin Kleppmann
- "System Design Interview" - Alex Xu
- ByteByteGo YouTube channel

### AI/LLM
- LangChain documentation
- OpenAI Cookbook
- Pinecone blog

### Next.js
- Next.js documentation
- Lee Robinson's blog
- Vercel examples

### NestJS
- NestJS documentation
- Official courses
- Community Discord

---

## 🏁 Заключение

CareerMate имеет все шансы стать успешным продуктом при правильной реализации архитектуры. Ключевые преимущества этого дизайна:

1. **Масштабируемость**: Архитектура готова к росту от 100 до 100K+ пользователей
2. **Производительность**: Multi-layer caching, async processing, optimized AI calls
3. **Надежность**: Error handling, circuit breakers, monitoring
4. **Безопасность**: GDPR compliance, secure auth, rate limiting
5. **Стоимость**: Оптимизирован для минимальных затрат на MVP

**Рекомендации по приоритетам:**
1. Сначала MVP с базовым функционалом (6 месяцев)
2. Валидация на реальных пользователях
3. Итеративное улучшение на основе метрик
4. Постепенное масштабирование под рост

Успехов с запуском! 🚀
