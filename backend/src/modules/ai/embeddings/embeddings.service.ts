import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantVectorStore } from '@langchain/community/vectorstores/qdrant';
import { PolzaAiEmbeddings } from './polza-ai.embeddings';

@Injectable()
export class EmbeddingsService implements OnModuleInit {
    private readonly logger = new Logger(EmbeddingsService.name);
    private readonly VECTOR_SIZE = 1536;
    private qdrantClient: QdrantClient | null = null;
    private vectorStore: QdrantVectorStore | null = null;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {}

    async onModuleInit() {
        try {
            await this.ensureCollection();
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.warn(`Qdrant collection init skipped: ${msg}`);
        }
    }

    private getClient(): QdrantClient {
        if (!this.qdrantClient) {
            const url = this.configService.get<string>('QDRANT_URL');
            const apiKey = this.configService.get<string>('QDRANT_API_KEY');
            if (!url) throw new Error('Qdrant URL is not configured.');
            if (!apiKey) throw new Error('Qdrant API key is not configured.');
            this.qdrantClient = new QdrantClient({ url, apiKey });
        }
        return this.qdrantClient;
    }

    private getCollection(): string {
        const name = this.configService.get<string>('QDRANT_COLLECTION');
        if (!name) throw new Error('Qdrant collection name is not configured.');
        return name;
    }

    private getVectorStore(): QdrantVectorStore {
        if (!this.vectorStore) {
            const client = this.getClient();
            const collectionName = this.getCollection();
            const embeddings = new PolzaAiEmbeddings(this.httpService, this.configService);
            this.vectorStore = new QdrantVectorStore(embeddings, {
                client,
                collectionName,
            });
        }
        return this.vectorStore;
    }

    private async ensureCollection(): Promise<void> {
        const client = this.getClient();
        const collection = this.getCollection();
        const { collections } = await client.getCollections();
        if (!collections.some((c) => c.name === collection)) {
            await client.createCollection(collection, {
                vectors: { size: this.VECTOR_SIZE, distance: 'Cosine' },
            });
            this.logger.log(`Created Qdrant collection: ${collection}`);
        }
    }

    async indexVacancy(id: string, text: string): Promise<void> {
        const vectorStore = this.getVectorStore();
        try {
            await vectorStore.addDocuments([
                { pageContent: text, metadata: { vacancyId: id } },
            ]);
            this.logger.debug(`Indexed vacancy ${id} in Qdrant`);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.warn(`Failed to index vacancy ${id}: ${msg}`);
        }
    }

    async searchSimilar(queryText: string, topK: number): Promise<string[]> {
        const vectorStore = this.getVectorStore();
        try {
            const results = await vectorStore.similaritySearch(queryText, topK);
            return results.map((doc) => doc.metadata.vacancyId as string);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.warn(`Semantic search failed: ${msg}`);
            return [];
        }
    }
}
