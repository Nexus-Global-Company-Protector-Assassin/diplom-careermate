import { VacancyAnalysisChain } from './vacancy-analysis.chain';

const mockAnalysis = { A_Summary: 'ok', grade: 'B', score: 75, G_Legitimacy: { verdict: 'High Confidence', signals: [], explanation: '' } };

const makeLlm = (output: object) => ({
    pipe: jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
            invoke: jest.fn().mockResolvedValue(output),
        }),
    }),
});

describe('VacancyAnalysisChain', () => {
    it('should invoke and return a JSON object', async () => {
        const chain = new VacancyAnalysisChain(makeLlm(mockAnalysis) as any);
        const result = await chain.invoke({ prompt: 'анализируй вакансию' });
        expect(result).toEqual(mockAnalysis);
        expect(result.grade).toBe('B');
    });

    it('should pass the prompt variable into chain invoke', async () => {
        const invoke = jest.fn().mockResolvedValue(mockAnalysis);
        const llm = { pipe: jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ invoke }) }) } as any;
        const chain = new VacancyAnalysisChain(llm);
        await chain.invoke({ prompt: 'test prompt text' });
        expect(invoke).toHaveBeenCalledWith({ prompt: 'test prompt text' });
    });
});
