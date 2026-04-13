import { z } from 'zod';

export const ProfileDataSchema = z.object({
    fullName: z.string().describe('Полное имя кандидата из резюме'),
    skills: z.array(z.string()).describe('Список всех найденных навыков (технических и мягких)'),
    experienceYears: z.number().describe('Общий подтвержденный опыт работы кандидата в годах (примерный, если не точный, округлить)'),
    desiredPosition: z.string().optional().describe('Желаемая должность кандидата, если указана в резюме (или выводимая позиция)'),
    aboutMe: z.string().optional().describe('Блок обо мне, summary или краткое описание кандидата'),
    workExperience: z.array(z.object({
        company: z.string().describe('Название компании'),
        position: z.string().describe('Занимаемая должность'),
        duration: z.string().describe('Срок работы (например, "2 года")'),
        description: z.string().describe('Описание обязанностей').optional(),
    })).optional().describe('Опыт работы, перечисленный в обратном хронологическом порядке'),
    careerGoals: z.string().optional().describe('Карьерные цели (если упоминаются)'),
});

export type ParsedProfileData = z.infer<typeof ProfileDataSchema>;
