import { Controller, Post, Body } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('analyze')
export class AnalysisController {
    constructor(private readonly analysisService: AnalysisService) { }

    @Post()
    analyze(@Body('profile') profile: any) {
        return this.analysisService.analyze(profile);
    }
}
