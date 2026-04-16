import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const profileData = {
        fullName: 'Алексей Смирнов',
        phone: '+7 999 123-45-67',
        location: 'Москва, Россия',
        desiredPosition: 'Senior Frontend Developer',
        desiredSalaryMin: 250000,
        desiredSalaryMax: 350000,
        experienceYears: 5,
        aboutMe: 'Опытный Frontend-разработчик с глубоким пониманием React и экосистемы JavaScript. Умею проектировать архитектуру масштабируемых веб-приложений.\n\nTelegram: @aleksey_front\nGitHub: github.com/asmirnov\nEmail: demo@careermate.com',
        careerGoals: 'Хочу развиваться в сторону Fullstack или Frontend-лида, брать больше ответственности за продукт и архитектурные решения.',
        skills: {
            technical: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Redux', 'Node.js', 'NestJS', 'PostgreSQL', 'Docker', 'Webpack', 'Tailwind', 'Git'],
            professional: ['Менторство', 'Проектирование архитектуры', 'Agile/Scrum', 'Организация CI/CD']
        },
        languages: [
            { language: 'Русский', level: 'Native' },
            { language: 'Английский', level: 'B2 (Upper-Intermediate)' }
        ],
        workExperience: [
            {
                id: 'exp1',
                company: 'TechCorp LLC',
                position: 'Senior Frontend Developer',
                period: 'Июнь 2021 - Март 2024'
            },
            {
                id: 'exp2',
                company: 'WebSolutions',
                position: 'Middle Frontend Developer',
                period: 'Февраль 2019 - Май 2021'
            }
        ],
        education: [
            {
                id: 'edu1',
                institution: 'Московский Государственный Технический Университет',
                degree: 'Бакалавр',
                year: '2019'
            }
        ]
    };

    const user = await prisma.user.upsert({
        where: { email: 'demo@careermate.com' },
        update: {
            profile: {
                upsert: {
                    create: { id: 'demo-profile-id', ...profileData },
                    update: profileData
                }
            }
        },
        create: {
            id: 'demo-user-id',
            email: 'demo@careermate.com',
            passwordHash: 'password', // In real app, this should be hashed
            profile: {
                create: {
                    id: 'demo-profile-id',
                    ...profileData
                }
            }
        },
    });
    console.log({ user });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
