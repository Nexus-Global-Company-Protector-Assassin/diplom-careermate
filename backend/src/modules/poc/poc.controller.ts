import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PocService } from './poc.service';
import { RunPocDto } from './dto/run-poc.dto';

@ApiTags('PoC')
@Controller('poc')
export class PocController {
    constructor(private readonly pocService: PocService) { }

    @Post('run')
    @ApiOperation({ summary: 'Run analysis for a profile using data from frontend' })
    @ApiResponse({ status: 201, description: 'Analysis started and results returned.' })
    async run(@Body() body: RunPocDto) {
        return this.pocService.runAnalysis(body);
    }

    @Get('result')
    @ApiOperation({ summary: 'Get latest analysis result' })
    async getResult() {
        return this.pocService.getLatestResult();
    }
}
