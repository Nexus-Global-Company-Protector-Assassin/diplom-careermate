import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AiService } from '../ai/ai.service';
import { SkillsService } from '../skills/skills.service';
import { EmbeddingsService } from '../ai/embeddings/embeddings.service';
import { QuestionGenService } from '../interviews/question-gen/question-gen.service';

// Adzuna API base URL
const ADZUNA_API = 'https://api.adzuna.com/v1/api/jobs';

// Local skills extraction removed. Now using SkillsService with LLM.
// ---------------------------------------------------------------------------
// Archetype Detection — inspired by career-ops role classification
// ---------------------------------------------------------------------------
export type RoleArchetype = 'Backend' | 'Frontend' | 'Fullstack' | 'Mobile' | 'DevOps' | 'ML/Data' | 'QA' | 'Manager' | 'Unknown';

export function detectArchetype(title: string, description: string): RoleArchetype {
    const text = `${title} ${description}`.toLowerCase();

    const signals: Record<RoleArchetype, string[]> = {
        'ML/Data': ['machine learning', 'ml ', ' ml,', 'data science', 'data scientist', 'nlp', 'computer vision', 'deep learning', 'pytorch', 'tensorflow', 'sklearn', 'scikit', 'data analyst', 'аналитик данных', 'data engineer', 'etl', 'spark', 'hadoop', 'airflow', 'bigquery', 'snowflake'],
        'DevOps': ['devops', 'sre', 'site reliability', 'kubernetes', 'k8s', 'docker', 'terraform', 'ansible', 'ci/cd', 'jenkins', 'gitlab ci', 'github actions', 'infrastructure', 'инфраструктур', 'облачн', 'cloud engineer', 'platform engineer'],
        'Mobile': ['android', 'ios', 'swift', 'kotlin', 'react native', 'flutter', 'mobile developer', 'мобильн'],
        'Frontend': ['frontend', 'фронтенд', 'front-end', 'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'ui developer', 'web developer', 'верстальщик', 'html/css'],
        'Backend': ['backend', 'бэкенд', 'back-end', 'node.js', 'python developer', 'java developer', 'golang', 'go developer', 'php developer', 'ruby', 'spring', 'django', 'fastapi', 'nestjs', 'серверн'],
        'Fullstack': ['fullstack', 'full stack', 'full-stack', 'фулстек', 'full stack developer'],
        'QA': ['qa ', 'quality assurance', 'tester', 'тестировщик', 'тестировани', 'automation qa', 'manual qa', 'sdet', 'selenium', 'cypress', 'playwright'],
        'Manager': ['product manager', 'project manager', 'engineering manager', 'team lead', 'tech lead', 'scrum master', 'менеджер продукта', 'руководитель', 'тимлид', 'cto', 'vp of engineering'],
        'Unknown': [],
    };

    const scores: Partial<Record<RoleArchetype, number>> = {};
    for (const [archetype, keywords] of Object.entries(signals)) {
        if (archetype === 'Unknown') continue;
        let score = 0;
        for (const kw of keywords) {
            if (text.includes(kw)) score++;
        }
        if (score > 0) scores[archetype as RoleArchetype] = score;
    }

    // Fullstack check: if BOTH frontend and backend signals are strong
    const fScore = scores['Frontend'] || 0;
    const bScore = scores['Backend'] || 0;
    if (fScore >= 2 && bScore >= 2) return 'Fullstack';
    if (scores['Fullstack'] && scores['Fullstack']! >= 1) return 'Fullstack';

    if (Object.keys(scores).length === 0) return 'Unknown';
    const best = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
    return best ? (best[0] as RoleArchetype) : 'Unknown';
}

// ---------------------------------------------------------------------------
// Vacancy Freshness Score — returns 0-100
// Inspired by career-ops Block G: Posting Legitimacy
// ---------------------------------------------------------------------------
export function calcVacancyFreshness(publishedAt: Date | null | undefined, createdAt: Date, updatedAt?: Date | null): {
    score: number;
    label: string;
    daysOld: number;
} {
    const now = new Date();
    const ref = publishedAt || updatedAt || createdAt;
    const daysOld = Math.floor((now.getTime() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24));

    let score: number;
    let label: string;

    if (daysOld <= 3) {
        score = 100;
        label = 'Только что';
    } else if (daysOld <= 7) {
        score = 90;
        label = 'Свежая';
    } else if (daysOld <= 14) {
        score = 75;
        label = 'Активная';
    } else if (daysOld <= 30) {
        score = 55;
        label = 'Может быть устаревшей';
    } else if (daysOld <= 60) {
        score = 30;
        label = 'Подозрительная';
    } else {
        score = 10;
        label = 'Вероятно закрытая';
    }

    return { score, label, daysOld };
}

// ---------------------------------------------------------------------------
// Gap Analysis — returns matched/missing skills
// ---------------------------------------------------------------------------
export interface SkillGapResult {
    matchedSkills: string[];
    missingSkills: string[];
    score: number; // 0-100
}

function analyzeSkillGap(
    vSkills: string[],
    vDesc: string,
    pSkills: string[]
): SkillGapResult {
    const normalise = (s: string) => s.toLowerCase().trim();

    const allVSkillsSet = new Set((vSkills || []).map(normalise));
    // Local skills extraction removed. Desc is now processed during save.

    if (pSkills.length === 0 || allVSkillsSet.size === 0) {
        return { matchedSkills: [], missingSkills: [], score: 50 };
    }

    const profSet = new Set(pSkills.map(normalise));
    const matched: string[] = [];
    const missing: string[] = [];

    for (const vs of allVSkillsSet) {
        if (profSet.has(vs)) {
            matched.push(vs);
        } else {
            missing.push(vs);
        }
    }

    const union = new Set([...profSet, ...allVSkillsSet]);
    const jaccard = matched.length / union.size;
    const recall = matched.length / pSkills.length;
    const score = Math.min(100, Math.round(jaccard * 40 + recall * 60));

    return {
        matchedSkills: matched.slice(0, 10),
        missingSkills: missing.slice(0, 8),
        score,
    };
}

// ---------------------------------------------------------------------------
// Match calculation — returns score + human-readable reasons
// ---------------------------------------------------------------------------
export interface MatchResult {
    score: number;
    reasons: string[];
}

function calcMatch(
    vTitle: string,
    vSkills: string[],
    vDesc: string,
    vSalFrom: number | null | undefined,
    vSalTo: number | null | undefined,
    vCurrency: string | null | undefined,
    vLabel: string | null | undefined,
    dPos: string,
    pSkills: string[],
    pSalary: number | null | undefined
): MatchResult {
    const W_ROLE = 0.25; const W_SKILLS = 0.30; const W_SENIORITY = 0.15;
    const W_SALARY = 0.15; const W_DESC = 0.05; const W_ARCHETYPE = 0.10;
    
    let roleScore = 0; let seniorityScore = 0; let salaryScore = 0; let descScore = 0; let archetypeScore = 0;
    vTitle = (vTitle || '').toLowerCase();
    dPos = (dPos || '').toLowerCase();
    const descLower = (vDesc || '').toLowerCase();

    // 1. Role Score
    if (dPos && vTitle) {
        const roleKws = dPos.split(/\s+/).filter(w => w.length > 2);
        if (roleKws.length > 0) {
            const hits = roleKws.filter(kw => vTitle.includes(kw)).length;
            const ratio = hits / roleKws.length;
            roleScore = ratio >= 1 ? 100 : ratio > 0 ? 40 + ratio * 55 : 8;
        } else roleScore = 50;
    } else roleScore = 50;

    // 2. Seniority Score
    const getSen = (s: string) => {
        if (/junior|джуниор|intern|стажер|trainee/.test(s)) return 1;
        if (/middle|мидл/.test(s)) return 2;
        if (/senior|сеньор|старший/.test(s)) return 3;
        if (/lead|лид|principal|director/.test(s)) return 4;
        return 0;
    };
    const vSen = getSen(vTitle), dSen = getSen(dPos);
    if (vSen && dSen) {
        seniorityScore = vSen === dSen ? 100 : Math.abs(vSen - dSen) === 1 ? 55 : 15;
    } else seniorityScore = (vSen === 0 && dSen === 0) ? 70 : 50;

    // 3. Skills via Gap Analysis
    const gap = analyzeSkillGap(vSkills, descLower, pSkills);
    const skillScore = gap.score;

    // 4. Salary Score
    const getRate = (cur: string) => {
        const c = (cur || '').toUpperCase();
        if (c.includes('GBP') || c.includes('£')) return 115;
        if (c.includes('USD') || c.includes('$')) return 90;
        if (c.includes('EUR') || c.includes('€')) return 100;
        return 1;
    };
    if (pSalary && (vSalFrom || vSalTo)) {
        const rate = getRate(vCurrency || vLabel || '');
        let avg = vSalFrom && vSalTo ? (vSalFrom + vSalTo) / 2 : vSalFrom || vSalTo || 0;
        avg *= rate;
        const r = avg / pSalary;
        salaryScore = r >= 1.2 ? 100 : r >= 0.9 ? 80 + (r - 0.9) / 0.3 * 20 : r >= 0.5 ? 30 + (r - 0.5) / 0.4 * 50 : Math.max(0, r * 60);
    } else if (!pSalary && (vSalFrom || vSalTo)) {
        const avg = ((vSalFrom || 0) + (vSalTo || 0)) / 2;
        salaryScore = avg > 0 ? Math.min(80, 50 + Math.log10(avg) * 5) : 50;
    } else salaryScore = 50;

    // 5. Description relevance
    if (dPos && descLower) {
        const kws = dPos.split(/\s+/).filter(w => w.length > 2);
        if (kws.length > 0) {
            const hits = kws.reduce((sum, kw) => {
                const cnt = (descLower.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
                return sum + Math.min(cnt, 3);
            }, 0);
            descScore = Math.min(100, (hits / (kws.length * 2)) * 100);
        } else descScore = 50;
    } else {
        descScore = 50;
    }

    // 6. Archetype alignment bonus (NEW)
    // If candidate's desired position archetype matches vacancy archetype → bonus
    const desiredArchetype = detectArchetype(dPos, '');
    const vacancyArchetype = detectArchetype(vTitle, descLower);
    if (desiredArchetype !== 'Unknown' && vacancyArchetype !== 'Unknown') {
        if (desiredArchetype === vacancyArchetype) archetypeScore = 100;
        else if (
            // Fullstack overlaps with Frontend/Backend
            (desiredArchetype === 'Fullstack' && (vacancyArchetype === 'Frontend' || vacancyArchetype === 'Backend')) ||
            (vacancyArchetype === 'Fullstack' && (desiredArchetype === 'Frontend' || desiredArchetype === 'Backend'))
        ) archetypeScore = 65;
        else archetypeScore = 20;
    } else {
        archetypeScore = 50; // unknown archetype — neutral
    }

    let finalScore =
        roleScore      * W_ROLE +
        skillScore     * W_SKILLS +
        seniorityScore * W_SENIORITY +
        salaryScore    * W_SALARY +
        descScore      * W_DESC +
        archetypeScore * W_ARCHETYPE;

    // Penalties for terrible fits
    if (roleScore <= 8)        finalScore *= 0.3;
    if (seniorityScore <= 15)  finalScore *= 0.65;
    if (archetypeScore <= 20 && desiredArchetype !== 'Unknown') finalScore *= 0.80;

    const score = Math.max(0, Math.min(100, Math.round(finalScore)));

    // Build human-readable reasons
    const reasons: string[] = [];
    if (roleScore >= 70) reasons.push('Должность совпадает');
    else if (roleScore <= 8) reasons.push('Должность не совпадает');

    const gap2 = analyzeSkillGap(vSkills, (vDesc || '').toLowerCase(), pSkills);
    if (gap2.matchedSkills.length > 0) {
        reasons.push(`Навыки совпадают: ${gap2.matchedSkills.slice(0, 3).join(', ')}`);
    }
    if (gap2.missingSkills.length > 0) {
        reasons.push(`Нет в профиле: ${gap2.missingSkills.slice(0, 3).join(', ')}`);
    }
    if (seniorityScore >= 70) reasons.push('Уровень совпадает');
    if (salaryScore >= 80) reasons.push('Зарплата соответствует ожиданиям');
    if (archetypeScore === 100) reasons.push(`Тип роли совпадает (${vacancyArchetype})`);

    return { score, reasons };
}



function mapSchedule(contractType?: string, contractTime?: string): string | null {
    const type = (contractType || '').toLowerCase();
    const time = (contractTime || '').toLowerCase();
    if (type === 'permanent') return 'Полная занятость';
    if (type === 'contract') return 'Контракт';
    if (type === 'part_time' || time === 'part_time') return 'Частичная занятость';
    if (time === 'full_time') return 'Полный день';
    return null;
}

export interface VacancyFilters {
    query?: string;
    salaryFrom?: number;
    salaryTo?: number;
    remote?: boolean;
    experience?: string;
    location?: string;
    limit?: number;
}

@Injectable()
export class VacanciesService {
    private readonly logger = new Logger(VacanciesService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly aiService: AiService,
        private readonly skillsService: SkillsService,
        private readonly embeddingsService: EmbeddingsService,
        private readonly questionGenService: QuestionGenService,
    ) { }

    /**
     * Get vacancies from DB with optional filters
     */
    async getVacancies(filters: VacancyFilters = {}) {
        // Clean up expired vacancies before returning results
        await this.cleanupExpiredVacancies();

        const { query, salaryFrom, salaryTo, remote, experience, limit = 20 } = filters;

        const where: any = {};

        if (query) {
            where.searchQuery = { contains: query, mode: 'insensitive' };
        }

        if (salaryFrom !== undefined) {
            where.salaryFrom = { gte: salaryFrom };
        }

        if (salaryTo !== undefined) {
            where.salaryTo = { lte: salaryTo };
        }

        if (filters.location) {
            where.location = { contains: filters.location, mode: 'insensitive' };
        }

        if (remote === true) {
            where.OR = [
                { schedule: { contains: 'удал', mode: 'insensitive' } },
                { location: { contains: 'удал', mode: 'insensitive' } },
            ];
        }

        if (experience && experience !== 'any') {
            const expMap: Record<string, string> = {
                'no-exp': 'Нет опыта',
                '1-3': 'От 1 года до 3 лет',
                '3-6': 'От 3 до 6 лет',
                '6+': 'От 6 лет',
            };
            if (expMap[experience]) {
                where.experience = { contains: expMap[experience].split(' ')[0], mode: 'insensitive' };
            }
        }

        return this.prisma.vacancy.findMany({
            where,
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
            take: limit,
        });
    }

    /**
     * Get top-10 recommended vacancies for a user profile.
     * Auto-fetches from Adzuna if DB is nearly empty for this position.
     */
    async getRecommendedForProfile(
        position: string,
        profileSkills: string[],
        limit = 10,
        salary?: number
    ): Promise<any[]> {
        // Check if we have enough vacancies for this position in DB
        const existing = await this.prisma.vacancy.count({
            where: { searchQuery: { contains: position, mode: 'insensitive' } },
        });

        // Auto-fetch if DB is sparse for this search
        if (existing < 5 && position) {
            this.logger.log(`[Recommended] DB sparse (${existing} rows) for "${position}", auto-fetching from Adzuna`);
            try {
                await this.searchAndSave(position, 10);
            } catch {
                this.logger.warn('[Recommended] Auto-fetch failed, using available data');
            }
        }

        // Fetch all vacancies related to the position
        // Clean up expired vacancies
        await this.cleanupExpiredVacancies();

        const dbVacancies: any[] = await this.prisma.vacancy.findMany({
            where: position
                ? { searchQuery: { contains: position, mode: 'insensitive' } }
                : {},
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
            take: 50, // fetch wider set, rank by match
        });

        // ── Semantic re-ranking via Pinecone ─────────────────────────────────
        const queryText = [position, ...profileSkills].filter(Boolean).join(' ');
        const semanticRank = new Map<string, number>(); // vacancyId → normalized score 0–1

        try {
            const semanticIds = await this.embeddingsService.searchSimilar(queryText, 20);

            // Fetch any Pinecone results not already in the keyword set
            const dbIdSet = new Set(dbVacancies.map((v: any) => v.id));
            const extraIds = semanticIds.filter(id => !dbIdSet.has(id));
            if (extraIds.length > 0) {
                const extra = await this.prisma.vacancy.findMany({
                    where: { id: { in: extraIds } },
                });
                dbVacancies.push(...extra);
            }

            // Normalize position → score: rank 0 = 1.0, last rank = 0.0
            semanticIds.forEach((id, idx) => {
                const n = semanticIds.length;
                semanticRank.set(id, n === 1 ? 1.0 : 1 - idx / (n - 1));
            });
        } catch (e: any) {
            this.logger.warn(`[Semantic] Search failed, using keyword-only: ${e.message}`);
        }
        // ─────────────────────────────────────────────────────────────────────

        // Calculate match, archetype, gap, freshness, and combined score for each
        const ranked = dbVacancies
            .map((v: any) => {
                const skills = Array.isArray(v.skills) ? (v.skills as string[]) : [];
                const desc = v.descriptionPreview || '';

                const matchResult = calcMatch(
                    v.title, skills, desc,
                    v.salaryFrom, v.salaryTo, v.salaryCurrency, v.salaryLabel,
                    position, profileSkills, salary
                );
                const matchScore = matchResult.score;
                const matchReasons = matchResult.reasons;

                // Archetype detection (career-ops inspired)
                const archetype = detectArchetype(v.title, desc);

                // Gap analysis — matched vs missing skills (reuse from calcMatch result)
                const normalise = (s: string) => s.toLowerCase().trim();
                const vSkillsNorm = skills.map(normalise);
                const gap = (function () {
                    const allVSet = new Set(vSkillsNorm);
                    const profSet = new Set(profileSkills.map(normalise));
                    const matched: string[] = [], missing: string[] = [];
                    for (const vs of allVSet) (profSet.has(vs) ? matched : missing).push(vs);
                    return {
                        matchedSkills: matched.slice(0, 6),
                        missingSkills: missing.slice(0, 5),
                    };
                })();

                // Freshness (Ghost Job pre-check)
                const freshness = calcVacancyFreshness(v.publishedAt, v.createdAt, v.updatedAt);

                // Hybrid score: 60% keyword match + 40% semantic similarity
                const semanticScore = semanticRank.get(v.id) ?? 0;
                const combinedScore = 0.6 * (matchScore / 100) + 0.4 * semanticScore;

                return { ...v, matchScore, matchReasons, archetype, ...gap, freshness, semanticScore, combinedScore };
            })
            .filter((v: any) => v.matchScore > 20 || v.semanticScore > 0.3)
            .sort((a: any, b: any) => b.combinedScore - a.combinedScore)
            .slice(0, limit * 2); // fetch wider set before behavioral filter

        // ── Behavioral re-ranking ─────────────────────────────────────────────
        const profile = await this.prisma.profile.findFirst({ select: { id: true } });
        if (profile) {
            const interactions = await this.prisma.vacancyInteraction.findMany({
                where: { profileId: profile.id },
                orderBy: { createdAt: 'desc' },
                take: 100,
            });

            const dismissedIds = new Set(
                interactions.filter(i => i.type === 'dismiss').map(i => i.vacancyId),
            );
            const positiveIds = [...new Set(
                interactions
                    .filter(i => ['click', 'apply', 'favorite', 'analyze'].includes(i.type))
                    .map(i => i.vacancyId),
            )];

            // Derive preferred archetypes from positively interacted vacancies
            const preferredArchetypes = new Set<string>();
            if (positiveIds.length > 0) {
                const posVacancies = await this.prisma.vacancy.findMany({
                    where: { id: { in: positiveIds } },
                    select: { title: true, descriptionPreview: true },
                });
                for (const v of posVacancies) {
                    const arch = detectArchetype(v.title, v.descriptionPreview ?? '');
                    if (arch !== 'Unknown') preferredArchetypes.add(arch);
                }
            }

            const reranked = ranked
                .filter((v: any) => !dismissedIds.has(v.id))
                .map((v: any) => {
                    const behaviorBoost = preferredArchetypes.size > 0 && preferredArchetypes.has(v.archetype) ? 1.2 : 1.0;
                    return { ...v, combinedScore: v.combinedScore * behaviorBoost };
                })
                .sort((a: any, b: any) => b.combinedScore - a.combinedScore)
                .slice(0, limit);

            return reranked;
        }
        // ─────────────────────────────────────────────────────────────────────

        return ranked.slice(0, limit);
    }

    /**
     * Record a behavioral interaction signal (click/apply/favorite/analyze/dismiss).
     * Uses upsert to avoid duplicate rows — re-interactions refresh the timestamp.
     */
    async recordInteraction(vacancyId: string, type: string): Promise<void> {
        const allowed = ['click', 'apply', 'favorite', 'analyze', 'dismiss'];
        if (!allowed.includes(type)) return;

        const profile = await this.prisma.profile.findFirst({ select: { id: true } });
        if (!profile) return;

        await this.prisma.vacancyInteraction.upsert({
            where: {
                profileId_vacancyId_type: { profileId: profile.id, vacancyId, type },
            },
            create: { profileId: profile.id, vacancyId, type },
            update: { createdAt: new Date() },
        });

        this.logger.log(`[Interaction] type=${type} vacancy=${vacancyId}`);
    }

    /**
     * Search via Adzuna API → save to DB
     */
    async searchAndSave(query: string, count = 10) {
        this.logger.log(`[Adzuna API] Searching: "${query}", count: ${count}`);

        const appId = this.configService.get<string>('ADZUNA_APP_ID');
        const appKey = this.configService.get<string>('ADZUNA_APP_KEY');
        const country = this.configService.get<string>('ADZUNA_COUNTRY') || 'gb';

        if (!appId || !appKey) {
            this.logger.error('[Adzuna API] No credentials configured (ADZUNA_APP_ID / ADZUNA_APP_KEY missing).');
            throw new Error('Adzuna API credentials are not configured.');
        }

        let results: any[] = [];

        try {
            const res = await firstValueFrom(
                this.httpService.get(`${ADZUNA_API}/${country}/search/1`, {
                    params: {
                        app_id: appId,
                        app_key: appKey,
                        what: query,
                        results_per_page: Math.min(count, 50),
                        'content-type': 'application/json',
                    },
                    timeout: 10000,
                    // Force IPv4 — IPv6 is unreachable in this network environment
                    family: 4,
                } as any)
            );
            results = res.data?.results || [];
            this.logger.log(`[Adzuna API] Found ${results.length} vacancies`);
        } catch (err: any) {
            const status = err.response?.status;
            this.logger.error(`[Adzuna API] Request failed (status ${status ?? 'unknown'}): ${err.message}`);
            throw new Error(`Adzuna API request failed: ${err.message}`);
        }

        const saved: any[] = [];

        for (const item of results) {
            try {
                const salaryFrom: number | null = item.salary_min ? Math.round(item.salary_min) : null;
                const salaryTo: number | null = item.salary_max ? Math.round(item.salary_max) : null;

                let salaryLabel = 'Зарплата не указана';
                if (salaryFrom && salaryTo) {
                    salaryLabel = `от ${salaryFrom.toLocaleString('ru')} до ${salaryTo.toLocaleString('ru')} £`;
                } else if (salaryFrom) {
                    salaryLabel = `от ${salaryFrom.toLocaleString('ru')} £`;
                } else if (salaryTo) {
                    salaryLabel = `до ${salaryTo.toLocaleString('ru')} £`;
                }

                const descriptionRaw = item.description || '';
                const descriptionPreview = this.cleanHtml(descriptionRaw).slice(0, 200) + (descriptionRaw.length > 200 ? '...' : '');
                const extractedSkills = await this.skillsService.extractFromText(descriptionRaw, true);
                const rawSkills = extractedSkills.map(s => s.name);

                // Parse publication date from Adzuna API
                const publishedAt = item.created ? new Date(item.created) : null;

                const upserted = await this.prisma.vacancy.upsert({
                    where: { hhId: String(item.id) },
                    create: {
                        hhId: String(item.id),
                        title: item.title ?? query,
                        employer: item.company?.display_name ?? 'Unknown',
                        location: item.location?.display_name ?? null,
                        salaryLabel,
                        salaryFrom,
                        salaryTo,
                        salaryCurrency: 'GBP',
                        skills: rawSkills,
                        descriptionPreview,
                        experience: null,
                        schedule: mapSchedule(item.contract_type, item.contract_time),
                        url: item.redirect_url ?? null,
                        searchQuery: query,
                        publishedAt,
                    },
                    update: {
                        title: item.title ?? query,
                        salaryLabel,
                        schedule: mapSchedule(item.contract_type, item.contract_time),
                        url: item.redirect_url ?? null,
                        searchQuery: query,
                        publishedAt,
                        updatedAt: new Date(),
                    },
                });

                saved.push(upserted);

                // Sync normalized skills asynchronously (non-blocking)
                if (rawSkills.length > 0) {
                    this.skillsService.syncVacancySkills(upserted.id, rawSkills)
                        .catch(e => this.logger.warn(`Skills sync failed for vacancy ${upserted.id}: ${e.message}`));
                }

                // Index in Pinecone for semantic search (non-blocking, errors caught inside service)
                const embeddingText = [
                    upserted.title,
                    upserted.employer,
                    upserted.descriptionPreview,
                    rawSkills.join(', '),
                ].filter(Boolean).join(' ');
                this.embeddingsService.indexVacancy(upserted.id, embeddingText);

            } catch (e: any) {
                this.logger.warn(`[Adzuna API] Upsert failed for ${item.id}: ${e.message}`);
            }
        }

        this.logger.log(`[Adzuna API] Saved ${saved.length} vacancies to DB`);
        return saved;
    }



    private cleanHtml(html: string): string {
        return html
            .replace(/<\/?[^>]+(>|$)/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Remove vacancies that are no longer active (published more than 60 days ago)
     */
    private async cleanupExpiredVacancies() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 60);

        try {
            const deleted = await this.prisma.vacancy.deleteMany({
                where: {
                    OR: [
                        // Vacancies with publishedAt older than 60 days
                        { publishedAt: { lt: cutoffDate } },
                        // Vacancies without publishedAt where createdAt is older than 60 days
                        {
                            publishedAt: null,
                            createdAt: { lt: cutoffDate },
                        },
                    ],
                },
            });

            if (deleted.count > 0) {
                this.logger.log(`[Cleanup] Removed ${deleted.count} expired vacancies (older than 60 days)`);
            }
        } catch (e: any) {
            this.logger.warn(`[Cleanup] Failed to clean up expired vacancies: ${e.message}`);
        }
    }

    /**
     * AI Deep Analysis (7-block evaluation + Ghost Job Detection) for a specific vacancy
     */
    async evaluateVacancy(id: string, resumeId?: string, userId?: string) {
        // Find the vacancy safely
        let vacancy: any = null;
        try {
            vacancy = await this.prisma.vacancy.findUnique({
                where: { id },
            });
        } catch (e) {
            // Error typically means 'id' is malformed UUID. Try searching by hhId just in case
            vacancy = await this.prisma.vacancy.findUnique({
                where: { hhId: id },
            });
        }

        if (!vacancy) {
            throw new Error(`Vacancy with ID ${id} not found`);
        }

        // Find the resume: use specific resumeId if provided, otherwise find the latest one
        let resume: any = null;
        if (resumeId && resumeId !== 'all') {
            resume = await this.prisma.resume.findUnique({
                where: { id: resumeId },
            });
        } else {
            // Fallback: find the latest resume for this user
            resume = await this.prisma.resume.findFirst({
                where: userId ? { profile: { userId } } : undefined,
                orderBy: { updatedAt: 'desc' },
            });
        }

        if (!resume) {
            return { noResume: true };
        }

        // Compute archetype and gaps before calling AI — enriches the prompt
        const archetype = detectArchetype(vacancy.title || '', vacancy.descriptionPreview || '');

        // Get profile skills for gap analysis
        let profileSkills: string[] = [];
        try {
            const profile = await this.prisma.profile.findFirst(
                userId ? { where: { userId } } : undefined,
            );
            if (profile && Array.isArray(profile.skills)) profileSkills = profile.skills as string[];
        } catch { /* ignore */ }

        const norm = (s: string) => s.toLowerCase().trim();
        const vacancySkills = Array.isArray(vacancy.skills) ? (vacancy.skills as string[]) : [];
        const vSet = new Set(vacancySkills.map(norm));
        const pSet = new Set(profileSkills.map(norm));
        const missingSkills: string[] = [];
        for (const vs of vSet) if (!pSet.has(vs)) missingSkills.push(vs);

        // Call the AI service with enriched context
        return this.aiService.evaluateVacancyInDepth(vacancy, resume.content, archetype, missingSkills.slice(0, 8));
    }

    /**
     * Generate STAR+R interview preparation for a specific vacancy
     */
    async interviewPrep(id: string, resumeId?: string, userId?: string) {
        // Find the vacancy safely
        let vacancy: any = null;
        try {
            vacancy = await this.prisma.vacancy.findUnique({ where: { id } });
        } catch (e) {
            vacancy = await this.prisma.vacancy.findUnique({ where: { hhId: id } });
        }

        if (!vacancy) {
            throw new Error(`Vacancy with ID ${id} not found`);
        }

        // Find the resume
        let resume: any = null;
        if (resumeId && resumeId !== 'all') {
            resume = await this.prisma.resume.findUnique({ where: { id: resumeId } });
        } else {
            resume = await this.prisma.resume.findFirst({
                where: userId ? { profile: { userId } } : undefined,
                orderBy: { updatedAt: 'desc' },
            });
        }

        if (!resume) {
            return { noResume: true };
        }

        return this.questionGenService.generateForVacancy(vacancy, resume.content);
    }

    /**
     * Generate AI cover letter for a vacancy based on user's resume
     */
    async generateCoverLetter(id: string, resumeId?: string, language: 'ru' | 'en' = 'ru', userId?: string): Promise<{ coverLetter: string } | { noResume: true }> {
        // Find the vacancy safely
        let vacancy: any = null;
        try {
            vacancy = await this.prisma.vacancy.findUnique({ where: { id } });
        } catch (e) {
            vacancy = await this.prisma.vacancy.findUnique({ where: { hhId: id } });
        }

        if (!vacancy) {
            throw new Error(`Vacancy with ID ${id} not found`);
        }

        // Find the resume
        let resume: any = null;
        if (resumeId && resumeId !== 'all') {
            resume = await this.prisma.resume.findUnique({ where: { id: resumeId } });
        } else {
            resume = await this.prisma.resume.findFirst({
                where: userId ? { profile: { userId } } : undefined,
                orderBy: { updatedAt: 'desc' },
            });
        }

        if (!resume) {
            return { noResume: true };
        }

        return this.aiService.generateCoverLetter(vacancy, resume.content, language);
    }
}
