import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { QuotaExceededException } from './quota.exception';

@Injectable()
export class QuotaService {
    constructor(
        private readonly redis: RedisService,
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
    ) {}

    get aiDailyLimit(): number {
        return Number(this.config.get('QUOTA_AI_DAILY') ?? 10);
    }

    get resumeLimit(): number {
        return Number(this.config.get('QUOTA_RESUMES') ?? 3);
    }

    get quizLimit(): number {
        return Number(this.config.get('QUOTA_QUIZ') ?? 3);
    }

    private aiKey(userId: string): string {
        const today = new Date().toISOString().split('T')[0];
        return `quota:ai:${userId}:${today}`;
    }

    /** Returns current AI usage without throwing. */
    async getAiUsage(userId: string): Promise<{ used: number; limit: number }> {
        const raw = await this.redis.get(this.aiKey(userId)).catch(() => null);
        return { used: raw ? parseInt(raw, 10) : 0, limit: this.aiDailyLimit };
    }

    /**
     * Call BEFORE an AI operation.
     * Throws QuotaExceededException if the daily limit is reached.
     */
    async assertAiCall(userId: string): Promise<void> {
        const { used, limit } = await this.getAiUsage(userId);
        if (used >= limit) {
            throw new QuotaExceededException('ai_daily', used, limit);
        }
    }

    /**
     * Call AFTER a successful AI operation to increment the counter.
     * Non-blocking — errors are swallowed so a Redis outage never breaks the response.
     */
    async commitAiCall(userId: string): Promise<void> {
        try {
            const key = this.aiKey(userId);
            const newVal = await this.redis.incr(key);
            if (newVal === 1) {
                await this.redis.expire(key, 90_000); // 25 h — survives midnight in any timezone
            }
        } catch { /* non-critical */ }
    }

    /**
     * Asserts that the user hasn't hit the resume limit.
     * Counts resumes of type 'resume' or 'uploaded_file' (cover letters excluded).
     */
    async assertResumeLimit(userId: string): Promise<void> {
        const profile = await this.prisma.profile.findFirst({
            where: { userId },
            select: { id: true },
        });
        if (!profile) return;

        const used = await this.prisma.resume.count({
            where: { profileId: profile.id, type: { in: ['resume', 'uploaded_file'] } },
        });

        if (used >= this.resumeLimit) {
            throw new QuotaExceededException('resumes', used, this.resumeLimit);
        }
    }

    /**
     * Asserts that the user hasn't exhausted career quiz attempts.
     */
    async assertQuizLimit(userId: string): Promise<void> {
        const profile = await this.prisma.profile.findFirst({
            where: { userId },
            select: { id: true },
        });
        if (!profile) return;

        const used = await this.prisma.careerAssessment.count({
            where: { profileId: profile.id },
        });

        if (used >= this.quizLimit) {
            throw new QuotaExceededException('quiz', used, this.quizLimit);
        }
    }

    /** Snapshot of all limits for the current user (for UI display). */
    async getStatus(userId: string) {
        const [aiUsage, profile] = await Promise.all([
            this.getAiUsage(userId),
            this.prisma.profile.findFirst({ where: { userId }, select: { id: true } }),
        ]);

        let resumeUsed = 0;
        let quizUsed = 0;

        if (profile) {
            [resumeUsed, quizUsed] = await Promise.all([
                this.prisma.resume.count({
                    where: { profileId: profile.id, type: { in: ['resume', 'uploaded_file'] } },
                }),
                this.prisma.careerAssessment.count({ where: { profileId: profile.id } }),
            ]);
        }

        return {
            ai:     { used: aiUsage.used,  limit: this.aiDailyLimit, resetsAt: 'midnight UTC' },
            resume: { used: resumeUsed,     limit: this.resumeLimit },
            quiz:   { used: quizUsed,       limit: this.quizLimit },
        };
    }
}
