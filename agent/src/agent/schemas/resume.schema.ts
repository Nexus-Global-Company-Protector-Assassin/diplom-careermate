import { z } from 'zod';

/**
 * Схема сгенерированного резюме
 */
export const GeneratedResumeSchema = z.object({
    targetPosition: z.string().describe('Позиция, под которую адаптировано резюме'),
    fullName: z.string().describe('Полное имя кандидата'),
    summary: z
        .string()
        .describe(
            'Профессиональное резюме (3-5 предложений), адаптированное под вакансию',
        ),
    skills: z.array(z.string()).describe('Релевантные навыки для данной вакансии'),
    experience: z
        .array(
            z.object({
                company: z.string(),
                position: z.string(),
                period: z.string(),
                achievements: z
                    .array(z.string())
                    .describe('Достижения, релевантные для целевой вакансии'),
            }),
        )
        .describe('Опыт работы с акцентом на релевантные достижения'),
    education: z
        .array(
            z.object({
                institution: z.string(),
                degree: z.string(),
                year: z.string().optional(),
            }),
        )
        .optional(),
    languages: z.array(z.string()).optional(),
    contacts: z
        .object({
            email: z.string().optional(),
            phone: z.string().optional(),
            linkedin: z.string().optional(),
            github: z.string().optional(),
        })
        .optional(),
    recommendations: z.array(z.string()).describe('Рекомендации по ручному улучшению: что юзеру нужно дописать самому (метрики, детали и т.д.)').optional(),
    autoFixed: z.array(z.string()).describe('Список улучшений, которые ИИ применил автоматически (например, переписал summary, убрал лишние навыки)').optional(),
});

export type GeneratedResume = z.infer<typeof GeneratedResumeSchema>;
