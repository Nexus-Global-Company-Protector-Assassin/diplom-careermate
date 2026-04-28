import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import type { ChatOpenAI } from 'langchain/chat_models/openai';

export const careerPathPrompt = ChatPromptTemplate.fromMessages([
    ['system', 'Ты — эксперт по карьерному развитию платформы CareerMate. Анализируешь личностный профиль кандидата и рекомендуешь карьерные пути с детальным роадмапом. Отвечай ТОЛЬКО валидным JSON без markdown и без пояснений.'],
    ['human', '{prompt}'],
]);

export class CareerPathChain {
    private readonly chain;

    constructor(llm: ChatOpenAI) {
        this.chain = careerPathPrompt.pipe(llm as any).pipe(new JsonOutputParser() as any);
    }

    async invoke(input: { prompt: string }): Promise<any> {
        return this.chain.invoke(input);
    }
}
