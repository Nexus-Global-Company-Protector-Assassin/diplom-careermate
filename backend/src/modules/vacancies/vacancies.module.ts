import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VacanciesService } from './vacancies.service';
import { VacanciesController } from './vacancies.controller';
import { DatabaseModule } from '../../database/database.module';
import { AiModule } from '../ai/ai.module';
import { SkillsModule } from '../skills/skills.module';
import { EmbeddingsModule } from '../ai/embeddings/embeddings.module';
import { QuestionGenModule } from '../interviews/question-gen/question-gen.module';
import { UserPreferencesService } from './user-preferences.service';
import { MlRankingModule } from '../ml/ml-ranking.module';
import { QuotaModule } from '../quota/quota.module';

@Module({
    imports: [DatabaseModule, HttpModule, AiModule, SkillsModule, EmbeddingsModule, QuestionGenModule, MlRankingModule, QuotaModule],
    controllers: [VacanciesController],
    providers: [VacanciesService, UserPreferencesService],
    exports: [VacanciesService],
})
export class VacanciesModule { }
