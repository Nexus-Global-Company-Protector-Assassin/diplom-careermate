import { Module } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { ResumesController } from './resumes.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
    controllers: [ResumesController],
    providers: [ResumesService, PrismaService],
    exports: [ResumesService],
})
export class ResumesModule { }
