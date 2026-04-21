import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { ChatOpenAI } from 'langchain/chat_models/openai';

export const coverLetterPrompt = ChatPromptTemplate.fromMessages([
    ['system', '{systemPrompt}'],
    ['human', '{prompt}'],
]);

export class CoverLetterChain {
    private readonly chain;

    constructor(llm: ChatOpenAI) {
        this.chain = coverLetterPrompt.pipe(llm as any).pipe(new StringOutputParser() as any);
    }

    async invoke(input: { systemPrompt: string; prompt: string }): Promise<string> {
        return this.chain.invoke(input);
    }
}
