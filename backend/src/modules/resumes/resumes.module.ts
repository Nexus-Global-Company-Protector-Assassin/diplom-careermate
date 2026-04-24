import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { StorageModule } from '../storage/storage.module';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [StorageModule, AiModule],
    controllers: [ResumesController],
    providers: [ResumesService],
    exports: [ResumesService],
})
export class ResumesModule {}
