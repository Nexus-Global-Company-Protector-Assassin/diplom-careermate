import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';

@Injectable()
export class PineconeService implements OnModuleInit {
    private readonly logger = new Logger(PineconeService.name);
    private pinecone: Pinecone;
    private indexName: string;

    constructor(private readonly configService: ConfigService) { }

    async onModuleInit() {
        const apiKey = this.configService.get<string>('PINECONE_API_KEY');
        this.indexName = this.configService.get<string>('PINECONE_INDEX_NAME', 'careermate-vectors');

        if (!apiKey || apiKey === 'your-pinecone-api-key') {
            this.logger.warn('Pinecone API Key is not configured correctly. RAG might not work.');
            return;
        }

        try {
            this.pinecone = new Pinecone({ apiKey });
            this.logger.log(`Pinecone initialized, index: ${this.indexName}`);
        } catch (error) {
            this.logger.error(`Failed to initialize Pinecone: ${(error as Error).message}`);
        }
    }

    /**
     * Загружает(обновляет) вектора в Pinecone
     */
    async upsertVacancies(vectors: PineconeRecord[]): Promise<void> {
        if (!this.pinecone) {
            throw new Error('Pinecone client not initialized');
        }
        const index = this.pinecone.Index(this.indexName);

        // Pinecone рекомендует батчинг по 100-200 записей, но у нас сейчас их немного
        await index.upsert(vectors as any);
        this.logger.log(`Upserted ${vectors.length} records into Pinecone`);
    }

    /**
     * Ищет ближайшие вектора по переданному queryVector
     */
    async searchVacancies(queryVector: number[], topK: number = 15): Promise<any[]> {
        if (!this.pinecone) {
            throw new Error('Pinecone client not initialized');
        }

        const index = this.pinecone.Index(this.indexName);

        const queryResponse = await index.query({
            vector: queryVector,
            topK,
            includeMetadata: true,
        });

        this.logger.log(`Found ${queryResponse.matches.length} matches in Pinecone`);

        // Возвращаем метаданные (там будут лежать сырые данные вакансий)
        return queryResponse.matches.map(match => ({
            id: match.id,
            score: match.score,
            ...(match.metadata || {})
        }));
    }
}
