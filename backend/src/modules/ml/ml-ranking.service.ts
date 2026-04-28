import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PreferenceVector } from '../vacancies/user-preferences.service';

export interface MlRankResult {
    vacancyId: string;
    score: number;
}

interface MlRankResponse {
    ranked: Array<{ vacancy_id: string; score: number }>;
    model_version: string;
    is_shadow: boolean;
}

@Injectable()
export class MlRankingService {
    private readonly logger = new Logger(MlRankingService.name);

    constructor(
        private readonly http: HttpService,
        private readonly config: ConfigService,
    ) {}

    isEnabled(): boolean {
        return !!this.config.get<string>('ML_SERVICE_URL');
    }

    isShadowMode(): boolean {
        return this.config.get<string>('ML_SHADOW_MODE', 'true') !== 'false';
    }

    /**
     * Calls ml-service to rank vacancy candidates.
     *
     * In shadow mode (default): calls ml-service, logs the comparison,
     * but returns an empty Map so the caller uses rule-based scores.
     *
     * When ML_SHADOW_MODE=false: returns ml-service scores for actual re-ranking.
     *
     * Always returns empty Map if ml-service is unavailable — caller must not crash.
     */
    async rank(
        profileId: string,
        vacancies: Array<{ id: string; title?: string; descriptionPreview?: string; salaryFrom?: number | null; salaryTo?: number | null; schedule?: string | null; location?: string | null; skills?: string[] }>,
        prefs: PreferenceVector,
        totalInteractions = 0,
        positiveInteractions = 0,
    ): Promise<Map<string, number>> {
        if (!this.isEnabled() || vacancies.length === 0) return new Map();

        const url = `${this.config.get<string>('ML_SERVICE_URL')}/ml/rank`;

        try {
            const { data } = await firstValueFrom(
                this.http.post<MlRankResponse>(
                    url,
                    {
                        profile_id: profileId,
                        candidates: vacancies.map(v => ({
                            id: v.id,
                            title: v.title ?? '',
                            description: v.descriptionPreview ?? '',
                            salary_from: v.salaryFrom ?? null,
                            salary_to: v.salaryTo ?? null,
                            schedule: v.schedule ?? null,
                            location: v.location ?? null,
                            skill_count: Array.isArray(v.skills) ? v.skills.length : 0,
                            days_old: 0,
                        })),
                        profile_features: prefs,
                        total_interactions: totalInteractions,
                        positive_interactions: positiveInteractions,
                    },
                    { timeout: 3000 },
                ),
            );

            this.logger.log(
                `[ML] Ranked ${data.ranked.length} vacancies, model=${data.model_version}, shadow=${data.is_shadow}`,
            );

            if (this.isShadowMode()) {
                const mlTop3 = data.ranked.slice(0, 3).map(r => r.vacancy_id).join(',');
                this.logger.debug(`[ML Shadow] ml-service TOP-3: ${mlTop3}`);
                return new Map(); // don't apply ML scores yet
            }

            return new Map(data.ranked.map(r => [r.vacancy_id, r.score]));
        } catch (e: any) {
            this.logger.warn(`[ML] Service unavailable (${url}): ${e.message}`);
            return new Map();
        }
    }
}
