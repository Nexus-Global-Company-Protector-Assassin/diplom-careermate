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
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async create(data: any): Promise<User> {
        return this.prisma.user.create({
            data,
        });
    }

    async update(id: string, data: any): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }
}
