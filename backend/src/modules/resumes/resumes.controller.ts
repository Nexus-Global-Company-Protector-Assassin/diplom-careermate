import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResumesService } from './resumes.service';

@ApiTags('Resumes')
@Controller('resumes')
export class ResumesController {
    constructor(private readonly resumesService: ResumesService) {}

    @Get('history')
    @ApiOperation({ summary: 'Get generated resumes and sent history (stub)' })
    async getHistory() {
        return await this.resumesService.getHistory();
    }

    @Post('cover-letter')
    @ApiOperation({ summary: 'Generate cover letter (stub)' })
    async generateCoverLetter(@Body() body: { company: string, position: string, keyPoints?: string, profile?: any }) {
        const text = await this.resumesService.generateCoverLetter(body.company, body.position, body.keyPoints, body.profile);
        return { text };
    }

    @Post()
    @ApiOperation({ summary: 'Save an uploaded or generated resume to the database' })
    async saveResume(@Body() body: { title: string, subtitle?: string, content?: string, type?: string, reviewData?: any }) {
        return await this.resumesService.saveResume(body.title, body.subtitle, body.content, body.type, body.reviewData);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a resume' })
    async deleteResume(@Param('id') id: string) {
        return await this.resumesService.deleteResume(id);
    }
}
