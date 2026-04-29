import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
        });
    }

    async create(data: any): Promise<User> {
        const user = await this.prisma.user.create({ data });
        // Auto-provision an empty Profile so /profiles/me, /resumes/history, etc.
        // don't 404 for fresh accounts (Google OAuth or email-verified registration).
        await this.prisma.profile.upsert({
            where: { userId: user.id },
            update: {},
            create: { userId: user.id },
        });
        return user;
    }

    async update(id: string, data: any): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }
}
