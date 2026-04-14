import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VacanciesService } from './vacancies.service';
import { VacanciesController } from './vacancies.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [DatabaseModule, HttpModule],
    controllers: [VacanciesController],
    providers: [VacanciesService],
    exports: [VacanciesService],
})
export class VacanciesModule {}
