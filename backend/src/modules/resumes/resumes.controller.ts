import {
    Controller, Get, Post, Body, Delete, Param,
    UseInterceptors, UploadedFile, Query, Res, ParseFilePipe,
    MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { ResumesService } from './resumes.service';

@ApiTags('Resumes')
@Controller('resumes')
export class ResumesController {
    constructor(private readonly resumesService: ResumesService) {}

    @Get('history')
    @ApiOperation({ summary: 'Get generated resumes and sent history' })
    async getHistory() {
        return this.resumesService.getHistory();
    }

    @Post('cover-letter')
    @ApiOperation({ summary: 'Generate cover letter' })
    async generateCoverLetter(@Body() body: { company: string; position: string; keyPoints?: string; profile?: any }) {
        const text = await this.resumesService.generateCoverLetter(body.company, body.position, body.keyPoints, body.profile);
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
                title: { type: 'string' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
    async uploadResume(
        @UploadedFile(new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                new FileTypeValidator({ fileType: /(pdf|msword|vnd\.openxmlformats)/ }),
            ],
            fileIsRequired: true,
        })) file: Express.Multer.File,
        @Query('title') title: string,
    ) {
        return this.resumesService.uploadResumeFile(file, title || file.originalname);
    }

    @Get(':id/file')
    @ApiOperation({ summary: 'Get presigned download URL for original uploaded file' })
    async getDownloadUrl(@Param('id') id: string, @Res() res: Response) {
        const url = await this.resumesService.getDownloadUrl(id);
        res.redirect(url);
    }

    @Post()
    @ApiOperation({ summary: 'Save an uploaded or generated resume to the database' })
    async saveResume(@Body() body: { title: string; subtitle?: string; content?: string; type?: string; reviewData?: any }) {
        return this.resumesService.saveResume(body.title, body.subtitle, body.content, body.type, body.reviewData);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a resume' })
    async deleteResume(@Param('id') id: string) {
        return this.resumesService.deleteResume(id);
    }
}
