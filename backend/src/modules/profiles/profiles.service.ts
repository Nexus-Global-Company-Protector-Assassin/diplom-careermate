import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';

@Injectable()
export class ProfilesService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, createProfileDto: CreateProfileDto) {
        return this.prisma.profile.upsert({
            where: { userId },
            update: {
                ...createProfileDto,
            },
            create: {
                userId,
                ...createProfileDto,
            },
        });
    }

    async findOne(userId: string) {
        return this.prisma.profile.findUnique({
            where: { userId },
            include: {
                analysisResults: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
    }
}
