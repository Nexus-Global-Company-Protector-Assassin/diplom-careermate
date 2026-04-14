import { z } from 'zod';

/**
 * Схема результата analyze_profile MCP tool
 */
export const ProfileAnalysisSchema = z.object({
    skills: z.array(z.string()).describe('Ключевые технические и soft skills'),
    level: z.enum(['Junior', 'Middle', 'Senior']).describe('Уровень специалиста'),
    skillGaps: z
        .array(z.string())
        .describe('Навыки, которых не хватает для желаемой роли'),
    score: z
        .number()
        .min(0)
        .max(100)
        .describe('Общий скор профиля от 0 до 100'),
    summary: z.string().describe('Краткое резюме анализа профиля'),
    desiredRole: z.string().optional().describe('Определённая желаемая роль'),
    strengths: z
        .array(z.string())
        .optional()
        .describe('Ключевые сильные стороны'),
});

export type ProfileAnalysis = z.infer<typeof ProfileAnalysisSchema>;
