import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';

@ApiTags('Interviews')
@Controller('interviews')
export class InterviewsController {
    constructor(private readonly interviewsService: InterviewsService) {}

    @Get()
    @ApiOperation({ summary: 'Get all user interviews' })
    async getAll() {
        return await this.interviewsService.getAll();
    }

    @Post()
    @ApiOperation({ summary: 'Create new interview' })
    async create(@Body() body: any) {
        return await this.interviewsService.create(body);
    }

    @Put(':id/status')
    @ApiOperation({ summary: 'Update interview status' })
    async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
        return await this.interviewsService.updateStatus(id, body.status);
    }
}
