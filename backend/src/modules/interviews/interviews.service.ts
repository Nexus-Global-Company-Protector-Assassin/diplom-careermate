import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InterviewsService {
    constructor(private readonly prisma: PrismaService) {}

    private async getProfileIdForUser(userId: string): Promise<string> {
        const profile = await this.prisma.profile.findFirst({ where: { userId } });
        if (!profile) {
            throw new NotFoundException('Профиль не найден');
        }
        return profile.id;
    }

    async getAll(userId: string) {
        const profileId = await this.getProfileIdForUser(userId);
        return this.prisma.interview.findMany({
            where: { profileId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(interview: any, userId: string) {
        const profileId = await this.getProfileIdForUser(userId);
        return this.prisma.interview.create({
            data: {
                profileId,
                company: interview.company,
                position: interview.position,
                date: interview.date,
                time: interview.time,
                type: interview.type || 'online',
                location: interview.location,
                notes: interview.notes,
                status: 'upcoming',
            },
        });
    }

    async updateStatus(id: string, status: string) {
        return this.prisma.interview.update({
            where: { id },
            data: { status },
        });
    }
}
