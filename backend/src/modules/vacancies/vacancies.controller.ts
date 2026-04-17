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
    @ApiOperation({ summary: 'Get recommended vacancies from DB' })
    async getRecommended() {
        const vacancies = await this.vacanciesService.getVacancies(undefined, 20);
        // Map DB vacancies to frontend Job shape
        return vacancies.map((v: any, i: number) => ({
            id: v.id,
            company: v.employer || 'Unknown',
            title: v.title,
            location: v.location || 'Не указано',
            type: v.schedule || 'Полная',
            posted: v.createdAt ? this.formatDate(v.createdAt) : 'Недавно',
            skills: v.skills || [],
            salary: v.salaryLabel || 'Зарплата не указана',
            match: `${Math.max(60, 95 - i * 3)}%`,
            matchColor: i < 2 ? 'text-green-600 bg-green-50' : 'text-blue-600 bg-blue-50',
            logo: (v.employer || 'X')[0].toUpperCase(),
            url: v.url || null,
            source: 'adzuna',
        }));
    }

    private formatDate(date: Date): string {
        const now = new Date();
        const diff = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Сегодня';
        if (diff === 1) return 'Вчера';
        if (diff < 7) return `${diff} дней назад`;
        if (diff < 30) return `${Math.floor(diff / 7)} нед. назад`;
        return `${Math.floor(diff / 30)} мес. назад`;
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
