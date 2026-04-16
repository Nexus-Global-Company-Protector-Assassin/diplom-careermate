import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('weekly')
    @ApiOperation({ summary: 'Get weekly report stats (stub)' })
    getWeeklyReport() {
        return this.analyticsService.getWeeklyReport();
    }
}
