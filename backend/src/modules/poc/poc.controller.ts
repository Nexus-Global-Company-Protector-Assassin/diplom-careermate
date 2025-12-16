import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PocService } from './poc.service';

@ApiTags('PoC')
@Controller('poc')
export class PocController {
    constructor(private readonly pocService: PocService) { }

    @Post('run')
    @ApiOperation({ summary: 'Run analysis for a profile' })
    async run(@Body('userId') userId: string) {
        // For PoC, we accept userId in body. In real app, it comes from Auth token.
        // If not provided, use demo user.
        const targetUserId = userId || 'demo-user-id';
        return this.pocService.runAnalysis(targetUserId);
    }
}
