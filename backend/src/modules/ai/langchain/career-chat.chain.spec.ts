import { AIMessage } from '@langchain/core/messages';
import { RunnableLambda } from '@langchain/core/runnables';
import { CareerChatChain } from './career-chat.chain';

describe('CareerChatChain', () => {
    it('should invoke and return a string response', async () => {
        const llmFn = jest.fn().mockResolvedValue(new AIMessage('Вот мой ответ'));
        const chain = new CareerChatChain(new RunnableLambda({ func: llmFn }) as any);
        const result = await chain.invoke({ message: 'помоги с резюме', context: '' });
        expect(typeof result).toBe('string');
        expect(result).toBe('Вот мой ответ');
    });

    it('should format the message and call the llm once', async () => {
        const llmFn = jest.fn().mockResolvedValue(new AIMessage('ok'));
        const chain = new CareerChatChain(new RunnableLambda({ func: llmFn }) as any);
        await chain.invoke({ message: 'найди вакансию', context: 'Имя: Иван' });
        expect(llmFn).toHaveBeenCalledTimes(1);
    });
});
