import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VacanciesService } from './vacancies.service';

@ApiTags('Vacancies')
@Controller('vacancies')
export class VacanciesController {
    constructor(private readonly vacanciesService: VacanciesService) {}

    @Get()
    @ApiOperation({ summary: 'Get saved vacancies from DB (with optional search filter)' })
    @ApiQuery({ name: 'query', required: false })
    @ApiQuery({ name: 'limit', required: false })
    getVacancies(
        @Query('query') query?: string,
        @Query('limit') limit?: string,
    ) {
        return this.vacanciesService.getVacancies(query, limit ? parseInt(limit) : 20);
    }

    @Post('search')
    @ApiOperation({ summary: 'Parse vacancies from HH.ru and save to DB' })
    searchAndSave(@Body() body: { query: string; count?: number }) {
        return this.vacanciesService.searchAndSave(body.query, body.count || 10);
    }
}
