/**
 * One-time script: seeds all canonical Skill records from PostgreSQL into Neo4j
 * with vector embeddings (Polza.ai) and co-occurrence edges from VacancySkill data.
 *
 * Usage: npx ts-node --project tsconfig.json prisma/scripts/seed-neo4j.ts
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import neo4j from 'neo4j-driver';

const prisma = new PrismaClient();

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'careermate_neo4j';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_API_BASE_URL = process.env.LLM_API_BASE_URL || 'https://polza.ai/api/v1';
const EMBEDDINGS_MODEL = process.env.EMBEDDINGS_MODEL_NAME || 'openai/text-embedding-3-small';
const BATCH_SIZE = 20;
const EMBED_DELAY_MS = 200; // avoid rate limiting

async function generateEmbedding(text: string): Promise<number[] | null> {
    if (!LLM_API_KEY) {
        console.warn('LLM_API_KEY not set — skipping embeddings');
        return null;
    }
    try {
        const res = await axios.post(
            `${LLM_API_BASE_URL}/embeddings`,
            { model: EMBEDDINGS_MODEL, input: text.slice(0, 512) },
            { headers: { Authorization: `Bearer ${LLM_API_KEY}`, 'Content-Type': 'application/json' } },
        );
        const embedding = res.data?.data?.[0]?.embedding;
        return Array.isArray(embedding) ? embedding : null;
    } catch (e: any) {
        console.warn(`Embedding failed for "${text}": ${e.message}`);
        return null;
    }
}

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    console.log('=== Neo4j Skills Knowledge Graph Seeder ===');

    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
    try {
        await driver.verifyConnectivity();
        console.log(`Connected to Neo4j at ${NEO4J_URI}`);
    } catch (e: any) {
        console.error(`Cannot connect to Neo4j: ${e.message}`);
        process.exit(1);
    }

    const session = driver.session({ database: NEO4J_DATABASE, defaultAccessMode: neo4j.session.WRITE });

    // Step 1: Ensure vector index
    console.log('\n[1/3] Creating vector index...');
    try {
        await session.run(
            `CREATE VECTOR INDEX skillEmbeddingIndex IF NOT EXISTS
             FOR (s:Skill) ON s.embedding
             OPTIONS { indexConfig: { \`vector.dimensions\`: 1536, \`vector.similarity_function\`: 'cosine' } }`,
        );
        console.log('Vector index ready.');
    } catch (e: any) {
        console.warn(`Vector index creation: ${e.message}`);
    }

    // Step 2: Load all skills from PostgreSQL and upsert to Neo4j
    console.log('\n[2/3] Seeding skills...');
    const skills = await prisma.skill.findMany({ orderBy: { name: 'asc' } });
    console.log(`Found ${skills.length} skills in PostgreSQL.`);

    let done = 0;
    let embedded = 0;
    let skipped = 0;

    for (let i = 0; i < skills.length; i += BATCH_SIZE) {
        const batch = skills.slice(i, i + BATCH_SIZE);

        for (const skill of batch) {
            const embedding = await generateEmbedding(skill.name);
            if (embedding) embedded++;
            else skipped++;

            await session.run(
                `MERGE (s:Skill {id: $id})
                 SET s.name = $name,
                     s.category = $category,
                     s.aliases = $aliases,
                     s.source = 'seed',
                     s.updatedAt = datetime()
                 ${embedding ? ', s.embedding = $embedding' : ''}
                 WITH s
                 MERGE (c:Category {name: $category})
                 MERGE (s)-[:BELONGS_TO]->(c)`,
                {
                    id: skill.id,
                    name: skill.name,
                    category: skill.category ?? 'Other',
                    aliases: skill.aliases,
                    ...(embedding ? { embedding } : {}),
                },
            );
            done++;
        }

        console.log(`  Progress: ${done}/${skills.length} (${embedded} with embeddings, ${skipped} skipped)`);
        if (embedding !== null) await sleep(EMBED_DELAY_MS);
    }

    // Step 3: Build co-occurrence edges from VacancySkill data
    console.log('\n[3/3] Building co-occurrence edges...');
    const vacancies = await prisma.vacancySkill.findMany({
        select: { vacancyId: true, skillId: true },
    });

    const byVacancy = new Map<string, string[]>();
    for (const vs of vacancies) {
        if (!byVacancy.has(vs.vacancyId)) byVacancy.set(vs.vacancyId, []);
        byVacancy.get(vs.vacancyId)!.push(vs.skillId);
    }

    let edgesCreated = 0;
    for (const [, skillIds] of byVacancy) {
        if (skillIds.length < 2) continue;
        const pairs: Array<{ a: string; b: string }> = [];
        for (let i = 0; i < skillIds.length; i++) {
            for (let j = i + 1; j < skillIds.length; j++) {
                pairs.push({ a: skillIds[i], b: skillIds[j] });
            }
        }
        await session.run(
            `UNWIND $pairs AS pair
             MATCH (a:Skill {id: pair.a}), (b:Skill {id: pair.b})
             MERGE (a)-[r:CO_OCCURS_WITH]-(b)
             ON CREATE SET r.count = 1
             ON MATCH SET r.count = r.count + 1`,
            { pairs },
        );
        edgesCreated += pairs.length;
    }
    console.log(`Created/updated ${edgesCreated} co-occurrence edges across ${byVacancy.size} vacancies.`);

    await session.close();
    await driver.close();
    await prisma.$disconnect();

    console.log('\n=== Done! ===');
    console.log(`Skills seeded: ${done}`);
    console.log(`With embeddings: ${embedded}`);
    console.log(`Open Neo4j Browser: http://localhost:7474`);
    console.log(`Run: MATCH (s:Skill) RETURN count(s) AS total`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
