import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { PrismaService } from '../common/prisma.service';

@Module({
    controllers: [ApplicationsController],
    providers: [ApplicationsService, PrismaService],
    exports: [ApplicationsService],
})
export class ApplicationsModule { }
