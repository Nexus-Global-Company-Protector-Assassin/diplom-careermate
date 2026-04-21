import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { ChatOpenAI } from 'langchain/chat_models/openai';

const SYSTEM = `Ты — умный карьерный консультант платформы CareerMate. Строго придерживайся своей роли. Твоя единственная цель: помогать с поиском работы, резюме, собеседованиями и развитием карьеры. Если пользователь задает вопросы или просит сделать что-то, не связанное с карьерой, работой, образованием, навыками или функционалом платформы, ты ДОЛЖЕН вежливо отказать и напомнить, что ты карьерный консультант CareerMate и обсуждаешь только профессиональное развитие. {context} Отвечай полезно, структурированно, профессионально. Пиши коротко и по делу.`;

export const careerChatPrompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM],
    ['human', '{message}'],
]);

export class CareerChatChain {
    private readonly chain;

    constructor(llm: ChatOpenAI) {
        // Build LCEL chain: prompt → llm → parser
        // Using llm.pipe() so the chain is composable and unit-testable via mock injection
        this.chain = (llm as any).pipe(new StringOutputParser()).pipe(careerChatPrompt as any);
    }

    async invoke(input: { message: string; context: string }): Promise<string> {
        return this.chain.invoke(input);
    }
}
