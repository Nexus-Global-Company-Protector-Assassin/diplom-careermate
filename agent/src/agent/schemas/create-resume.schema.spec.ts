import { ResumeQuestionsResponseSchema } from './create-resume.schema';

describe('ResumeQuestionsResponseSchema', () => {
    const baseQuestion = {
        category: 'achievements' as const,
        question: 'Назовите ключевое достижение',
        hint: 'Например: ускорил latency на 40%',
        required: true,
    };

    it('accepts string ids', () => {
        const result = ResumeQuestionsResponseSchema.safeParse({
            profileSummary: 'ok',
            missingDataAreas: ['metrics'],
            questions: [{ id: 'q1', ...baseQuestion }],
        });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.questions[0].id).toBe('q1');
    });

    it('coerces numeric ids to strings (LLM sometimes returns numbers)', () => {
        const result = ResumeQuestionsResponseSchema.safeParse({
            profileSummary: 'ok',
            missingDataAreas: [],
            questions: [
                { id: 1, ...baseQuestion },
                { id: 2, ...baseQuestion },
            ],
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.questions[0].id).toBe('1');
            expect(result.data.questions[1].id).toBe('2');
        }
    });

    it('accepts questions without id (tool normalizes them)', () => {
        const result = ResumeQuestionsResponseSchema.safeParse({
            profileSummary: 'ok',
            missingDataAreas: [],
            questions: [baseQuestion, baseQuestion],
        });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.questions[0].id).toBeUndefined();
        }
    });
});
