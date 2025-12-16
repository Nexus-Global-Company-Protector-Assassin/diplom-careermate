import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.upsert({
        where: { email: 'demo@careermate.com' },
        update: {},
        create: {
            id: 'demo-user-id',
            email: 'demo@careermate.com',
            password: 'password', // In real app, this should be hashed
            fullName: 'Demo User',
        },
    });
    console.log({ user });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
