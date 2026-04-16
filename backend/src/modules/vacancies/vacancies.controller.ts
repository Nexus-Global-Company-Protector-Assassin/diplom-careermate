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

    @Get('recommended')
    @ApiOperation({ summary: 'Get recommended vacancies for user (stub)' })
    getRecommended() {
        return [
            {
                id: "1",
                company: "Yandex",
                title: "Senior Data Analyst",
                location: "Москва",
                type: "Полная",
                posted: "2 дня назад",
                skills: ["Python", "SQL", "Tableau"],
                salary: "200 000 - 300 000 ₽",
                match: "92%",
                matchColor: "text-green-600 bg-green-50",
                logo: "Y",
            },
            {
                id: "2",
                company: "Sber",
                title: "Data Analyst",
                location: "Удалённо",
                type: "Полная",
                posted: "5 дней назад",
                skills: ["Power BI", "SQL", "Excel"],
                salary: "180 000 - 250 000 ₽",
                match: "81%",
                matchColor: "text-blue-600 bg-blue-50",
                logo: "S",
            },
            {
                id: "3",
                company: "VK",
                title: "Product Analyst",
                location: "Санкт-Петербург",
                type: "Полная",
                posted: "1 неделю назад",
                skills: ["Python", "Clickhouse", "Airflow"],
                salary: "220 000 - 280 000 ₽",
                match: "78%",
                matchColor: "text-blue-600 bg-blue-50",
                logo: "V",
            },
        ];
    }

    @Get('responses')
    @ApiOperation({ summary: 'Get user responses (stub)' })
    getResponses() {
        return [
            {
                id: "t1",
                title: "Data Analyst",
                company: "Yandex",
                date: "12.01.2025",
                status: "Рассматривается",
                statusColor: "bg-blue-500",
            },
            {
                id: "t2",
                title: "Senior Analyst",
                company: "Soar",
                date: "10.10.2025",
                status: "Приглашение",
                statusColor: "bg-green-500",
            },
            {
                id: "t3",
                title: "Data Scientist",
                company: "VK",
                date: "08.11.2025",
                status: "Интервью",
                statusColor: "bg-yellow-500",
            },
        ];
    }

    @Post('responses')
    @ApiOperation({ summary: 'Apply to a vacancy (stub)' })
    applyToVacancy(@Body() body: { vacancyId: string; coverLetter?: string }) {
        return { success: true, vacancyId: body.vacancyId, status: "Отправлено" };
    }

    @Post('favorites')
    @ApiOperation({ summary: 'Toggle favorite vacancy (stub)' })
    toggleFavorite(@Body() body: { vacancyId: string; isFavorite: boolean }) {
        return { success: true, vacancyId: body.vacancyId, isFavorite: body.isFavorite };
    }
}
