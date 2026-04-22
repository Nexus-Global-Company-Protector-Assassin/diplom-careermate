// backend/src/modules/ai/embeddings/polza-ai.embeddings.ts
import { Embeddings } from '@langchain/core/embeddings';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export class PolzaAiEmbeddings extends Embeddings {
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        super({});
    }

    async embedQuery(text: string): Promise<number[]> {
        const apiKey = this.configService.get<string>('LLM_API_KEY');
        if (!apiKey) throw new Error('LLM API key is not configured for embeddings.');

        const baseUrl = this.configService.get<string>(
            'LLM_API_BASE_URL',
            'https://polza.ai/api/v1',
        );

        const model = this.configService.get<string>(
            'EMBEDDINGS_MODEL_NAME',
            'openai/text-embedding-3-small',
        );

        const response = await this.caller.call(() =>
            firstValueFrom(
                this.httpService.post(
                    `${baseUrl}/embeddings`,
                    { model, input: text.slice(0, 8000) },
                    {
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                        },
                    },
                ),
            ),
        );

        const embedding = response.data?.data?.[0]?.embedding;
        if (!Array.isArray(embedding)) {
            throw new Error(`Unexpected embeddings response shape: ${JSON.stringify(response.data)}`);
        }
        return embedding as number[];
    }

    async embedDocuments(texts: string[]): Promise<number[][]> {
        return Promise.all(texts.map((t) => this.embedQuery(t)));
    }
}
