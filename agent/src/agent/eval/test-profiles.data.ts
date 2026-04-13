import { ProfileData } from '../tools/analyze-profile.tool';

export const TEST_PROFILES: { name: string; data: ProfileData }[] = [
    {
        name: 'Junior React Dev',
        data: {
            fullName: 'Алексей Иванов',
            experienceYears: 1,
            skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git'],
            aboutMe: 'Студент последнего курса, ищу первую работу фронтендером. Делал пет-проекты на React.',
            desiredPosition: 'Junior Frontend Developer',
        },
    },
    {
        name: 'Middle Node.js Engineer',
        data: {
            fullName: 'Елена Смирнова',
            experienceYears: 3,
            skills: ['Node.js', 'TypeScript', 'NestJS', 'PostgreSQL', 'Docker'],
            workExperience: [
                {
                    company: 'FinTech Startup',
                    position: 'Backend Developer',
                    duration: '2 года',
                    description: 'Разработка микросервисов на NestJS, интеграция с платежными шлюзами. Оптимизация SQL запросов.',
                },
            ],
            desiredPosition: 'Middle Backend Developer (Node.js)',
        },
    },
    {
        name: 'Senior Fullstack (React/Go)',
        data: {
            fullName: 'Дмитрий Соколов',
            experienceYears: 7,
            skills: ['Go', 'React', 'TypeScript', 'Kubernetes', 'PostgreSQL', 'Redis', 'Kafka', 'System Design'],
            workExperience: [
                {
                    company: 'BigTech',
                    position: 'Senior Software Engineer',
                    duration: '4 года',
                    description: 'Руководил разработкой высоконагруженной платформы. Перенос монолита на микросервисы (Go). Настроил CI/CD.',
                },
            ],
        },
    },
    {
        name: 'Switcher QA -> Data Analyst',
        data: {
            fullName: 'Анна Кузнецова',
            experienceYears: 4,
            skills: ['Python', 'SQL', 'Tableau', 'Manual Testing', 'Jira'],
            workExperience: [
                {
                    company: 'E-commerce Corp',
                    position: 'QA Engineer',
                    duration: '4 года',
                    description: 'Ручное тестирование. Последний год изучаю SQL и Python для анализа данных, делаю внутренние дашборды в Tableau.',
                },
            ],
            careerGoals: 'Хочу перейти из QA в Data Analytics.',
        },
    },
];
