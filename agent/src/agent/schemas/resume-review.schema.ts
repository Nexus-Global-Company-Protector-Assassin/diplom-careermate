import { z } from 'zod';

/**
 * Схема результата глубокого анализа резюме AI-агентом.
 * Включает оценку, сильные/слабые стороны и улучшенную версию.
 */
export const ResumeReviewSchema = z.object({
    overallScore: z
        .number()
        .min(1)
        .max(10)
        .describe('Общая оценка резюме от 1 до 10. 9-10 = отличное, 7-8 = хорошее, 5-6 = среднее, ниже 5 = слабое'),

    overallVerdict: z
        .enum(['Отличное', 'Хорошее', 'Среднее', 'Требует доработки'])
        .describe('Общий вердикт по качеству резюме'),

    noChangesNeeded: z
        .boolean()
        .describe('true если резюме уже качественное и не требует серьёзных доработок. В этом случае improvedResume может быть идентичен оригиналу.'),

    strengths: z
        .array(
            z.object({
                title: z.string().describe('Краткий заголовок сильной стороны'),
                description: z.string().describe('Подробное описание почему это хорошо'),
            }),
        )
        .describe('Сильные стороны резюме — что кандидат сделал правильно'),

    weaknesses: z
        .array(
            z.object({
                title: z.string().describe('Краткий заголовок слабой стороны'),
                description: z.string().describe('Подробное описание проблемы'),
                recommendation: z.string().describe('Конкретная рекомендация по улучшению'),
                severity: z.preprocess((val) => {
                    if (typeof val !== 'string') return val;
                    const v = val.toLowerCase().trim();
                    if (['critical', 'высокая', 'high', 'критично', 'критическая'].includes(v)) return 'critical';
                    if (['major', 'средняя', 'medium', 'важно', 'важная'].includes(v)) return 'major';
                    return 'minor';
                }, z.enum(['critical', 'major', 'minor'])).describe('Серьёзность: critical = критично, major = важно, minor = мелочь'),
            }),
        )
        .describe('Слабые стороны резюме с рекомендациями. Если резюме хорошее — массив может быть пустым или содержать только minor.'),

    missingForTarget: z
        .array(z.string())
        .describe('Навыки или опыт, которых не хватает для желаемой позиции (если позиция указана). Пустой массив если позиция не указана или всё покрыто.'),

    improvedResume: z
        .string()
        .describe('Полный текст улучшенного резюме в формате Markdown. Содержит ТОЛЬКО реальные факты из оригинала. Если noChangesNeeded=true — текст максимально близок к оригиналу.'),

    changesSummary: z
        .array(z.string())
        .describe('Список конкретных изменений, внесённых в улучшенную версию. Например: "Переписал summary с акцентом на ML-опыт", "Добавил метрики в описание достижений"'),

    extractedProfile: z
        .object({
            fullName: z.string().describe('ФИО кандидата'),
            currentPosition: z.string().optional().describe('Текущая/последняя должность'),
            skills: z.array(z.string()).describe('Все найденные навыки'),
            experienceYears: z.number().describe('Примерный общий опыт в годах'),
        })
        .describe('Извлечённые из резюме структурированные данные профиля'),
});

export type ResumeReview = z.infer<typeof ResumeReviewSchema>;
