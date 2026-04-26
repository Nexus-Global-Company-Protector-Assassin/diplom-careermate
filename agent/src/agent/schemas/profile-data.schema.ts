import { z } from 'zod';

export const ProfileDataSchema = z.object({
    fullName: z.string().describe('Полное имя кандидата из резюме'),
    phone: z.string().optional().describe('Номер телефона кандидата, если указан'),
    location: z.string().optional().describe('Город или регион проживания кандидата'),
    skills: z.array(z.string()).describe('Список ВСЕХ найденных навыков: технологии, инструменты, языки, фреймворки, мягкие навыки — всё подряд'),
    experienceYears: z.number().describe('Общий опыт работы в годах (округлить если не точный)'),
    desiredPosition: z.string().optional().describe('Желаемая должность или выводимая позиция на основе опыта'),
    aboutMe: z.string().optional().describe('Личное описание кандидата из разделов "О себе", "Обо мне", "Дополнительная информация", "Summary", "About me" — скопируй текст целиком'),
    education: z.array(z.object({
        institution: z.string().describe('Название учебного заведения'),
        field: z.string().optional().describe('Специальность, направление или программа обучения (например: "Прикладная информатика", "Специалист по Data Science")'),
        degree: z.string().optional().describe('Уровень образования: "Бакалавр", "Магистр", "Неоконченное высшее", "Среднее специальное" и т.д.'),
        endYear: z.coerce.number().optional().describe('Год окончания или планируемый год выпуска в виде числа (например: 2026). Обязательно извлеки если год указан рядом с учебным заведением.'),
    })).optional().describe('Список записей об образовании — каждый вуз/курс отдельной записью'),
    workExperience: z.array(z.object({
        company: z.string().describe('Название компании или организации'),
        position: z.string().describe('Занимаемая должность'),
        duration: z.string().describe('Период работы, например "Март 2022 — настоящее время" или "2 года"'),
        description: z.string().optional().describe('Подробное описание обязанностей, проектов и достижений на этом месте работы'),
    })).optional().describe('Опыт работы в обратном хронологическом порядке'),
    careerGoals: z.string().optional().describe('Карьерные цели или пожелания к работе, если упоминаются'),
});

export type ParsedProfileData = z.infer<typeof ProfileDataSchema>;
