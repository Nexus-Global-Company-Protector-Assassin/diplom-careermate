import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

/** Convert DTO to Prisma-compatible data (Json fields must be cast to any) */
function toProfileData(dto: CreateProfileDto | UpdateProfileDto) {
    const { education, workExperience, skills, languages, ...rest } = dto as any;
    return {
        ...rest,
        ...(education !== undefined ? { education: education as any } : {}),
        ...(workExperience !== undefined ? { workExperience: workExperience as any } : {}),
        ...(skills !== undefined ? { skills: skills as any } : {}),
        ...(languages !== undefined ? { languages: languages as any } : {}),
    };
}

@Injectable()
export class ProfilesService {
    constructor(private prisma: PrismaService) { }

    async getProfile(userId: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
            include: {
                analysisResults: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
        if (!profile) {
            throw new NotFoundException('Profile not found');
        }
        return profile;
    }

    async createProfile(userId: string, createProfileDto: CreateProfileDto) {
        const data = toProfileData(createProfileDto);
        return this.prisma.profile.upsert({
            where: { userId },
            update: data,
            create: { userId, ...data },
        });
    }

    async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
        const profile = await this.prisma.profile.findUnique({ where: { userId } });
        if (!profile) {
            throw new NotFoundException('Profile not found. Create a profile first.');
        }
        const data = toProfileData(updateProfileDto);
        return this.prisma.profile.update({
            where: { userId },
            data,
        });
    }

    async deleteProfile(userId: string) {
        const profile = await this.prisma.profile.findUnique({ where: { userId } });
        if (!profile) {
            throw new NotFoundException('Profile not found');
        }
        await this.prisma.profile.delete({ where: { userId } });
        return { message: 'Profile deleted successfully' };
    }
}


