import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalyzeProfileTool, ProfileData } from './tools/analyze-profile.tool';
import { MatchVacanciesTool } from './tools/match-vacancies.tool';
import { GenerateResumeTool } from './tools/generate-resume.tool';
import { ProfileAnalysis } from './schemas/profile-analysis.schema';
import { VacancyMatchResult } from './schemas/vacancy-match.schema';
import { GeneratedResume } from './schemas/resume.schema';
import * as crypto from 'crypto';

export interface PocRunInput {
    profileData: ProfileData;
    topVacancies?: number;
}

export interface PocRunResult {
    runId: string;
    analysis: ProfileAnalysis;
    vacancies: VacancyMatchResult;
    resume: GeneratedResume;
    trace: RunTrace;
}

interface RunTrace {
    runId: string;
    startedAt: string;
    completedAt: string;
    totalLatencyMs: number;
    steps: RunStep[];
}

interface RunStep {
    tool: string;
    startedAt: string;
    completedAt: string;
    latencyMs: number;
    status: 'success' | 'error';
    error?: string;
}

@Injectable()
export class AgentRunnerService {
    private readonly logger = new Logger(AgentRunnerService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly analyzeProfileTool: AnalyzeProfileTool,
        private readonly matchVacanciesTool: MatchVacanciesTool,
        private readonly generateResumeTool: GenerateResumeTool,
    ) { }

    /**
     * Запускает полный PoC flow:
     * Профиль → анализ → вакансии → резюме
     */
    async runPocFlow(input: PocRunInput): Promise<PocRunResult> {
        const runId = crypto.randomUUID();
        const runStartedAt = new Date();
        const steps: RunStep[] = [];

        this.logger.log(`[runner] Starting PoC run: runId=${runId}`);

        // === Step 1: analyze_profile ===
        let analysis: ProfileAnalysis;
        {
            const stepStart = Date.now();
            const startedAt = new Date().toISOString();
            try {
                analysis = await this.analyzeProfileTool.run(input.profileData);
                steps.push({
                    tool: 'analyze_profile',
                    startedAt,
                    completedAt: new Date().toISOString(),
                    latencyMs: Date.now() - stepStart,
                    status: 'success',
                });
                this.logger.log(
                    `[runner:${runId}] analyze_profile done in ${Date.now() - stepStart}ms`,
                );
            } catch (err) {
                const step: RunStep = {
                    tool: 'analyze_profile',
                    startedAt,
                    completedAt: new Date().toISOString(),
                    latencyMs: Date.now() - stepStart,
                    status: 'error',
                    error: (err as Error).message,
                };
                steps.push(step);
                this.logger.error(`[runner:${runId}] analyze_profile failed: ${(err as Error).message}`);
                throw new Error(`PoC run failed at analyze_profile: ${(err as Error).message}`);
            }
        }

        // === Step 2: match_vacancies ===
        let vacancies: VacancyMatchResult;
        {
            const stepStart = Date.now();
            const startedAt = new Date().toISOString();
            try {
                vacancies = await this.matchVacanciesTool.run(
                    analysis,
                    input.topVacancies ?? 5,
                );
                steps.push({
                    tool: 'match_vacancies',
                    startedAt,
                    completedAt: new Date().toISOString(),
                    latencyMs: Date.now() - stepStart,
                    status: 'success',
                });
                this.logger.log(
                    `[runner:${runId}] match_vacancies done in ${Date.now() - stepStart}ms, found=${vacancies.vacancies.length}`,
                );
            } catch (err) {
                steps.push({
                    tool: 'match_vacancies',
                    startedAt,
                    completedAt: new Date().toISOString(),
                    latencyMs: Date.now() - stepStart,
                    status: 'error',
                    error: (err as Error).message,
                });
                this.logger.error(`[runner:${runId}] match_vacancies failed: ${(err as Error).message}`);
                throw new Error(`PoC run failed at match_vacancies: ${(err as Error).message}`);
            }
        }

        // === Step 3: generate_resume (для топ-1 вакансии) ===
        let resume: GeneratedResume;
        const topVacancy = vacancies.vacancies[0];
        {
            const stepStart = Date.now();
            const startedAt = new Date().toISOString();
            try {
                resume = await this.generateResumeTool.run(
                    input.profileData,
                    topVacancy,
                );
                steps.push({
                    tool: 'generate_resume',
                    startedAt,
                    completedAt: new Date().toISOString(),
                    latencyMs: Date.now() - stepStart,
                    status: 'success',
                });
                this.logger.log(
                    `[runner:${runId}] generate_resume done in ${Date.now() - stepStart}ms`,
                );
            } catch (err) {
                steps.push({
                    tool: 'generate_resume',
                    startedAt,
                    completedAt: new Date().toISOString(),
                    latencyMs: Date.now() - stepStart,
                    status: 'error',
                    error: (err as Error).message,
                });
                this.logger.error(`[runner:${runId}] generate_resume failed: ${(err as Error).message}`);
                throw new Error(`PoC run failed at generate_resume: ${(err as Error).message}`);
            }
        }

        const totalLatencyMs = Date.now() - runStartedAt.getTime();
        this.logger.log(
            `[runner:${runId}] PoC run completed successfully in ${totalLatencyMs}ms`,
        );

        return {
            runId,
            analysis,
            vacancies,
            resume,
            trace: {
                runId,
                startedAt: runStartedAt.toISOString(),
                completedAt: new Date().toISOString(),
                totalLatencyMs,
                steps,
            },
        };
    }

    /**
     * Только анализ профиля (быстрый endpoint)
     */
    async analyzeProfile(profileData: ProfileData): Promise<ProfileAnalysis> {
        const runId = crypto.randomUUID();
        this.logger.log(`[runner] analyzeProfile runId=${runId}`);
        return this.analyzeProfileTool.run(profileData);
    }
}
