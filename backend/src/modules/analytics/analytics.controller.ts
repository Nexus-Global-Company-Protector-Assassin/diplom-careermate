import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('weekly')
    @ApiOperation({ summary: 'Get weekly report stats' })
    getWeeklyReport(@CurrentUser() user: { userId: string }) {
        return this.analyticsService.getWeeklyReport(user.userId);
    }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get dashboard summary with real data' })
    getDashboardSummary(@CurrentUser() user: { userId: string }) {
        return this.analyticsService.getDashboardSummary(user.userId);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get analytics stats by period' })
    @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'quarter', 'year'] })
    getAnalyticsStats(
        @CurrentUser() user: { userId: string },
        @Query('period') period: string = 'week',
    ) {
        return this.analyticsService.getAnalyticsStats(period, user.userId);
    }
}
