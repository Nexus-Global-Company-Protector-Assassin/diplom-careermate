import { AIMessage } from '@langchain/core/messages';
import { RunnableLambda } from '@langchain/core/runnables';
import { CoverLetterChain } from './cover-letter.chain';

describe('CoverLetterChain', () => {
    it('should invoke and return cover letter text', async () => {
        const llmFn = jest.fn().mockResolvedValue(new AIMessage('Уважаемый HR!'));
        const chain = new CoverLetterChain(new RunnableLambda({ func: llmFn }) as any);
        const result = await chain.invoke({ systemPrompt: 'system', prompt: 'user prompt' });
        expect(typeof result).toBe('string');
        expect(result).toBe('Уважаемый HR!');
    });

    it('should call llm once per invoke', async () => {
        const llmFn = jest.fn().mockResolvedValue(new AIMessage('letter'));
        const chain = new CoverLetterChain(new RunnableLambda({ func: llmFn }) as any);
        await chain.invoke({ systemPrompt: 'sys', prompt: 'usr' });
        expect(llmFn).toHaveBeenCalledTimes(1);
    });
});
