import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { LlmService } from '../../llm/llm.service';

export const ProfileAnalysisSchema = z.object({
    score: z.number().min(0).max(100).describe("Overall candidate match score for their desired role"),
    level: z.enum(["Junior", "Middle", "Senior", "Lead", "Principal"]).describe("Estimated seniority level based on experience and skills"),
    strengths: z.array(z.string()).describe("List of candidate's strongest professional points"),
    weaknesses: z.array(z.string()).describe("Areas where the candidate is lacking or needs improvement"),
    skillGaps: z.array(z.string()).describe("Specific technical or soft skills missing for their desired position"),
    recommendations: z.array(z.string()).describe("Actionable steps the candidate should take to improve their employability")
});

export type ProfileAnalysisResult = z.infer<typeof ProfileAnalysisSchema>;

@Injectable()
export class AnalyzeProfileTool {
    private readonly logger = new Logger(AnalyzeProfileTool.name);

    constructor(private readonly llmService: LlmService) {}

    async execute(profileData: any): Promise<ProfileAnalysisResult> {
        this.logger.log(`Executing analyzeProfile Tool for profile...`);

        const systemPrompt = `You are an expert IT Technical Recruiter and Career Coach. 
Your task is to analyze a candidate's profile data (experience, education, skills) and provide a strict JSON response evaluating their fit for their desired position.
Use the following JSON schema:
{
  "score": number (0-100),
  "level": "Junior" | "Middle" | "Senior" | "Lead" | "Principal",
  "strengths": string[],
  "weaknesses": string[],
  "skillGaps": string[],
  "recommendations": string[]
}
Be critical, objective, and constructive.`;

        const userPrompt = `Candidate Profile Data:
${JSON.stringify(profileData, null, 2)}

Analyze this profile based on their 'desiredPosition'.
Return ONLY a valid JSON object matching the requested schema.`;

        try {
            const result = await this.llmService.generateJson<ProfileAnalysisResult>(
                systemPrompt,
                userPrompt,
                ProfileAnalysisSchema
            );
            
            this.logger.log(`Analysis complete. Score: ${result.score}, Level: ${result.level}`);
            return result;
        } catch (error: any) {
            this.logger.error(`Failed to analyze profile: ${error.message}`);
            throw error;
        }
    }
}
