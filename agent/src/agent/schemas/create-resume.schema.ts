import { z } from 'zod';

/**
 * Схема вопроса от AI для уточнения данных профиля
 */
export const ResumeQuestionSchema = z.object({
    id: z.string().describe('Уникальный идентификатор вопроса (например q1, q2)'),
    category: z.enum(['experience', 'skills', 'education', 'personal', 'achievements'])
        .describe('Категория вопроса'),
    question: z.string().describe('Текст наводящего вопроса на русском языке'),
    hint: z.string().describe('Подсказка — пример ответа для пользователя'),
    required: z.boolean().describe('Обязательный ли вопрос'),
});

export const ResumeQuestionsResponseSchema = z.object({
    profileSummary: z.string().describe('Краткая оценка текущего профиля (1-2 предложения)'),
    missingDataAreas: z.array(z.string()).describe('Области, где не хватает данных'),
    questions: z.array(ResumeQuestionSchema).describe('Список наводящих вопросов (3-7 штук)'),
});

export type ResumeQuestion = z.infer<typeof ResumeQuestionSchema>;
export type ResumeQuestionsResponse = z.infer<typeof ResumeQuestionsResponseSchema>;

/**
 * Схема результата генерации резюме
 */
export const CreatedResumeSchema = z.object({
    title: z.string().describe('Заголовок резюме (ФИО — Желаемая позиция)'),
    resumeMarkdown: z.string().describe('Полный текст резюме в формате Markdown'),
    tips: z.array(z.string()).describe('Советы по дальнейшему улучшению резюме (2-4 совета)'),
});

export type CreatedResume = z.infer<typeof CreatedResumeSchema>;
