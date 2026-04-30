import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Logger,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AgentRunnerService, PocRunInput, PocRunResult } from './agent.service';
import { FileParserService } from './parser/file-parser.service';
import { ParseResumeTool } from './tools/parse-resume.tool';
import { ReviewResumeTool } from './tools/review-resume.tool';
import { CreateResumeTool, QuestionAnswer } from './tools/create-resume.tool';
import { ResumeReview } from './schemas/resume-review.schema';
import { ResumeQuestionsResponse } from './schemas/create-resume.schema';
import { CreatedResume } from './schemas/create-resume.schema';
import { ReActAgentService, ChatRequest, ChatResponse } from './react-agent.service';
import { ProfileAnalysis } from './schemas/profile-analysis.schema';
import { ProfileData } from './tools/analyze-profile.tool';

class AnalyzeProfileDto {
    profileData: ProfileData;
}

class PocRunDto {
    profileData: ProfileData;
    topVacancies?: number;
}

@Controller('ai')
export class AgentController {
    private readonly logger = new Logger(AgentController.name);

    constructor(
        private readonly agentRunner: AgentRunnerService,
        private readonly fileParser: FileParserService,
        private readonly parseResumeTool: ParseResumeTool,
        private readonly reviewResumeTool: ReviewResumeTool,
        private readonly createResumeTool: CreateResumeTool,
        private readonly reactAgent: ReActAgentService,
    ) { }

    /**
     * TRL3 baseline endpoint: только анализ профиля
     * POST /ai/analyze-profile
     */
    @Post('analyze-profile')
    @HttpCode(HttpStatus.OK)
    async analyzeProfile(
        @Body() dto: AnalyzeProfileDto,
    ): Promise<{ success: boolean; data: ProfileAnalysis }> {
        this.logger.log('[POST /ai/analyze-profile]');
        const data = await this.agentRunner.analyzeProfile(dto.profileData);
        return { success: true, data };
    }

    /**
     * Полный PoC flow: профиль → анализ → вакансии → резюме
     * POST /poc/run
     */
    @Post('poc/run')
    @HttpCode(HttpStatus.OK)
    async pocRun(
        @Body() dto: PocRunDto,
    ): Promise<{ success: boolean; data: PocRunResult }> {
        this.logger.log('[POST /ai/poc/run]');
        const data = await this.agentRunner.runPocFlow(dto);
        return { success: true, data };
    }

    /**
     * Загрузка резюме (PDF/DOCX) и авто-извлечение ProfileData
     * POST /ai/upload-resume
     */
    @Post('upload-resume')
    @UseInterceptors(FileInterceptor('file'))
    async uploadResume(
        @UploadedFile() file: any,
    ): Promise<{ success: boolean; data: ProfileData }> {
        if (!file) {
            throw new BadRequestException('File is missing');
        }

        this.logger.log(`[POST /ai/upload-resume] Received file: ${file.originalname}`);

        // Шаг 1: извлечем сырой текст
        const rawText = await this.fileParser.extractText(file.buffer, file.mimetype);

        // Шаг 2: прогоняем через LLM тулзу
        const profileData = await this.parseResumeTool.run(rawText);

        return { success: true, data: profileData as ProfileData };
    }

    /**
     * Глубокий AI-анализ резюме с оценкой, сильными/слабыми сторонами и улучшенной версией
     * POST /ai/review-resume
     */
    @Post('review-resume')
    @UseInterceptors(FileInterceptor('file'))
    async reviewResume(
        @UploadedFile() file: any,
        @Body() body: { desiredPosition?: string; skills?: string; aboutMe?: string },
    ): Promise<{ success: boolean; data: ResumeReview }> {
        if (!file) {
            throw new BadRequestException('File is missing');
        }

        this.logger.log(`[POST /ai/review-resume] Received file: ${file.originalname}`);

        try {
            // Step 1: extract raw text from PDF/DOCX
            const rawText = await this.fileParser.extractText(file.buffer, file.mimetype);

            // Step 2: parse profile context from form fields
            let skills: string[] | undefined;
            if (body.skills) {
                try {
                    skills = JSON.parse(body.skills);
                } catch {
                    skills = body.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
                }
            }

            // Step 3: run deep AI review
            const review = await this.reviewResumeTool.run(rawText, {
                desiredPosition: body.desiredPosition,
                skills,
                aboutMe: body.aboutMe,
            });

            return { success: true, data: review };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`[POST /ai/review-resume] Failed: ${message}`);
            throw new InternalServerErrorException(`Ошибка AI-анализа резюме: ${message}`);
        }
    }

    /**
     * Диалоговый подход (ReAct логика)
     * POST /ai/chat - принимает массив сообщений и опционально ProfileData
     */
    @Post('chat')
    @HttpCode(HttpStatus.OK)
    async chat(
        @Body() req: ChatRequest,
    ): Promise<{ success: boolean; result: ChatResponse }> {
        this.logger.log(`[POST /ai/chat] Messages: ${req.messages?.length}`);
        const result = await this.reactAgent.chat(req);
        return { success: true, result };
    }

    /**
     * Генерация наводящих вопросов для создания резюме из профиля
     * POST /ai/create-resume/questions
     */
    @Post('create-resume/questions')
    @HttpCode(HttpStatus.OK)
    async createResumeQuestions(
        @Body() dto: { profileData: ProfileData },
    ): Promise<{ success: boolean; data: ResumeQuestionsResponse }> {
        this.logger.log('[POST /ai/create-resume/questions]');
        try {
            const data = await this.createResumeTool.generateQuestions(dto.profileData);
            return { success: true, data };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`[create-resume/questions] Failed: ${message}`);
            throw new InternalServerErrorException(`Ошибка генерации вопросов: ${message}`);
        }
    }

    /**
     * Генерация резюме из профиля + ответов на вопросы
     * POST /ai/create-resume/generate
     */
    @Post('create-resume/generate')
    @HttpCode(HttpStatus.OK)
    async createResumeGenerate(
        @Body() dto: { profileData: ProfileData; answers: QuestionAnswer[] },
    ): Promise<{ success: boolean; data: CreatedResume }> {
        this.logger.log(`[POST /ai/create-resume/generate] answers: ${dto.answers?.length}`);
        try {
            const data = await this.createResumeTool.generateResume(dto.profileData, dto.answers || []);
            return { success: true, data };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`[create-resume/generate] Failed: ${message}`);
            throw new InternalServerErrorException(`Ошибка генерации резюме: ${message}`);
        }
    }

    @Get('health')
    @Post('health')
    @HttpCode(HttpStatus.OK)
    health(): { status: string; timestamp: string } {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
}
