import { Injectable } from '@nestjs/common';
import { AnalyzeProfileTool } from './tools/analyze-profile.tool';

@Injectable()
export class AnalysisService {
    constructor(private readonly analyzeProfileTool: AnalyzeProfileTool) {}

    async analyze(profile: any) {
        // Вызываем MCP Tool для анализа профиля через LLM
        const analysisResult = await this.analyzeProfileTool.execute(profile);
        
        // В будущем тут можно вызывать и другие тулзы, 
        // например matching_vacancies или resume_adapting, 
        // и собирать итоговый объект.
        
        return {
            status: 'success',
            ...analysisResult,
            timestamp: new Date().toISOString(),
        };
    }
}
