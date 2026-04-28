import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { QuotaService } from './quota.service';

@ApiTags('Quota')
@ApiBearerAuth()
@Controller('quota')
@UseGuards(JwtAuthGuard)
export class QuotaController {
    constructor(private readonly quotaService: QuotaService) {}

    @Get('me')
    @ApiOperation({ summary: 'Get current quota usage for the authenticated user' })
    getMyQuota(@CurrentUser() user: { userId: string }) {
        return this.quotaService.getStatus(user.userId);
    }
}
