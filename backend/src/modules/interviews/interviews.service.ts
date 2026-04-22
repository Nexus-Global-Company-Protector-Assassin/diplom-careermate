import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InterviewsService {
    constructor(private readonly prisma: PrismaService) {}

    // For PoC we use the first available Profile
    private async getProfileId() {
        const profile = await this.prisma.profile.findFirst();
        if (!profile) {
            throw new NotFoundException('Должен существовать хотя бы один профиль (demo user)');
        }
        return profile.id;
    }

    async getAll() {
        const profileId = await this.getProfileId();
        return this.prisma.interview.findMany({
            where: { profileId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(interview: any) {
        const profileId = await this.getProfileId();
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
