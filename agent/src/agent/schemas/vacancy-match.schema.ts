import { z } from 'zod';

/**
 * Схема одной вакансии в результате match_vacancies
 */
export const VacancySchema = z.object({
    id: z.string().describe('ID вакансии из базы'),
    title: z.string().describe('Название вакансии'),
    company: z.string().describe('Компания'),
    location: z.string().optional().describe('Место работы'),
    salary: z
        .object({
            min: z.number().optional(),
            max: z.number().optional(),
            currency: z.string().default('RUB'),
        })
        .optional()
        .describe('Зарплатная вилка'),
    matchScore: z
        .number()
        .min(0)
        .max(100)
        .describe('Процент совпадения профиля с вакансией'),
    matchReasons: z
        .array(z.string())
        .describe('Причины релевантности: конкретные совпадающие навыки и опыт'),
    requiredSkills: z.array(z.string()).describe('Требуемые навыки'),
    description: z.string().optional().describe('Краткое описание вакансии'),
});

export const VacancyMatchResultSchema = z.object({
    vacancies: z
        .array(VacancySchema)
        .min(1)
        .max(5)
        .describe('Топ-3..5 подходящих вакансий, отсортированных по matchScore'),
    totalAnalyzed: z.number().describe('Сколько вакансий проанализировано'),
});

export type Vacancy = z.infer<typeof VacancySchema>;
export type VacancyMatchResult = z.infer<typeof VacancyMatchResultSchema>;
