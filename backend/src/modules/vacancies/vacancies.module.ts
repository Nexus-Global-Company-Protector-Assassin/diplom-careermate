import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VacanciesService } from './vacancies.service';
import { VacanciesController } from './vacancies.controller';
import { DatabaseModule } from '../../database/database.module';
import { AiModule } from '../ai/ai.module';
import { SkillsModule } from '../skills/skills.module';
import { EmbeddingsModule } from '../ai/embeddings/embeddings.module';

@Module({
    imports: [DatabaseModule, HttpModule, AiModule, SkillsModule, EmbeddingsModule],
    controllers: [VacanciesController],
    providers: [VacanciesService],
    exports: [VacanciesService],
})
export class VacanciesModule { }
