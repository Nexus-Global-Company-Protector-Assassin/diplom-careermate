import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VacanciesService } from './vacancies.service';
import { VacanciesController } from './vacancies.controller';
import { DatabaseModule } from '../../database/database.module';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [DatabaseModule, HttpModule, AiModule],
    controllers: [VacanciesController],
    providers: [VacanciesService],
    exports: [VacanciesService],
})
export class VacanciesModule { }
