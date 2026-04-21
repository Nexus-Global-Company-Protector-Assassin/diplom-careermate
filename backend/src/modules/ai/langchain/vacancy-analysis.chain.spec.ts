import { AIMessage } from '@langchain/core/messages';
import { RunnableLambda } from '@langchain/core/runnables';
import { VacancyAnalysisChain } from './vacancy-analysis.chain';

const mockAnalysis = { A_Summary: 'ok', grade: 'B', score: 75, G_Legitimacy: { verdict: 'High Confidence', signals: [], explanation: '' } };

describe('VacancyAnalysisChain', () => {
    it('should invoke and return a parsed JSON object', async () => {
        const llmFn = jest.fn().mockResolvedValue(new AIMessage(JSON.stringify(mockAnalysis)));
        const chain = new VacancyAnalysisChain(new RunnableLambda({ func: llmFn }) as any);
        const result = await chain.invoke({ prompt: 'анализируй вакансию' });
        expect(result).toEqual(mockAnalysis);
        expect(result.grade).toBe('B');
    });

    it('should call llm once per invoke', async () => {
        const llmFn = jest.fn().mockResolvedValue(new AIMessage(JSON.stringify(mockAnalysis)));
        const chain = new VacancyAnalysisChain(new RunnableLambda({ func: llmFn }) as any);
        await chain.invoke({ prompt: 'test prompt text' });
        expect(llmFn).toHaveBeenCalledTimes(1);
    });
});
