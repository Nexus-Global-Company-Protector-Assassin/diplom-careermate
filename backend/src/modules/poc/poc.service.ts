import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../database/prisma.service';
import { firstValueFrom } from 'rxjs';
import { RunPocDto } from './dto/run-poc.dto';

@Injectable()
export class PocService {
    constructor(
        private prisma: PrismaService,
        private httpService: HttpService
    ) { }

    async runAnalysis(dto: RunPocDto) {
        // 1. Get or Create Demo User
        let user = await this.prisma.user.findUnique({
            where: { email: 'demo_poc_user@careermate.ai' },
        });

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: 'demo_poc_user@careermate.ai',
                },
            });
        }

        // 2. Upsert Profile with data from frontend
        const profile = await this.prisma.profile.upsert({
            where: { userId: user.id },
            update: {
                fullName: dto.fullName,
                phone: dto.phone,
                location: dto.location,
                desiredPosition: dto.desiredPosition,
                experienceYears: dto.experienceYears,
                education: dto.education ? dto.education : undefined,
                workExperience: dto.workExperience ? dto.workExperience : undefined,
                skills: dto.skills ? dto.skills : undefined,
                aboutMe: dto.aboutMe,
            },
            create: {
                userId: user.id,
                fullName: dto.fullName,
                phone: dto.phone,
                location: dto.location,
                desiredPosition: dto.desiredPosition,
                experienceYears: dto.experienceYears,
                education: dto.education ? dto.education : undefined,
                workExperience: dto.workExperience ? dto.workExperience : undefined,
                skills: dto.skills ? dto.skills : undefined,
                aboutMe: dto.aboutMe,
            }
        });

        // 3. Call Agent Service
        // Assuming Agent is running on localhost:3003
        const agentUrl = process.env.AGENT_URL || 'http://localhost:3003';

        try {
            const response = await firstValueFrom(
                this.httpService.post(`${agentUrl}/ai/poc/run`, {
                    profileData: profile,
                })
            );
            const agentData = response.data.data;

            // The Agent handles analysis, vacancy matching, and resume generation internally
            const finalResultData = agentData;

            // 4. Save Result
            const result = await this.prisma.analysisResult.create({
                data: {
                    profileId: profile.id,
                    content: finalResultData,
                },
            });

            return result;
        } catch (error) {
            console.error('Agent call failed:', error.message);
            throw new Error('Failed to run analysis');
        }
    }

    async getLatestResult() {
        const user = await this.prisma.user.findUnique({
            where: { email: 'demo_poc_user@careermate.ai' },
            include: { profile: true }
        });

        if (!user || !user.profile) {
            return { content: null };
        }

        const profileId = user.profile.id;

        const result = await this.prisma.analysisResult.findFirst({
            where: { profileId },
            orderBy: { createdAt: 'desc' }
        });

        return result || { content: null };
    }
}

