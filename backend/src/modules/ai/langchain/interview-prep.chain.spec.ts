import { InterviewPrepChain } from './interview-prep.chain';

const mockPrep = { questions: [{ question: 'Расскажите о себе', category: 'behavioral', star: {} }], candidate_questions: ['Вопрос 1'], tips: 'Совет' };

const makeLlm = (output: object) => ({
    pipe: jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
            invoke: jest.fn().mockResolvedValue(output),
        }),
    }),
});

describe('InterviewPrepChain', () => {
    it('should invoke and return structured interview prep JSON', async () => {
        const chain = new InterviewPrepChain(makeLlm(mockPrep) as any);
        const result = await chain.invoke({ prompt: 'подготовь вопросы' });
        expect(result).toEqual(mockPrep);
        expect(Array.isArray(result.questions)).toBe(true);
    });

    it('should pass the prompt variable into chain invoke', async () => {
        const invoke = jest.fn().mockResolvedValue(mockPrep);
        const llm = { pipe: jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ invoke }) }) } as any;
        const chain = new InterviewPrepChain(llm);
        await chain.invoke({ prompt: 'test prompt' });
        expect(invoke).toHaveBeenCalledWith({ prompt: 'test prompt' });
    });
});
