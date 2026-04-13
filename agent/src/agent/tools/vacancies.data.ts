/**
 * Захардкоженная база вакансий для PoC (без внешних API!)
 * В будущем можно заменить на реальный источник данных
 */
export interface RawVacancy {
    id: string;
    title: string;
    company: string;
    location?: string;
    salary?: { min?: number; max?: number; currency?: string };
    requiredSkills: string[];
    description: string;
    level?: 'Junior' | 'Middle' | 'Senior' | 'Any';
}

export const VACANCIES_DATABASE: RawVacancy[] = [
    // Frontend
    {
        id: 'v001',
        title: 'Frontend Developer (React)',
        company: 'TechStart',
        location: 'Москва / Remote',
        salary: { min: 150000, max: 220000, currency: 'RUB' },
        requiredSkills: ['React', 'TypeScript', 'CSS', 'HTML', 'REST API'],
        description:
            'Разработка пользовательских интерфейсов для SaaS-платформы. Работа с React 18, TypeScript, интеграция с backend API.',
        level: 'Middle',
    },
    {
        id: 'v002',
        title: 'Senior Frontend Engineer',
        company: 'FinTech Corp',
        location: 'Санкт-Петербург / Remote',
        salary: { min: 280000, max: 380000, currency: 'RUB' },
        requiredSkills: [
            'React',
            'TypeScript',
            'Next.js',
            'Redux',
            'GraphQL',
            'Testing',
        ],
        description:
            'Лид фронтенд-разработки. Архитектура компонентного подхода, code review, наставничество Junior/Middle.',
        level: 'Senior',
    },
    {
        id: 'v003',
        title: 'Junior React Developer',
        company: 'Startup Hub',
        location: 'Remote',
        salary: { min: 80000, max: 120000, currency: 'RUB' },
        requiredSkills: ['React', 'JavaScript', 'HTML', 'CSS'],
        description:
            'Первая работа в продуктовой компании. Наставничество, задачи по UI, работа в небольшой команде.',
        level: 'Junior',
    },

    // Backend
    {
        id: 'v004',
        title: 'Backend Developer (Node.js)',
        company: 'DataFlow',
        location: 'Москва',
        salary: { min: 180000, max: 250000, currency: 'RUB' },
        requiredSkills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'REST API'],
        description:
            'Разработка микросервисов на NestJS. Проектирование API, работа с базами данных, интеграции.',
        level: 'Middle',
    },
    {
        id: 'v005',
        title: 'Senior Backend Engineer (Python)',
        company: 'AI Solutions',
        location: 'Remote',
        salary: { min: 300000, max: 450000, currency: 'RUB' },
        requiredSkills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Kubernetes'],
        description:
            'Разработка высоконагруженных систем. Проектирование архитектуры, оптимизация производительности.',
        level: 'Senior',
    },
    {
        id: 'v006',
        title: 'Go Developer',
        company: 'CloudBase',
        location: 'Москва / Remote',
        salary: { min: 220000, max: 320000, currency: 'RUB' },
        requiredSkills: ['Go', 'gRPC', 'PostgreSQL', 'Kafka', 'Docker'],
        description:
            'Разработка backend-сервисов на Go для облачной платформы. Работа с высоконагруженными системами.',
        level: 'Middle',
    },

    // Fullstack
    {
        id: 'v007',
        title: 'Fullstack Developer (React + Node.js)',
        company: 'ProductLab',
        location: 'Remote',
        salary: { min: 200000, max: 300000, currency: 'RUB' },
        requiredSkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
        description:
            'Полный цикл разработки продукта. От UI до API и базы данных. Небольшая команда, широкий стек.',
        level: 'Middle',
    },
    {
        id: 'v008',
        title: 'Fullstack Engineer (Next.js)',
        company: 'EdTech Platform',
        location: 'Remote',
        salary: { min: 160000, max: 240000, currency: 'RUB' },
        requiredSkills: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'React'],
        description:
            'Разработка образовательной платформы. Next.js App Router, серверные компоненты, интеграция с AI.',
        level: 'Middle',
    },

    // Data / ML
    {
        id: 'v009',
        title: 'ML Engineer',
        company: 'AiCore',
        location: 'Москва',
        salary: { min: 250000, max: 400000, currency: 'RUB' },
        requiredSkills: ['Python', 'PyTorch', 'ML', 'NLP', 'Docker', 'FastAPI'],
        description:
            'Разработка ML-пайплайнов, интеграция моделей в продакшн. Работа с NLP и компьютерным зрением.',
        level: 'Middle',
    },
    {
        id: 'v010',
        title: 'Data Engineer',
        company: 'Analytics Corp',
        location: 'Москва / Remote',
        salary: { min: 200000, max: 300000, currency: 'RUB' },
        requiredSkills: ['Python', 'Spark', 'Airflow', 'SQL', 'Kafka'],
        description:
            'Построение дата-пайплайнов, ETL-процессов. Работа с большими данными.',
        level: 'Middle',
    },

    // DevOps
    {
        id: 'v011',
        title: 'DevOps Engineer',
        company: 'InfraTeam',
        location: 'Remote',
        salary: { min: 200000, max: 320000, currency: 'RUB' },
        requiredSkills: ['Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux'],
        description:
            'Поддержка CI/CD пайплайнов, Kubernetes кластеров, автоматизация инфраструктуры.',
        level: 'Middle',
    },
    {
        id: 'v012',
        title: 'Platform Engineer (SRE)',
        company: 'BigScale',
        location: 'Москва',
        salary: { min: 350000, max: 500000, currency: 'RUB' },
        requiredSkills: [
            'Kubernetes',
            'Helm',
            'Terraform',
            'Prometheus',
            'Grafana',
            'Go',
        ],
        description:
            'Обеспечение надёжности платформы. SLO/SLI, incident management, capacity planning.',
        level: 'Senior',
    },

    // QA
    {
        id: 'v013',
        title: 'QA Engineer (Automation)',
        company: 'QualitySoft',
        location: 'Remote',
        salary: { min: 120000, max: 200000, currency: 'RUB' },
        requiredSkills: ['Python', 'Selenium', 'Playwright', 'API Testing', 'CI/CD'],
        description:
            'Автоматизация тестирования web-приложений. Написание тест-планов, интеграция в CI.',
        level: 'Middle',
    },

    // Mobile
    {
        id: 'v014',
        title: 'React Native Developer',
        company: 'MobileFirst',
        location: 'Remote',
        salary: { min: 180000, max: 280000, currency: 'RUB' },
        requiredSkills: ['React Native', 'TypeScript', 'React', 'Redux', 'Mobile'],
        description:
            'Разработка мобильных приложений под iOS и Android. Кроссплатформенная разработка.',
        level: 'Middle',
    },

    // Product / Hybrid
    {
        id: 'v015',
        title: 'Technical Lead',
        company: 'GrowthLab',
        location: 'Москва',
        salary: { min: 400000, max: 600000, currency: 'RUB' },
        requiredSkills: [
            'TypeScript',
            'Architecture',
            'Team Lead',
            'System Design',
            'Agile',
        ],
        description:
            'Технический лид команды из 5-8 разработчиков. Архитектурные решения, code review, планирование.',
        level: 'Senior',
    },

    // Security / Специфические
    {
        id: 'v016',
        title: 'Backend Developer (Java)',
        company: 'BankTech',
        location: 'Москва',
        salary: { min: 220000, max: 350000, currency: 'RUB' },
        requiredSkills: ['Java', 'Spring Boot', 'PostgreSQL', 'Kafka', 'Microservices'],
        description:
            'Разработка банковских систем. Высокие требования к надёжности и безопасности.',
        level: 'Middle',
    },
    {
        id: 'v017',
        title: 'Frontend Developer (Vue.js)',
        company: 'RetailOS',
        location: 'Remote',
        salary: { min: 140000, max: 210000, currency: 'RUB' },
        requiredSkills: ['Vue.js', 'TypeScript', 'Pinia', 'CSS', 'REST API'],
        description: 'Разработка интерфейсов для retail-платформы на Vue 3.',
        level: 'Middle',
    },
    {
        id: 'v018',
        title: 'AI Product Developer',
        company: 'NeuralStudio',
        location: 'Remote',
        salary: { min: 280000, max: 420000, currency: 'RUB' },
        requiredSkills: [
            'Python',
            'LangChain',
            'OpenAI API',
            'FastAPI',
            'TypeScript',
        ],
        description:
            'Разработка AI-фич: интеграция LLM, RAG-пайплайны, агентные системы.',
        level: 'Middle',
    },
    {
        id: 'v019',
        title: 'Backend Developer (NestJS)',
        company: 'SaaS Platform',
        location: 'Remote',
        salary: { min: 170000, max: 260000, currency: 'RUB' },
        requiredSkills: ['NestJS', 'TypeScript', 'PostgreSQL', 'Prisma', 'Redis'],
        description:
            'Разработка SaaS-платформы. NestJS, Prisma ORM, модульная архитектура.',
        level: 'Middle',
    },
    {
        id: 'v020',
        title: 'Software Engineer (C++)',
        company: 'SystemSoft',
        location: 'Москва',
        salary: { min: 250000, max: 400000, currency: 'RUB' },
        requiredSkills: ['C++', 'Linux', 'Multithreading', 'STL', 'Performance'],
        description:
            'Разработка системного ПО и высокопроизводительных приложений на C++17/20.',
        level: 'Middle',
    },
];
