import { AIMessage } from '@langchain/core/messages';
import { RunnableLambda } from '@langchain/core/runnables';
import { InterviewPrepChain } from './interview-prep.chain';

const mockPrep = { questions: [{ question: 'Расскажите о себе', category: 'behavioral', star: {} }], candidate_questions: ['Вопрос 1'], tips: 'Совет' };

describe('InterviewPrepChain', () => {
    it('should invoke and return structured interview prep JSON', async () => {
        const llmFn = jest.fn().mockResolvedValue(new AIMessage(JSON.stringify(mockPrep)));
        const chain = new InterviewPrepChain(new RunnableLambda({ func: llmFn }) as any);
        const result = await chain.invoke({ prompt: 'подготовь вопросы' });
        expect(result).toEqual(mockPrep);
        expect(Array.isArray(result.questions)).toBe(true);
    });

    it('should call llm once per invoke', async () => {
        const llmFn = jest.fn().mockResolvedValue(new AIMessage(JSON.stringify(mockPrep)));
        const chain = new InterviewPrepChain(new RunnableLambda({ func: llmFn }) as any);
        await chain.invoke({ prompt: 'test prompt' });
        expect(llmFn).toHaveBeenCalledTimes(1);
    });
});
