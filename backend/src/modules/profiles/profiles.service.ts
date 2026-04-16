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

    private async getPocUserId(providedId?: string) {
        if (providedId) return providedId;
        let user = await this.prisma.user.findFirst();
        if (!user) {
            user = await this.prisma.user.create({ data: { email: 'poc-demo@careermate.ru' } });
        }
        return user.id;
    }

    async getProfile(userId?: string) {
        const id = await this.getPocUserId(userId);
        const profile = await this.prisma.profile.findUnique({
            where: { userId: id },
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

    async createProfile(userId: string | undefined, createProfileDto: CreateProfileDto) {
        const id = await this.getPocUserId(userId);
        const data = toProfileData(createProfileDto);
        return this.prisma.profile.upsert({
            where: { userId: id },
            update: data,
            create: { userId: id, ...data },
        });
    }

    async updateProfile(userId: string | undefined, updateProfileDto: UpdateProfileDto) {
        const id = await this.getPocUserId(userId);
        const profile = await this.prisma.profile.findUnique({ where: { userId: id } });
        if (!profile) {
            throw new NotFoundException('Profile not found. Create a profile first.');
        }
        const data = toProfileData(updateProfileDto);
        return this.prisma.profile.update({
            where: { userId: id },
            data,
        });
    }

    async deleteProfile(userId?: string) {
        const id = await this.getPocUserId(userId);
        const profile = await this.prisma.profile.findUnique({ where: { userId: id } });
        if (!profile) {
            throw new NotFoundException('Profile not found');
        }
        await this.prisma.profile.delete({ where: { userId: id } });
        return { message: 'Profile deleted successfully' };
    }
}


