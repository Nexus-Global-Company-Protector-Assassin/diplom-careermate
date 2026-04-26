import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { firstValueFrom } from 'rxjs';

export interface SkillGapResult {
    matchedSkills: Array<{ id: string; name: string; category?: string | null }>;
    missingSkills: Array<{ id: string; name: string; category?: string | null }>;
    matchScore: number; // 0–100 Jaccard-based
}

// Normalize raw skill name to canonical form (removes spaces, dots, lowercase)
function normalizeSkillName(raw: string): string {
    return raw
        .toLowerCase()
        .replace(/\./g, '')      // react.js → reactjs
        .replace(/\s+/g, '')     // trim all spaces
        .trim();
}

export interface CachedSkill {
    id: string;
    name: string;
    category: string | null;
    normalizedName: string;
    aliases: string[];
}

@Injectable()
export class SkillsService implements OnModuleInit {
    private readonly logger = new Logger(SkillsService.name);

    // In-memory cache for ultra-fast text matching without DB hits
    private skillsCache: Map<string, CachedSkill> = new Map();
    // Pre-calculated boundaries for Aho-Corasick style extraction
    private sortedSkillNames: string[] = [];

    constructor(
        private readonly prisma: PrismaService,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {}

    async onModuleInit() {
        await this.loadCache();
    }

    /**
     * Loads all skills from the database into memory.
     */
    private async loadCache() {
        this.logger.log('Loading skills taxonomy into memory...');
        const skills = await this.prisma.skill.findMany();
       
        this.skillsCache.clear();
        for (const skill of skills) {
            const cached: CachedSkill = {
                id: skill.id,
                name: skill.name,
                category: skill.category,
                normalizedName: normalizeSkillName(skill.name),
                aliases: skill.aliases.map(normalizeSkillName),
            };
           
            // Map canonical name
            this.skillsCache.set(cached.normalizedName, cached);
            // Map aliases
            for (const alias of cached.aliases) {
                this.skillsCache.set(alias, cached);
            }
        }
       
        // Prepare sorted names (longest first) for dictionary extraction to prefer 'React Native' over 'React'
        this.sortedSkillNames = Array.from(this.skillsCache.keys()).sort((a, b) => b.length - a.length);
       
        this.logger.log(`Loaded ${skills.length} canonical skills into cache.`);
    }

    /**
     * Find existing skill by name or alias from cache, or create a new canonical record in DB.
     */
    async findOrCreate(rawName: string, category?: string): Promise<{ id: string; name: string; category: string | null }> {
        const normalized = normalizeSkillName(rawName);
       
        // 1. Check in-memory cache (extremely fast)
        const cached = this.skillsCache.get(normalized);
        if (cached) {
            return { id: cached.id, name: cached.name, category: cached.category };
        }

        // 2. If not found, upsert canonical skill (upsert prevents P2002 race conditions)
        const canonical = rawName.charAt(0).toUpperCase() + rawName.slice(1).trim();
        this.logger.debug(`Upserting skill: "${canonical}" (normalized: "${normalized}")`);

        const newSkill = await this.prisma.skill.upsert({
            where: { name: canonical },
            update: {},
            create: {
                name: canonical,
                category: category || 'Other',
                aliases: normalized !== canonical.toLowerCase() ? [normalized] : [],
            },
        });

        // 3. Update cache dynamically
        const newCached: CachedSkill = {
            id: newSkill.id,
            name: newSkill.name,
            category: newSkill.category,
            normalizedName: normalizeSkillName(newSkill.name),
            aliases: newSkill.aliases.map(normalizeSkillName),
        };
        this.skillsCache.set(newCached.normalizedName, newCached);
        for (const alias of newCached.aliases) {
            this.skillsCache.set(alias, newCached);
        }
        this.sortedSkillNames.push(newCached.normalizedName);
        this.sortedSkillNames.sort((a, b) => b.length - a.length);

        return newSkill;
    }

    /**
     * Use LLM to extract and normalize skills from arbitrary text (resume, job description).
     * Falls back to dictionary extraction if LLM is unavailable.
     */
    async extractFromText(text: string, useAi = true): Promise<Array<{ name: string; category?: string }>> {
        if (!text || text.length < 10) return [];

        const apiKey = this.configService.get<string>('LLM_API_KEY');

        if (useAi && apiKey) {
            return this.extractWithLlm(text, apiKey);
        }

        return this.extractWithDictionary(text);
    }

    private async extractWithLlm(text: string, apiKey: string): Promise<Array<{ name: string; category?: string }>> {
        const baseUrl = this.configService.get<string>('LLM_API_BASE_URL', 'https://api.openai.com/v1');
        const modelName = this.configService.get<string>('LLM_MODEL_NAME_SMART', 'google/gemini-3.1-flash-lite-preview');

        const prompt = `Extract all hard skills from the text below. Normalize each to its canonical industry name.

Rules:
- "react.js", "reactjs", "ReactJS" → "React"
- "k8s" → "Kubernetes"
- "postgres" / "postgresql" / "PostgreSQL" → "PostgreSQL" 
- "nodejs" / "node.js" → "Node.js"
- Omit soft skills (communication, teamwork) unless explicitly stated as a requirement
- Assign a category: "Frontend" | "Backend" | "DevOps" | "Data" | "Mobile" | "Database" | "Tools"

Return ONLY a valid JSON array, no markdown:
[{"name": "React", "category": "Frontend"}, {"name": "PostgreSQL", "category": "Database"}]

TEXT:
${text.slice(0, 3000)}`;

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    `${baseUrl}/chat/completions`,
                    {
                        model: modelName,
                        messages: [
                            { role: 'system', content: 'You are a technical skills extractor. Return only valid JSON arrays.' },
                            { role: 'user', content: prompt },
                        ],
                        max_tokens: 800,
                        temperature: 0.1,
                    },
                    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } },
                ),
            );

            const content = response.data.choices[0]?.message?.content || '[]';
            const start = content.indexOf('[');
            const end = content.lastIndexOf(']');
            if (start === -1 || end === -1) return this.extractWithDictionary(text);

            const parsed = JSON.parse(content.substring(start, end + 1));
            if (!Array.isArray(parsed)) return this.extractWithDictionary(text);

            return parsed.filter((s: any) => s?.name && typeof s.name === 'string');
        } catch (error: any) {
            this.logger.warn(`LLM skill extraction failed: ${error.message}, falling back to dictionary`);
            return this.extractWithDictionary(text);
        }
    }

    private extractWithDictionary(text: string): Array<{ name: string; category?: string }> {
        const lower = text.toLowerCase().replace(/\./g, ''); // mimic normalization logic
        const found: Array<{ name: string; category?: string }> = [];
        const seen = new Set<string>();

        for (const normalizedKey of this.sortedSkillNames) {
            const cached = this.skillsCache.get(normalizedKey);
            if (!cached || seen.has(cached.id)) continue;

            const idx = lower.indexOf(normalizedKey);
            if (idx !== -1) {
                // Ensure boundary match to avoid partial word matches (e.g., 'go' inside 'google')
                const before = idx > 0 ? lower[idx - 1] : ' ';
                const after = idx + normalizedKey.length < lower.length ? lower[idx + normalizedKey.length] : ' ';
                const isBoundary = (c: string) => /[\s,;.()\[\]{}\-\/"'!?:&|<>]/.test(c);
               
                if (isBoundary(before) && isBoundary(after)) {
                    found.push({ name: cached.name, category: cached.category ?? undefined });
                    seen.add(cached.id);
                }
            }
        }

        return found;
    }

    /**
     * Sync profile's normalized skills after profile create/update.
     * Replaces all existing ProfileSkill records for this profile.
     */
    async syncProfileSkills(profileId: string, rawSkills: string[]): Promise<void> {
        if (!rawSkills || rawSkills.length === 0) return;

        this.logger.log(`Syncing ${rawSkills.length} skills for profile ${profileId}`);

        // Resolve/create canonical skills
        const skillRecords = await Promise.all(rawSkills.map(s => this.findOrCreate(s)));

        // Replace in DB atomically
        await this.prisma.$transaction([
            this.prisma.profileSkill.deleteMany({ where: { profileId } }),
            this.prisma.profileSkill.createMany({
                data: skillRecords.map(s => ({ profileId, skillId: s.id })),
                skipDuplicates: true,
            }),
        ]);

        this.logger.log(`Synced ${skillRecords.length} normalized skills for profile ${profileId}`);
    }

    /**
     * Sync vacancy's normalized skills when vacancy is saved from Adzuna.
     */
    async syncVacancySkills(vacancyId: string, rawSkills: string[]): Promise<void> {
        if (!rawSkills || rawSkills.length === 0) return;

        const skillRecords = await Promise.all(rawSkills.map(s => this.findOrCreate(s)));

        await this.prisma.$transaction([
            this.prisma.vacancySkill.deleteMany({ where: { vacancyId } }),
            this.prisma.vacancySkill.createMany({
                data: skillRecords.map(s => ({ vacancyId, skillId: s.id })),
                skipDuplicates: true,
            }),
        ]);
    }

    /**
     * Compute normalized skill gap between a profile and a vacancy using DB joins.
     * This replaces the old string-based comparison in vacancies.service.ts.
     */
    async getSkillGap(profileId: string, vacancyId: string): Promise<SkillGapResult> {
        const [profileSkills, vacancySkills] = await Promise.all([
            this.prisma.profileSkill.findMany({
                where: { profileId },
                include: { skill: true },
            }),
            this.prisma.vacancySkill.findMany({
                where: { vacancyId },
                include: { skill: true },
            }),
        ]);

        const profileSkillIds = new Set(profileSkills.map(ps => ps.skillId));
        const vacancySkillIds = new Set(vacancySkills.map(vs => vs.skillId));

        const matchedSkills = vacancySkills
            .filter(vs => profileSkillIds.has(vs.skillId))
            .map(vs => ({ id: vs.skill.id, name: vs.skill.name, category: vs.skill.category }));

        const missingSkills = vacancySkills
            .filter(vs => !profileSkillIds.has(vs.skillId))
            .map(vs => ({ id: vs.skill.id, name: vs.skill.name, category: vs.skill.category }));

        // Jaccard index on skill IDs
        const unionSize = new Set([...profileSkillIds, ...vacancySkillIds]).size;
        const matchScore = unionSize > 0
            ? Math.round((matchedSkills.length / unionSize) * 100)
            : 0;

        return { matchedSkills, missingSkills, matchScore };
    }

    /**
     * Get all skills in the dictionary (for autocomplete in frontend).
     */
    async getAllSkills(category?: string) {
        return this.prisma.skill.findMany({
            where: category ? { category } : undefined,
            orderBy: { name: 'asc' },
            select: { id: true, name: true, category: true },
        });
    }

    /**
     * One-time migration: normalize existing JSON skills from Profile and Vacancy records.
     */
    async migrateExistingData(): Promise<{ profilesMigrated: number; vacanciesMigrated: number }> {
        this.logger.log('Starting skills migration from JSON fields...');

        const profiles = await this.prisma.profile.findMany({
            where: { skills: { not: null } } as any,
        });

        const flattenJsonSkills = (skillsData: any): string[] => {
            if (!skillsData) return [];
            if (Array.isArray(skillsData)) return skillsData.filter((s): s is string => typeof s === 'string');
            const result: string[] = [];
            if (Array.isArray(skillsData.technical)) result.push(...skillsData.technical.filter((s: any) => typeof s === 'string'));
            if (Array.isArray(skillsData.professional)) result.push(...skillsData.professional.filter((s: any) => typeof s === 'string'));
            return result;
        };

        let profilesMigrated = 0;
        for (const profile of profiles) {
            const rawSkills = flattenJsonSkills(profile.skills);
            if (rawSkills.length > 0) {
                await this.syncProfileSkills(profile.id, rawSkills);
                profilesMigrated++;
            }
        }

        const vacancies = await this.prisma.vacancy.findMany({
            where: { skills: { not: null } } as any,
        });

        let vacanciesMigrated = 0;
        for (const vacancy of vacancies) {
            const rawSkills = flattenJsonSkills(vacancy.skills);
            if (rawSkills.length > 0) {
                await this.syncVacancySkills(vacancy.id, rawSkills);
                vacanciesMigrated++;
            }
        }

        this.logger.log(`Migration complete: ${profilesMigrated} profiles, ${vacanciesMigrated} vacancies`);
        return { profilesMigrated, vacanciesMigrated };
    }
}

