import {
    Controller, Get, Post, Body, Delete, Param,
    UseInterceptors, UploadedFile, Query, ParseFilePipe,
    MaxFileSizeValidator, FileTypeValidator, Redirect, UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ResumesService } from './resumes.service';

@ApiTags('Resumes')
@Controller('resumes')
@UseGuards(JwtAuthGuard)
export class ResumesController {
    constructor(private readonly resumesService: ResumesService) {}

    @Get('history')
    @ApiOperation({ summary: 'Get generated resumes and sent history' })
    async getHistory(@CurrentUser() user: { userId: string }) {
        return this.resumesService.getHistory(user.userId);
    }

    @Post('cover-letter')
    @ApiOperation({ summary: 'Generate cover letter' })
    async generateCoverLetter(
        @CurrentUser() user: { userId: string },
        @Body() body: { company: string; position: string; keyPoints?: string; profile?: any },
    ) {
        const text = await this.resumesService.generateCoverLetter(body.company, body.position, body.keyPoints, body.profile, user.userId);
        return { text };
    }

    @Post('upload')
    @ApiOperation({ summary: 'Upload a PDF/DOCX resume file to object storage (MinIO/S3)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @ApiQuery({ name: 'title', required: false, description: 'Display name for the resume' })
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
    async uploadResume(
        @CurrentUser() user: { userId: string },
        @UploadedFile(new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                // Covers application/pdf, application/msword (.doc), application/vnd.openxmlformats (.docx), application/x-cfb (legacy .doc magic bytes)
                new FileTypeValidator({ fileType: /(pdf|msword|vnd\.openxmlformats|x-cfb)/ }),
            ],
            fileIsRequired: true,
        })) file: Express.Multer.File,
        @Query('title') title: string,
    ) {
        return this.resumesService.uploadResumeFile(file, title || file.originalname, user.userId);
    }

    @Get(':id/file')
    @ApiOperation({ summary: 'Redirect to presigned download URL for original uploaded file' })
    @Redirect()
    async getDownloadUrl(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
        const url = await this.resumesService.getDownloadUrl(id, user.userId);
        return { url, statusCode: 302 };
    }

    @Post()
    @ApiOperation({ summary: 'Save an uploaded or generated resume to the database' })
    async saveResume(
        @CurrentUser() user: { userId: string },
        @Body() body: { title: string; subtitle?: string; content?: string; type?: string; reviewData?: any },
    ) {
        return this.resumesService.saveResume(body.title, body.subtitle, body.content, body.type, body.reviewData, user.userId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a resume' })
    async deleteResume(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
        return this.resumesService.deleteResume(id, user.userId);
    }
}
