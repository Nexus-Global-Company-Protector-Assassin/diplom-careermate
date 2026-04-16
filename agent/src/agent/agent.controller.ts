import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Logger,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AgentRunnerService, PocRunInput, PocRunResult } from './agent.service';
import { FileParserService } from './parser/file-parser.service';
import { ParseResumeTool } from './tools/parse-resume.tool';
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
     * Health check агента
     */
    @Post('health')
    @HttpCode(HttpStatus.OK)
    health(): { status: string; timestamp: string } {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
}
