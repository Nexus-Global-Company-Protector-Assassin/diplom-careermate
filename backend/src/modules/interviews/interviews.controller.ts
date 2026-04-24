import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { InterviewsService } from './interviews.service';

@ApiTags('Interviews')
@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewsController {
    constructor(private readonly interviewsService: InterviewsService) {}

    @Get()
    @ApiOperation({ summary: 'Get all user interviews' })
    async getAll(@CurrentUser() user: { userId: string }) {
        return await this.interviewsService.getAll(user.userId);
    }

    @Post()
    @ApiOperation({ summary: 'Create new interview' })
    async create(@CurrentUser() user: { userId: string }, @Body() body: any) {
        return await this.interviewsService.create(body, user.userId);
    }

    @Put(':id/status')
    @ApiOperation({ summary: 'Update interview status' })
    async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
        return await this.interviewsService.updateStatus(id, body.status);
    }
}
