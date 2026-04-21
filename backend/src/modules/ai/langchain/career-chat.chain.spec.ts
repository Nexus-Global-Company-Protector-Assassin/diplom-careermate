import { CareerChatChain } from './career-chat.chain';

const makeLlm = (output: string) => ({
    pipe: jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
            invoke: jest.fn().mockResolvedValue(output),
        }),
    }),
});

describe('CareerChatChain', () => {
    it('should invoke and return a string response', async () => {
        const chain = new CareerChatChain(makeLlm('Вот мой ответ') as any);
        const result = await chain.invoke({ message: 'помоги с резюме', context: '' });
        expect(typeof result).toBe('string');
        expect(result).toBe('Вот мой ответ');
    });

    it('should pass message and context into the chain', async () => {
        const invoke = jest.fn().mockResolvedValue('ok');
        const llm = { pipe: jest.fn().mockReturnValue({ pipe: jest.fn().mockReturnValue({ invoke }) }) } as any;
        const chain = new CareerChatChain(llm);
        await chain.invoke({ message: 'найди вакансию', context: 'Имя: Иван' });
        expect(invoke).toHaveBeenCalledWith({ message: 'найди вакансию', context: 'Имя: Иван' });
    });
});
