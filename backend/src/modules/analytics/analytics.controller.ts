import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('weekly')
    @ApiOperation({ summary: 'Get weekly report stats' })
    getWeeklyReport() {
        return this.analyticsService.getWeeklyReport();
    }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get dashboard summary with real data' })
    getDashboardSummary() {
        return this.analyticsService.getDashboardSummary();
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get analytics stats by period' })
    @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'quarter', 'year'] })
    getAnalyticsStats(@Query('period') period: string = 'week') {
        return this.analyticsService.getAnalyticsStats(period);
    }
}
