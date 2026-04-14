import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { LlmModule } from '../llm/llm.module';
import { AnalyzeProfileTool } from './tools/analyze-profile.tool';

@Module({
    imports: [LlmModule],
    controllers: [AnalysisController],
    providers: [AnalysisService, AnalyzeProfileTool],
})
export class AnalysisModule { }
