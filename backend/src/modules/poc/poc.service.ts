import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../database/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PocService {
    constructor(
        private prisma: PrismaService,
        private httpService: HttpService
    ) { }

    async runAnalysis(userId: string) {
        // 1. Get Profile
        const profile = await this.prisma.profile.findUnique({
            where: { userId },
        });

        if (!profile) {
            throw new Error('Profile not found');
        }

        // 2. Call Agent Service
        // Assuming Agent is running on localhost:3003
        const agentUrl = process.env.AGENT_URL || 'http://localhost:3003';

        try {
            const response = await firstValueFrom(
                this.httpService.post(`${agentUrl}/analyze`, {
                    profile,
                })
            );
            const analysis = response.data as any;

            // 3. Save Result
            const result = await this.prisma.analysisResult.create({
                data: {
                    profileId: profile.id,
                    content: analysis,
                },
            });

            return result;
        } catch (error) {
            console.error('Agent call failed:', error.message);
            throw new Error('Failed to run analysis');
        }
    }
}
