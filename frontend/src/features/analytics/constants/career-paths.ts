import type { Domain, DimensionScores } from './career-questions'

export interface CareerPath {
  id: string
  role: string
  domain: Domain
  dimensionProfile: DimensionScores
  salaryRange: string
  description: string
}

export const CAREER_PATHS: CareerPath[] = [
  // ─── IT ───────────────────────────────────────────────────────────────────
  {
    id: 'frontend-dev', role: 'Frontend Developer', domain: 'it',
    dimensionProfile: { analytical: 3, technical: 5, social: 2, creative: 5, leadership: 1, structured: 3 },
    salaryRange: '120 000 — 280 000 ₽',
    description: 'Разрабатываете пользовательские интерфейсы, работаете с React/Vue/Angular и заботитесь о качестве UX.',
  },
  {
    id: 'backend-dev', role: 'Backend Developer', domain: 'it',
    dimensionProfile: { analytical: 5, technical: 5, social: 1, creative: 2, leadership: 2, structured: 4 },
    salaryRange: '150 000 — 350 000 ₽',
    description: 'Создаёте серверную логику, API и базы данных. Работаете с производительностью и надёжностью систем.',
  },
  {
    id: 'fullstack-dev', role: 'Full-Stack Developer', domain: 'it',
    dimensionProfile: { analytical: 4, technical: 5, social: 2, creative: 3, leadership: 2, structured: 3 },
    salaryRange: '140 000 — 320 000 ₽',
    description: 'Работаете одновременно с фронтендом и бэкендом, можете реализовать фичу от начала до конца.',
  },
  {
    id: 'mobile-dev', role: 'Mobile Developer', domain: 'it',
    dimensionProfile: { analytical: 3, technical: 5, social: 2, creative: 4, leadership: 1, structured: 3 },
    salaryRange: '140 000 — 300 000 ₽',
    description: 'Создаёте нативные или кроссплатформенные мобильные приложения для iOS и Android.',
  },
  {
    id: 'devops', role: 'DevOps/SRE Engineer', domain: 'it',
    dimensionProfile: { analytical: 4, technical: 5, social: 2, creative: 2, leadership: 3, structured: 5 },
    salaryRange: '160 000 — 380 000 ₽',
    description: 'Обеспечиваете инфраструктуру, CI/CD, мониторинг и надёжность продакшен-систем.',
  },
  {
    id: 'data-scientist', role: 'Data Scientist', domain: 'it',
    dimensionProfile: { analytical: 5, technical: 4, social: 1, creative: 3, leadership: 2, structured: 3 },
    salaryRange: '180 000 — 400 000 ₽',
    description: 'Строите ML-модели, анализируете данные и помогаете бизнесу принимать решения на основе данных.',
  },
  {
    id: 'ml-engineer', role: 'ML Engineer', domain: 'it',
    dimensionProfile: { analytical: 5, technical: 5, social: 1, creative: 3, leadership: 2, structured: 3 },
    salaryRange: '200 000 — 450 000 ₽',
    description: 'Переводите ML-модели в продакшен: разрабатываете пайплайны, оптимизируете, деплоите.',
  },
  {
    id: 'data-analyst', role: 'Data Analyst', domain: 'it',
    dimensionProfile: { analytical: 5, technical: 3, social: 2, creative: 2, leadership: 2, structured: 4 },
    salaryRange: '100 000 — 220 000 ₽',
    description: 'Анализируете данные, строите дашборды, формулируете бизнес-инсайты для принятия решений.',
  },
  {
    id: 'qa-engineer', role: 'QA Engineer', domain: 'it',
    dimensionProfile: { analytical: 4, technical: 4, social: 2, creative: 2, leadership: 2, structured: 5 },
    salaryRange: '100 000 — 230 000 ₽',
    description: 'Тестируете ПО, автоматизируете проверки, гарантируете качество продукта.',
  },
  {
    id: 'security-engineer', role: 'Security Engineer', domain: 'it',
    dimensionProfile: { analytical: 5, technical: 5, social: 1, creative: 2, leadership: 2, structured: 4 },
    salaryRange: '160 000 — 380 000 ₽',
    description: 'Защищаете системы от угроз, проводите пентесты, выстраиваете политики безопасности.',
  },
  {
    id: 'solutions-architect', role: 'Solutions Architect', domain: 'it',
    dimensionProfile: { analytical: 5, technical: 5, social: 3, creative: 3, leadership: 4, structured: 4 },
    salaryRange: '250 000 — 600 000 ₽',
    description: 'Проектируете архитектуру крупных систем, принимаете технические решения на уровне всей компании.',
  },
  {
    id: 'product-manager', role: 'Product Manager', domain: 'it',
    dimensionProfile: { analytical: 4, technical: 2, social: 5, creative: 4, leadership: 5, structured: 3 },
    salaryRange: '150 000 — 380 000 ₽',
    description: 'Определяете vision продукта, работаете с командой разработки и бизнесом, расставляете приоритеты.',
  },
  {
    id: 'ux-designer', role: 'UX/UI Designer', domain: 'it',
    dimensionProfile: { analytical: 2, technical: 2, social: 4, creative: 5, leadership: 1, structured: 3 },
    salaryRange: '100 000 — 260 000 ₽',
    description: 'Проектируете пользовательский опыт и интерфейсы, работаете с исследованиями и прототипированием.',
  },
  {
    id: 'tech-lead', role: 'Tech Lead / CTO', domain: 'it',
    dimensionProfile: { analytical: 4, technical: 4, social: 3, creative: 2, leadership: 5, structured: 3 },
    salaryRange: '280 000 — 700 000 ₽',
    description: 'Ведёте техническое направление, принимаете ключевые решения, развиваете инженерную команду.',
  },
  {
    id: 'it-business-analyst', role: 'Business Analyst (IT)', domain: 'it',
    dimensionProfile: { analytical: 5, technical: 2, social: 4, creative: 2, leadership: 3, structured: 4 },
    salaryRange: '100 000 — 240 000 ₽',
    description: 'Переводите бизнес-требования в технические задачи, связываете бизнес и разработку.',
  },

  // ─── Finance ──────────────────────────────────────────────────────────────
  {
    id: 'financial-analyst', role: 'Financial Analyst', domain: 'finance',
    dimensionProfile: { analytical: 5, technical: 2, social: 2, creative: 2, leadership: 2, structured: 5 },
    salaryRange: '90 000 — 220 000 ₽',
    description: 'Анализируете финансовые показатели, строите модели, готовите прогнозы для бизнеса.',
  },
  {
    id: 'accountant', role: 'Бухгалтер / Главбух', domain: 'finance',
    dimensionProfile: { analytical: 4, technical: 1, social: 2, creative: 1, leadership: 2, structured: 5 },
    salaryRange: '70 000 — 180 000 ₽',
    description: 'Ведёте бухгалтерский и налоговый учёт, контролируете финансовые операции.',
  },
  {
    id: 'auditor', role: 'Аудитор', domain: 'finance',
    dimensionProfile: { analytical: 5, technical: 1, social: 3, creative: 1, leadership: 2, structured: 5 },
    salaryRange: '100 000 — 250 000 ₽',
    description: 'Проверяете финансовую отчётность, выявляете риски и несоответствия.',
  },
  {
    id: 'investment-analyst', role: 'Investment Analyst', domain: 'finance',
    dimensionProfile: { analytical: 5, technical: 3, social: 2, creative: 3, leadership: 3, structured: 4 },
    salaryRange: '120 000 — 350 000 ₽',
    description: 'Оцениваете инвестиционные возможности, строите DCF-модели, поддерживаете принятие решений по вложениям.',
  },
  {
    id: 'risk-manager', role: 'Risk Manager', domain: 'finance',
    dimensionProfile: { analytical: 5, technical: 2, social: 3, creative: 2, leadership: 3, structured: 5 },
    salaryRange: '110 000 — 280 000 ₽',
    description: 'Идентифицируете и управляете финансовыми, операционными и регуляторными рисками.',
  },

  // ─── Marketing ────────────────────────────────────────────────────────────
  {
    id: 'marketing-manager', role: 'Marketing Manager', domain: 'marketing',
    dimensionProfile: { analytical: 3, technical: 2, social: 5, creative: 4, leadership: 4, structured: 3 },
    salaryRange: '90 000 — 250 000 ₽',
    description: 'Разрабатываете и реализуете маркетинговую стратегию, управляете каналами продвижения.',
  },
  {
    id: 'smm', role: 'SMM-специалист', domain: 'marketing',
    dimensionProfile: { analytical: 2, technical: 2, social: 5, creative: 5, leadership: 2, structured: 3 },
    salaryRange: '60 000 — 160 000 ₽',
    description: 'Создаёте контент для соцсетей, развиваете сообщество и повышаете вовлечённость аудитории.',
  },
  {
    id: 'growth-hacker', role: 'Growth Hacker', domain: 'marketing',
    dimensionProfile: { analytical: 4, technical: 3, social: 3, creative: 5, leadership: 3, structured: 3 },
    salaryRange: '100 000 — 280 000 ₽',
    description: 'Находите нестандартные способы роста продукта, тестируете гипотезы и масштабируете успешные.',
  },
  {
    id: 'content-creator', role: 'Копирайтер / Контент-мейкер', domain: 'marketing',
    dimensionProfile: { analytical: 2, technical: 2, social: 4, creative: 5, leadership: 2, structured: 3 },
    salaryRange: '60 000 — 180 000 ₽',
    description: 'Создаёте тексты, видео или подкасты, которые привлекают и удерживают аудиторию.',
  },

  // ─── Management ───────────────────────────────────────────────────────────
  {
    id: 'project-manager', role: 'Project Manager', domain: 'management',
    dimensionProfile: { analytical: 4, technical: 2, social: 4, creative: 2, leadership: 5, structured: 5 },
    salaryRange: '100 000 — 280 000 ₽',
    description: 'Управляете проектами: сроками, бюджетом, командой и стейкхолдерами.',
  },
  {
    id: 'operations-manager', role: 'Operations Manager', domain: 'management',
    dimensionProfile: { analytical: 4, technical: 2, social: 4, creative: 2, leadership: 5, structured: 5 },
    salaryRange: '100 000 — 260 000 ₽',
    description: 'Оптимизируете бизнес-процессы и обеспечиваете операционную эффективность компании.',
  },
  {
    id: 'consultant', role: 'Management Consultant', domain: 'management',
    dimensionProfile: { analytical: 5, technical: 2, social: 4, creative: 3, leadership: 4, structured: 4 },
    salaryRange: '120 000 — 400 000 ₽',
    description: 'Помогаете компаниям решать стратегические проблемы, проводите диагностику и предлагаете решения.',
  },
  {
    id: 'entrepreneur', role: 'Предприниматель', domain: 'management',
    dimensionProfile: { analytical: 3, technical: 2, social: 4, creative: 5, leadership: 5, structured: 2 },
    salaryRange: 'Варьируется',
    description: 'Создаёте собственный бизнес, берёте на себя риски и выстраиваете команду и продукт с нуля.',
  },

  // ─── HR/Agile ─────────────────────────────────────────────────────────────
  {
    id: 'hr-manager', role: 'HR Manager', domain: 'management',
    dimensionProfile: { analytical: 3, technical: 1, social: 5, creative: 3, leadership: 4, structured: 4 },
    salaryRange: '80 000 — 200 000 ₽',
    description: 'Занимаетесь подбором, адаптацией и развитием сотрудников, выстраиваете HR-процессы.',
  },
  {
    id: 'scrum-master', role: 'Scrum Master / Agile Coach', domain: 'management',
    dimensionProfile: { analytical: 3, technical: 2, social: 5, creative: 3, leadership: 4, structured: 4 },
    salaryRange: '100 000 — 260 000 ₽',
    description: 'Помогаете командам работать эффективно по гибким методологиям, устраняете препятствия.',
  },
]
