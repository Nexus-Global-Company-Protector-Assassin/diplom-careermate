import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import type { ChatOpenAI } from 'langchain/chat_models/openai';

export const interviewPrepPrompt = ChatPromptTemplate.fromMessages([
    ['system', 'Ты — эксперт по подготовке к собеседованиям платформы CareerMate. Генерируй структурированные ответы по методу STAR+R. Отвечай только валидным JSON.'],
    ['human', '{prompt}'],
]);

export class InterviewPrepChain {
    private readonly chain;

    constructor(llm: ChatOpenAI) {
        this.chain = (llm as any).pipe(new JsonOutputParser()).pipe(interviewPrepPrompt as any);
    }

    async invoke(input: { prompt: string }): Promise<any> {
        return this.chain.invoke(input);
    }
}
