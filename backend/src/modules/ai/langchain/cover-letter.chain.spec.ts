import { CoverLetterChain } from './cover-letter.chain';

const makeLlm = (output: string) => ({
    pipe: jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
            invoke: jest.fn().mockResolvedValue(output),
        }),
    }),
});

describe('CoverLetterChain', () => {
    it('should invoke and return cover letter text', async () => {
        const chain = new CoverLetterChain(makeLlm('Уважаемый HR!') as any);
        const result = await chain.invoke({ systemPrompt: 'system', prompt: 'user prompt' });
        expect(typeof result).toBe('string');
        expect(result).toBe('Уважаемый HR!');
    });

    it('should pass systemPrompt and prompt into chain invoke', async () => {
        const invoke = jest.fn().mockResolvedValue('letter');
        const llm = { pipe: jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ invoke }) }) } as any;
        const chain = new CoverLetterChain(llm);
        await chain.invoke({ systemPrompt: 'sys', prompt: 'usr' });
        expect(invoke).toHaveBeenCalledWith({ systemPrompt: 'sys', prompt: 'usr' });
    });
});
