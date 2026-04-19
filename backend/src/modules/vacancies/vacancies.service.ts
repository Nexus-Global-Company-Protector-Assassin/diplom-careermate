import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AiService } from '../ai/ai.service';

// Adzuna API base URL
const ADZUNA_API = 'https://api.adzuna.com/v1/api/jobs';

// ---------------------------------------------------------------------------
// Known skills dictionary for extraction from job descriptions
// ---------------------------------------------------------------------------
const KNOWN_SKILLS: string[] = [
    // Programming languages
    'python', 'javascript', 'typescript', 'java', 'c#', 'c++', 'go', 'golang',
    'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl',
    'haskell', 'elixir', 'clojure', 'dart', 'lua', 'shell', 'bash', 'powershell',
    // Frontend
    'react', 'angular', 'vue', 'vue.js', 'next.js', 'nextjs', 'nuxt', 'svelte',
    'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap', 'webpack', 'vite',
    'redux', 'mobx', 'graphql', 'rest api', 'jquery',
    // Backend
    'node.js', 'nodejs', 'express', 'nestjs', 'django', 'flask', 'fastapi',
    'spring', 'spring boot', '.net', 'asp.net', 'rails', 'laravel', 'gin',
    // Data / ML / AI
    'sql', 'nosql', 'postgresql', 'postgres', 'mysql', 'mongodb', 'redis',
    'elasticsearch', 'cassandra', 'dynamodb', 'sqlite', 'oracle',
    'pandas', 'numpy', 'scipy', 'scikit-learn', 'sklearn', 'tensorflow',
    'pytorch', 'keras', 'xgboost', 'lightgbm', 'spark', 'pyspark', 'hadoop',
    'airflow', 'dbt', 'kafka', 'rabbitmq', 'etl', 'data warehouse',
    'machine learning', 'deep learning', 'nlp', 'computer vision',
    'power bi', 'powerbi', 'tableau', 'looker', 'metabase', 'superset',
    'bigquery', 'snowflake', 'redshift', 'databricks', 'datalake',
    // DevOps / Cloud
    'docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp', 'google cloud',
    'terraform', 'ansible', 'jenkins', 'ci/cd', 'github actions', 'gitlab',
    'linux', 'nginx', 'prometheus', 'grafana', 'datadog', 'new relic',
    // Tools & practices
    'git', 'jira', 'confluence', 'figma', 'sketch', 'agile', 'scrum',
    'tdd', 'bdd', 'microservices', 'api design', 'system design',
    'unit testing', 'integration testing', 'cypress', 'selenium', 'jest',
    'pytest', 'postman', 'swagger', 'openapi',
    // Data science specific
    'statistics', 'a/b testing', 'ab testing', 'hypothesis testing',
    'regression', 'classification', 'clustering', 'feature engineering',
    'data visualization', 'data analysis', 'data modeling', 'data pipeline',
    'time series', 'recommendation systems', 'neural networks',
];

function extractSkillsFromText(text: string): string[] {
    if (!text) return [];
    const lower = text.toLowerCase();
    const found: string[] = [];
    for (const skill of KNOWN_SKILLS) {
        // Use word-boundary-like check to avoid false positives
        const idx = lower.indexOf(skill);
        if (idx !== -1) {
            const before = idx > 0 ? lower[idx - 1] : ' ';
            const after = idx + skill.length < lower.length ? lower[idx + skill.length] : ' ';
            const isBoundary = (c: string) => /[\s,;.()\[\]{}\-\/"'!?:&|<>]/.test(c);
            if (isBoundary(before) && isBoundary(after)) {
                // Normalise display name
                const display = skill.charAt(0).toUpperCase() + skill.slice(1);
                if (!found.includes(display)) found.push(display);
            }
        }
    }
    return found;
}

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
export function calcVacancyFreshness(createdAt: Date, updatedAt?: Date | null): {
    score: number;
    label: string;
    daysOld: number;
} {
    const now = new Date();
    const ref = updatedAt || createdAt;
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
    if (vDesc) {
        for (const s of extractSkillsFromText(vDesc)) allVSkillsSet.add(normalise(s));
    }

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
// Match calculation — returns 0-100 (6-component, career-ops inspired)
// ---------------------------------------------------------------------------
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
): number {
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

    return Math.max(0, Math.min(100, Math.round(finalScore)));
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
function getMockVacancies(query: string, count: number) {
    const templates = [
        {
            hhId: `mock-${query}-001`,
            title: query,
            employer: 'Yandex',
            location: 'Москва',
            salaryLabel: 'от 200 000 до 350 000 ₽',
            salaryFrom: 200000,
            salaryTo: 350000,
            salaryCurrency: 'RUR',
            skills: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'GraphQL'],
            descriptionPreview: `Ищем опытного ${query} для работы над высоконагруженными продуктами.`,
            experience: 'От 3 до 6 лет',
            schedule: 'Полный день',
            searchQuery: query,
        },
        {
            hhId: `mock-${query}-002`,
            title: `Senior ${query}`,
            employer: 'Сбер',
            location: 'Удалённо',
            salaryLabel: 'от 250 000 до 400 000 ₽',
            salaryFrom: 250000,
            salaryTo: 400000,
            salaryCurrency: 'RUR',
            skills: ['TypeScript', 'Vue.js', 'React', 'Docker', 'Kubernetes'],
            descriptionPreview: `Приглашаем Senior ${query} в нашу команду финтех-продуктов.`,
            experience: 'От 6 лет',
            schedule: 'Удалённая работа',
            searchQuery: query,
        },
        {
            hhId: `mock-${query}-003`,
            title: `Middle ${query}`,
            employer: 'VK',
            location: 'Санкт-Петербург',
            salaryLabel: 'от 150 000 до 220 000 ₽',
            salaryFrom: 150000,
            salaryTo: 220000,
            salaryCurrency: 'RUR',
            skills: ['JavaScript', 'React', 'Redux', 'Node.js', 'PostgreSQL'],
            descriptionPreview: `Ищем Middle ${query} для работы над социальной сетью VK.`,
            experience: 'От 1 года до 3 лет',
            schedule: 'Гибкий график',
            searchQuery: query,
        },
        {
            hhId: `mock-${query}-004`,
            title: `${query} / Frontend Developer`,
            employer: 'Авито',
            location: 'Москва',
            salaryLabel: 'от 180 000 до 300 000 ₽',
            salaryFrom: 180000,
            salaryTo: 300000,
            salaryCurrency: 'RUR',
            skills: ['React', 'TypeScript', 'CSS', 'WebPack', 'Git'],
            descriptionPreview: `Авито ищет Frontend Developer со специализацией ${query}.`,
            experience: 'От 3 до 6 лет',
            schedule: 'Полный день',
            searchQuery: query,
        },
        {
            hhId: `mock-${query}-005`,
            title: `Junior ${query}`,
            employer: 'OZON',
            location: 'Удалённо',
            salaryLabel: 'от 80 000 до 130 000 ₽',
            salaryFrom: 80000,
            salaryTo: 130000,
            salaryCurrency: 'RUR',
            skills: ['JavaScript', 'React', 'HTML', 'CSS', 'Git'],
            descriptionPreview: `OZON Tech ищет начинающего ${query}. Быстрый рост и наставник.`,
            experience: 'Нет опыта',
            schedule: 'Удалённая работа',
            searchQuery: query,
        },
        {
            hhId: `mock-${query}-006`,
            title: `${query} Team Lead`,
            employer: 'Тинькофф',
            location: 'Москва',
            salaryLabel: 'от 350 000 до 500 000 ₽',
            salaryFrom: 350000,
            salaryTo: 500000,
            salaryCurrency: 'RUR',
            skills: ['TypeScript', 'React', 'Node.js', 'System Design', 'Mentoring'],
            descriptionPreview: `Тинькофф ищет Team Lead ${query} для руководства командой из 5+ человек.`,
            experience: 'От 6 лет',
            schedule: 'Гибкий график',
            searchQuery: query,
        },
        {
            hhId: `mock-${query}-007`,
            title: `${query} (Fullstack)`,
            employer: 'Ростелеком',
            location: 'Удалённо',
            salaryLabel: 'от 120 000 до 180 000 ₽',
            salaryFrom: 120000,
            salaryTo: 180000,
            salaryCurrency: 'RUR',
            skills: ['JavaScript', 'Node.js', 'React', 'MongoDB', 'Docker'],
            descriptionPreview: `Fullstack-разработчик для развития платформы Ростелеком.`,
            experience: 'От 1 года до 3 лет',
            schedule: 'Удалённая работа',
            searchQuery: query,
        },
        {
            hhId: `mock-${query}-008`,
            title: `${query} — Data & Analytics`,
            employer: 'МТС',
            location: 'Москва',
            salaryLabel: 'от 160 000 до 240 000 ₽',
            salaryFrom: 160000,
            salaryTo: 240000,
            salaryCurrency: 'RUR',
            skills: ['Python', 'SQL', 'Pandas', 'React', 'PowerBI'],
            descriptionPreview: `МТС ищет специалиста ${query} с опытом в аналитике данных.`,
            experience: 'От 1 года до 3 лет',
            schedule: 'Полный день',
            searchQuery: query,
        },
        {
            hhId: `mock-${query}-009`,
            title: `${query} (Remote)`,
            employer: 'Lamoda',
            location: 'Удалённо',
            salaryLabel: 'от 140 000 до 200 000 ₽',
            salaryFrom: 140000,
            salaryTo: 200000,
            salaryCurrency: 'RUR',
            skills: ['JavaScript', 'TypeScript', 'Vue.js', 'CSS', 'REST API'],
            descriptionPreview: `Lamoda — международная фэшн-платформа. ${query} для нашей распределённой команды.`,
            experience: 'От 1 года до 3 лет',
            schedule: 'Удалённая работа',
            searchQuery: query,
        },
        {
            hhId: `mock-${query}-010`,
            title: `${query} (Стажёр)`,
            employer: 'Газпром Нефть',
            location: 'Санкт-Петербург',
            salaryLabel: 'от 50 000 до 80 000 ₽',
            salaryFrom: 50000,
            salaryTo: 80000,
            salaryCurrency: 'RUR',
            skills: ['JavaScript', 'HTML', 'CSS', 'Git', 'Figma'],
            descriptionPreview: `Стажировка для студентов и выпускников по направлению ${query}.`,
            experience: 'Нет опыта',
            schedule: 'Гибкий график',
            searchQuery: query,
        },
    ];
    return templates.slice(0, Math.min(count, templates.length));
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
    ) { }

    /**
     * Get vacancies from DB with optional filters
     */
    async getVacancies(filters: VacancyFilters = {}) {
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
            orderBy: { createdAt: 'desc' },
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
        const vacancies = await this.prisma.vacancy.findMany({
            where: position
                ? { searchQuery: { contains: position, mode: 'insensitive' } }
                : {},
            orderBy: { createdAt: 'desc' },
            take: 50, // fetch wider set, rank by match
        });

        // Calculate match, archetype, gap, and freshness for each
        const ranked = vacancies
            .map((v: any) => {
                const skills = Array.isArray(v.skills) ? (v.skills as string[]) : [];
                const desc = v.descriptionPreview || '';

                const matchScore = calcMatch(
                    v.title, skills, desc,
                    v.salaryFrom, v.salaryTo, v.salaryCurrency, v.salaryLabel,
                    position, profileSkills, salary
                );

                // Archetype detection (career-ops inspired)
                const archetype = detectArchetype(v.title, desc);

                // Gap analysis — matched vs missing skills
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
                const freshness = calcVacancyFreshness(v.createdAt, v.updatedAt);

                return { ...v, matchScore, archetype, ...gap, freshness };
            })
            .filter((v: any) => v.matchScore > 20)
            .sort((a: any, b: any) => b.matchScore - a.matchScore)
            .slice(0, limit);

        return ranked;
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
            this.logger.warn('[Adzuna API] No credentials. Using mock data.');
            return this.saveMock(query, count);
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
                    timeout: 5000,
                })
            );
            results = res.data?.results || [];
            this.logger.log(`[Adzuna API] Found ${results.length} vacancies`);
        } catch (err: any) {
            const status = err.response?.status;
            this.logger.warn(`[Adzuna API] Failed (status ${status ?? 'unknown'}): ${err.message}. Using mock.`);
            return this.saveMock(query, count);
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
                        skills: extractSkillsFromText(descriptionRaw),
                        descriptionPreview,
                        experience: null,
                        schedule: mapSchedule(item.contract_type, item.contract_time),
                        url: item.redirect_url ?? null,
                        searchQuery: query,
                    },
                    update: {
                        title: item.title ?? query,
                        salaryLabel,
                        schedule: mapSchedule(item.contract_type, item.contract_time),
                        url: item.redirect_url ?? null,
                        searchQuery: query,
                        updatedAt: new Date(),
                    },
                });

                saved.push(upserted);
            } catch (e: any) {
                this.logger.warn(`[Adzuna API] Upsert failed for ${item.id}: ${e.message}`);
            }
        }

        this.logger.log(`[Adzuna API] Saved ${saved.length} vacancies to DB`);
        return saved;
    }

    private async saveMock(query: string, count: number) {
        const mockItems = getMockVacancies(query, count);
        const saved: any[] = [];

        for (const mock of mockItems) {
            try {
                const upserted = await this.prisma.vacancy.upsert({
                    where: { hhId: mock.hhId },
                    create: mock,
                    update: {
                        title: mock.title,
                        salaryLabel: mock.salaryLabel,
                        skills: mock.skills,
                        experience: mock.experience,
                        schedule: mock.schedule,
                        searchQuery: query,
                        updatedAt: new Date(),
                    },
                });
                saved.push(upserted);
            } catch (e: any) {
                this.logger.warn(`[Mock] Upsert failed for ${mock.hhId}: ${e.message}`);
            }
        }

        this.logger.log(`[Mock] Saved ${saved.length} mock vacancies to DB`);
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
     * AI Deep Analysis (7-block evaluation + Ghost Job Detection) for a specific vacancy
     */
    async evaluateVacancy(id: string, resumeId?: string) {
        if (id.startsWith('mock-')) {
            const mockScore = 50 + Math.floor(Math.random() * 40);
            const mockGrade = mockScore >= 80 ? 'A' : mockScore >= 65 ? 'B' : mockScore >= 50 ? 'C' : 'D';
            return {
                "A_Summary": "Тестовая вакансия. Подключите Adzuna / HH API для реальных данных.",
                "B_CV_Match": "Данные сгенерированы для демонстрации.",
                "C_Strategy": "Акцентируйте внимание на ваших ключевых достижениях.",
                "D_Compensation": "Зарплата тестовая. Всегда просите верхнюю границу рынка!",
                "E_Personalization": "Добавьте ключевые слова из описания вакансии в резюме.",
                "F_Interview": "Подготовьте STAR-историю о своём главном проекте.",
                "G_Legitimacy": {
                    "verdict": "Proceed with Caution",
                    "signals": ["Mock-вакансия — реальная проверка невозможна"],
                    "explanation": "Это тестовые данные. Ghost Job Detection работает только с реальными вакансиями."
                },
                "archetype": "Unknown",
                "grade": mockGrade,
                "score": mockScore
            };
        }

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
            // Fallback: find the latest resume (any type)
            resume = await this.prisma.resume.findFirst({
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
            const profile = await this.prisma.profile.findFirst();
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
    async interviewPrep(id: string, resumeId?: string) {
        if (id.startsWith('mock-')) {
            return {
                questions: [
                    { question: "Расскажите о сложном проекте, над которым вы работали", category: "behavioral", star: { situation: "Тестовая ситуация", task: "Тестовая задача", action: "Тестовые действия", result: "Тестовый результат", reflection: "Тестовый вывод" } }
                ],
                candidate_questions: ["Какие технологии вы используете?", "Какая структура команды?", "Какие цели на год?"],
                tips: "Это тестовая вакансия. Подключите Adzuna ключи для реальных данных."
            };
        }

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
            resume = await this.prisma.resume.findFirst({ orderBy: { updatedAt: 'desc' } });
        }

        if (!resume) {
            return { noResume: true };
        }

        return this.aiService.generateInterviewPrep(vacancy, resume.content);
    }
}
