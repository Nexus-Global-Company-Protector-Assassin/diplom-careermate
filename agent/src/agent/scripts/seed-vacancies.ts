import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PineconeService } from '../pinecone/pinecone.service';
import { LlmGatewayService } from '../llm/llm-gateway.service';
import { VACANCIES_DATABASE } from '../tools/vacancies.data';

async function bootstrap() {
    console.log('🚀 Starting Vacancies Seeding...');
    const app = await NestFactory.createApplicationContext(AppModule);

    const pinecone = app.get(PineconeService);
    const llm = app.get(LlmGatewayService);

    try {
        console.log(`Extracting texts from ${VACANCIES_DATABASE.length} vacancies...`);
        const texts = VACANCIES_DATABASE.map(v =>
            `${v.title} в ${v.company}. Требования: ${v.requiredSkills.join(', ')}. Описание: ${v.description}. Уровень: ${v.level || 'Any'}`
        );

        console.log('Requesting embeddings from Polza.ai...');
        const embeddings = await llm.generateEmbeddings(texts);

        console.log(`Got ${embeddings.length} embeddings. Formatting for Pinecone...`);
        const vectors = VACANCIES_DATABASE.map((v, i) => ({
            id: v.id,
            values: embeddings[i],
            metadata: {
                title: v.title,
                company: v.company,
                location: v.location || '',
                requiredSkills: v.requiredSkills.join(', '),
                description: v.description,
                level: v.level || 'Any',
            }
        }));

        console.log('Upserting to Pinecone...');
        await pinecone.upsertVacancies(vectors as any);

        console.log('✅ Seeding completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', (error as Error).message);
        if ((error as any).response?.data) {
            console.error('API Error Details:', (error as any).response.data);
        }
    } finally {
        await app.close();
        process.exit(0);
    }
}

bootstrap();
