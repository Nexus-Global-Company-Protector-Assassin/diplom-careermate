import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SkillsService } from '../skills/skills.service';

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

/**
 * Skills from the frontend arrive as { technical: string[], professional: string[] }.
 * This helper flattens that into a single string[] for normalization.
 * Also handles the case where skills is already a plain string[].
 */
function flattenSkills(skills: any): string[] {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills.filter((s): s is string => typeof s === 'string');
    const result: string[] = [];
    if (Array.isArray(skills.technical)) result.push(...skills.technical.filter((s: any) => typeof s === 'string'));
    if (Array.isArray(skills.professional)) result.push(...skills.professional.filter((s: any) => typeof s === 'string'));
    return result;
}

@Injectable()
export class ProfilesService {
    constructor(
        private prisma: PrismaService,
        private readonly skillsService: SkillsService,
    ) { }

    async getProfile(userId: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
            include: {
                analysisResults: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                profileSkills: {
                    include: { skill: true },
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
        const profile = await this.prisma.profile.upsert({
            where: { userId },
            update: data,
            create: { userId, ...data },
        });

        // Sync normalized skills — flatten { technical, professional } → string[]
        const flatSkills = flattenSkills((createProfileDto as any).skills);
        if (flatSkills.length > 0) {
            await this.skillsService.syncProfileSkills(profile.id, flatSkills);
        }

        return profile;
    }

    async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
        const profile = await this.prisma.profile.findUnique({ where: { userId } });
        if (!profile) {
            throw new NotFoundException('Profile not found. Create a profile first.');
        }
        const data = toProfileData(updateProfileDto);
        const updated = await this.prisma.profile.update({
            where: { userId },
            data,
        });

        // Sync normalized skills — flatten { technical, professional } → string[]
        const flatSkills = flattenSkills((updateProfileDto as any).skills);
        if (flatSkills.length > 0) {
            await this.skillsService.syncProfileSkills(updated.id, flatSkills);
        }

        return updated;
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


