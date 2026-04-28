import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { detectArchetype } from './vacancies.utils';

export interface PreferenceVector {
    archetype: Record<string, number>;
    salary_band: Record<string, number>;
    work_format: Record<string, number>;
    seniority: Record<string, number>;
}

export interface VacancyFeatures {
    archetype: Record<string, number>;
    salary_band: Record<string, number>;
    work_format: Record<string, number>;
    seniority: Record<string, number>;
}

const WEIGHTS: Record<string, number> = { analyze: 4, apply: 5, favorite: 3, click: 1, dismiss: -6 };
const LAMBDA = Math.log(2) / 30; // half-life 30 days

@Injectable()
export class UserPreferencesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
    ) {}

    async compute(profileId: string): Promise<PreferenceVector> {
        const cacheKey = `prefs:v1:${profileId}`;
        try {
            const cached = await this.redis.get(cacheKey);
            if (cached) return JSON.parse(cached) as PreferenceVector;
        } catch { /* Redis unavailable — fall through */ }

        const interactions = await this.prisma.vacancyInteraction.findMany({
            where: { profileId },
            include: {
                vacancy: {
                    select: {
                        title: true,
                        descriptionPreview: true,
                        salaryFrom: true,
                        salaryTo: true,
                        schedule: true,
                        location: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });

        const raw: PreferenceVector = { archetype: {}, salary_band: {}, work_format: {}, seniority: {} };

        for (const i of interactions) {
            if (!i.vacancy) continue;
            const w = this.decayedWeight(i.type, i.createdAt);
            const features = this.extractVacancyFeatures(i.vacancy);
            const dims: Array<keyof PreferenceVector> = ['archetype', 'salary_band', 'work_format', 'seniority'];
            for (const dim of dims) {
                for (const [k, v] of Object.entries(features[dim])) {
                    raw[dim][k] = (raw[dim][k] || 0) + w * v;
                }
            }
        }

        const prefs: PreferenceVector = {
            archetype: this.softmaxPositive(raw.archetype),
            salary_band: this.softmaxPositive(raw.salary_band),
            work_format: this.softmaxPositive(raw.work_format),
            seniority: this.softmaxPositive(raw.seniority),
        };

        try {
            await this.redis.set(cacheKey, JSON.stringify(prefs), 3600);
        } catch { /* non-critical */ }

        return prefs;
    }

    extractVacancyFeatures(vacancy: {
        title?: string | null;
        descriptionPreview?: string | null;
        salaryFrom?: number | null;
        salaryTo?: number | null;
        schedule?: string | null;
        location?: string | null;
    }): VacancyFeatures {
        const features: VacancyFeatures = { archetype: {}, salary_band: {}, work_format: {}, seniority: {} };

        const arch = detectArchetype(vacancy.title || '', vacancy.descriptionPreview || '');
        if (arch !== 'Unknown') features.archetype[arch] = 1;

        const avg =
            vacancy.salaryFrom != null && vacancy.salaryTo != null
                ? (vacancy.salaryFrom + vacancy.salaryTo) / 2
                : vacancy.salaryFrom ?? vacancy.salaryTo ?? null;
        if (avg !== null) {
            features.salary_band[avg < 30000 ? 'low' : avg <= 70000 ? 'mid' : 'high'] = 1;
        }

        const sched = (vacancy.schedule || '').toLowerCase();
        const loc = (vacancy.location || '').toLowerCase();
        if (sched || loc) {
            const isRemote =
                sched.includes('удал') || sched.includes('remote') ||
                loc.includes('удал') || loc.includes('remote');
            features.work_format[isRemote ? 'remote' : 'onsite'] = 1;
        }

        const sen = this.extractSeniority(vacancy.title || '');
        if (sen) features.seniority[sen] = 1;

        return features;
    }

    extractSeniority(title: string): string | null {
        const t = title.toLowerCase();
        if (/junior|джуниор|intern|стажер|trainee/.test(t)) return 'junior';
        if (/middle|мидл/.test(t)) return 'mid';
        if (/senior|сеньор|старший/.test(t)) return 'senior';
        if (/lead|лид|principal|director/.test(t)) return 'lead';
        return null;
    }

    computePersonalScore(prefs: PreferenceVector, features: VacancyFeatures): number {
        const dims: Array<keyof PreferenceVector> = ['archetype', 'salary_band', 'work_format', 'seniority'];
        const scores: number[] = [];
        for (const dim of dims) {
            if (Object.keys(features[dim]).length === 0 || Object.keys(prefs[dim]).length === 0) continue;
            scores.push(this.dotProduct(prefs[dim], features[dim]));
        }
        if (scores.length === 0) return 0;
        return scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    async invalidateCache(profileId: string): Promise<void> {
        try {
            await this.redis.del(`prefs:v1:${profileId}`);
        } catch { /* non-critical */ }
    }

    private decayedWeight(type: string, createdAt: Date): number {
        const daysAgo = (Date.now() - createdAt.getTime()) / 86400000;
        return (WEIGHTS[type] || 0) * Math.exp(-LAMBDA * daysAgo);
    }

    private softmaxPositive(scores: Record<string, number>): Record<string, number> {
        const hasPositive = Object.values(scores).some(v => v > 0);
        if (!hasPositive) return {};
        const keys = Object.keys(scores);
        const vals = keys.map(k => scores[k]);
        const max = Math.max(...vals);
        const exps = vals.map(v => Math.exp(v - max));
        const sum = exps.reduce((a, b) => a + b, 0);
        return Object.fromEntries(keys.map((k, i) => [k, exps[i] / sum]));
    }

    private dotProduct(a: Record<string, number>, b: Record<string, number>): number {
        return Object.entries(b).reduce((sum, [k, v]) => sum + (a[k] || 0) * v, 0);
    }
}
