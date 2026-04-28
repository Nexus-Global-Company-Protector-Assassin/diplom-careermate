import { Injectable, Logger } from '@nestjs/common';
import { LlmGatewayService } from '../llm/llm-gateway.service';
import { CacheService } from '../cache/cache.service';
import {
    ProfileAnalysis,
    ProfileAnalysisSchema,
} from '../schemas/profile-analysis.schema';

export interface ProfileData {
    fullName?: string;
    desiredPosition?: string;
    experienceYears?: number;
    skills?: string[];
    workExperience?: Array<{
        company: string;
        position: string;
        duration?: string;
        description?: string;
    }>;
    education?: Array<{
        institution: string;
        degree: string;
    }>;
    aboutMe?: string;
    careerGoals?: string;
}

@Injectable()
export class AnalyzeProfileTool {
    private readonly logger = new Logger(AnalyzeProfileTool.name);

    constructor(
        private readonly llmGateway: LlmGatewayService,
        private readonly cacheService: CacheService,
    ) { }

    async run(profileData: ProfileData): Promise<ProfileAnalysis> {
        this.logger.log(
            `[analyze_profile] Running for: ${profileData.fullName ?? 'unknown'}`,
        );

        const hash = this.cacheService.generateHash(profileData);
        const cacheKey = `ai:profile-analysis:${hash}`;

        return this.cacheService.getOrSet(cacheKey, async () => {
            const profileContext = this.buildProfileContext(profileData);

            const result = await this.llmGateway.generateJson(
                [
                    {
                        role: 'user',
                        content: `Проанализируй профиль специалиста и верни JSON строго по схеме.

ПРОФИЛЬ:
${profileContext}

Верни JSON объект со следующими полями:
- skills: string[] — список ключевых технических и soft-навыков кандидата
- level: "Junior" | "Middle" | "Senior" — уровень специалиста
- skillGaps: string[] — навыки, которых не хватает для желаемой роли
- score: number (0-100) — общий скор профиля
- summary: string — краткий анализ (2-3 предложения)
- desiredRole: string — определённая желаемая роль (опционально)
- strengths: string[] — ключевые сильные стороны (опционально)

Важно:
- Оценивай реалистично, не льсти
- skillGaps должны быть конкретными (не "опыт", а "Redux", "микросервисы")
- score 0-100 по совокупности: опыт, навыки, образование`,
                    },
                ],
                ProfileAnalysisSchema,
                { model: this.llmGateway.getModels().fast, temperature: 0.3 },
            );

            this.logger.log(
                `[analyze_profile] Done: level=${result.data.level}, score=${result.data.score}`,
            );

            return result.data;
        });
    }

    private buildProfileContext(profile: ProfileData): string {
        const lines: string[] = [];

        if (profile.fullName) lines.push(`Имя: ${profile.fullName}`);
        if (profile.desiredPosition)
            lines.push(`Желаемая позиция: ${profile.desiredPosition}`);
        if (profile.experienceYears !== undefined)
            lines.push(`Лет опыта: ${profile.experienceYears}`);

        if (profile.skills?.length) {
            lines.push(`\nНавыки: ${profile.skills.join(', ')}`);
        }

        if (profile.workExperience?.length) {
            lines.push('\nОпыт работы:');
            for (const exp of profile.workExperience) {
                lines.push(`  - ${exp.position} в ${exp.company}`);
                if (exp.duration) lines.push(`    Длительность: ${exp.duration}`);
                if (exp.description) lines.push(`    ${exp.description}`);
            }
        }

        if (profile.education?.length) {
            lines.push('\nОбразование:');
            for (const edu of profile.education) {
                lines.push(`  - ${edu.degree}, ${edu.institution}`);
            }
        }

        if (profile.aboutMe) lines.push(`\nО себе: ${profile.aboutMe}`);
        if (profile.careerGoals)
            lines.push(`Карьерные цели: ${profile.careerGoals}`);

        return lines.join('\n');
    }
}
