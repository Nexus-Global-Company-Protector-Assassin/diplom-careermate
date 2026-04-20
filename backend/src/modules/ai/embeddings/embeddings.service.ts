// backend/src/modules/ai/embeddings/embeddings.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Pinecone } from '@pinecone-database/pinecone';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EmbeddingsService {
    private readonly logger = new Logger(EmbeddingsService.name);
    private pineconeIndex: ReturnType<Pinecone['index']> | null = null;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {}

    private getIndex(): ReturnType<Pinecone['index']> {
        const apiKey = this.configService.get<string>('PINECONE_API_KEY');
        const indexName = this.configService.get<string>('PINECONE_INDEX');

        if (!apiKey) throw new Error('Pinecone API key is not configured.');
        if (!indexName) throw new Error('Pinecone index name is not configured.');

        if (!this.pineconeIndex) {
            const pc = new Pinecone({ apiKey } as any);
            this.pineconeIndex = pc.index(indexName);
        }
        return this.pineconeIndex;
    }

    private async getEmbedding(text: string): Promise<number[]> {
        const apiKey = this.configService.get<string>('LLM_API_KEY');
        if (!apiKey) throw new Error('LLM API key is not configured for embeddings.');

        const baseUrl = this.configService.get<string>(
            'LLM_API_BASE_URL',
            'https://api.openai.com/v1',
        );

        const response = await firstValueFrom(
            this.httpService.post(
                `${baseUrl}/embeddings`,
                { model: 'text-embedding-3-small', input: text.slice(0, 8000) },
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                },
            ),
        );

        return response.data.data[0].embedding as number[];
    }

    /**
     * Upsert a vacancy's embedding vector into Pinecone.
     * Config errors (missing API key) propagate. Runtime errors are caught and logged.
     */
    async indexVacancy(id: string, text: string): Promise<void> {
        const index = this.getIndex(); // throws if misconfigured
        try {
            const vector = await this.getEmbedding(text);
            await index.upsert([{ id, values: vector }]);
            this.logger.debug(`Indexed vacancy ${id} in Pinecone`);
        } catch (e: any) {
            this.logger.warn(`Failed to index vacancy ${id}: ${e.message}`);
        }
    }

    /**
     * Find vacancy IDs semantically similar to queryText, sorted by cosine similarity.
     * Config errors propagate. Runtime errors return [].
     */
    async searchSimilar(queryText: string, topK: number): Promise<string[]> {
        const index = this.getIndex(); // throws if misconfigured
        try {
            const vector = await this.getEmbedding(queryText);
            const results = await index.query({ vector, topK, includeValues: false });
            return (results.matches ?? []).map((m: any) => m.id as string);
        } catch (e: any) {
            this.logger.warn(`Semantic search failed: ${e.message}`);
            return [];
        }
    }
}
