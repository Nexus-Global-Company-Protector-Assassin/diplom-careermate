import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import type { ChatOpenAI } from 'langchain/chat_models/openai';

export const vacancyAnalysisPrompt = ChatPromptTemplate.fromMessages([
    ['system', 'Ты — строгий карьерный консультант платформы CareerMate. Проводишь аудит вакансий включая Ghost Job Detection (Block G). Отвечай только валидным JSON без markdown.'],
    ['human', '{prompt}'],
]);

export class VacancyAnalysisChain {
    private readonly chain;

    constructor(llm: ChatOpenAI) {
        this.chain = vacancyAnalysisPrompt.pipe(llm as any).pipe(new JsonOutputParser() as any);
    }

    async invoke(input: { prompt: string }): Promise<any> {
        return this.chain.invoke(input);
    }
}
