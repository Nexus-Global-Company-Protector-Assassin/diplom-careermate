import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // 1. Load skills taxonomy
    const skillsPath = path.join(__dirname, 'data', 'skills.json');
    if (fs.existsSync(skillsPath)) {
        const skillsData = JSON.parse(fs.readFileSync(skillsPath, 'utf8'));
        console.log(`Loading ${skillsData.length} skills from taxonomy...`);

        let count = 0;
        for (const skill of skillsData) {
            await prisma.skill.upsert({
                where: { name: skill.name },
                update: {
                    category: skill.category,
                    aliases: skill.aliases || [],
                },
                create: {
                    name: skill.name,
                    category: skill.category,
                    aliases: skill.aliases || [],
                },
            });
            count++;
            if (count % 100 === 0) console.log(`  upserted ${count} skills...`);
        }
        console.log(`✅ Successfully seeded ${count} canonical IT skills.`);
    } else {
        console.warn(`⚠️ Warning: ${skillsPath} not found. Skipping skills taxonomy.`);
    }

    console.log('✅ Seeding finished successfully.');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:');
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
