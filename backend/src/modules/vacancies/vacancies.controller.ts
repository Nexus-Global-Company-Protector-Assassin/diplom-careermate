import { Controller, Get, Post, Query, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { VacanciesService } from './vacancies.service';

@ApiTags('Vacancies')
@Controller('vacancies')
@UseGuards(JwtAuthGuard)
export class VacanciesController {
    constructor(private readonly vacanciesService: VacanciesService) { }

    @Get()
    @ApiOperation({ summary: 'Get vacancies from DB with optional filters' })
    @ApiQuery({ name: 'query', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'salaryFrom', required: false })
    @ApiQuery({ name: 'salaryTo', required: false })
    @ApiQuery({ name: 'remote', required: false })
    @ApiQuery({ name: 'experience', required: false })
    @ApiQuery({ name: 'location', required: false })
    getVacancies(
        @Query('query') query?: string,
        @Query('limit') limit?: string,
        @Query('salaryFrom') salaryFrom?: string,
        @Query('salaryTo') salaryTo?: string,
        @Query('remote') remote?: string,
        @Query('experience') experience?: string,
        @Query('location') location?: string,
    ) {
        return this.vacanciesService.getVacancies({
            query,
            limit: limit ? parseInt(limit) : 20,
            salaryFrom: salaryFrom ? parseInt(salaryFrom) : undefined,
            salaryTo: salaryTo ? parseInt(salaryTo) : undefined,
            remote: remote === 'true',
            experience,
            location,
        });
    }

    @Post('search')
    @ApiOperation({ summary: 'Fetch vacancies from Adzuna and save to DB' })
    searchAndSave(@Body() body: { query: string; count?: number }) {
        return this.vacanciesService.searchAndSave(body.query, body.count || 10);
    }

    @Get('recommended')
    @ApiOperation({ summary: 'Get top-10 recommended vacancies based on user profile' })
    @ApiQuery({ name: 'position', required: false, description: 'Desired job position' })
    @ApiQuery({ name: 'skills', required: false, description: 'Comma-separated skill list' })
    @ApiQuery({ name: 'limit', required: false })
    async getRecommended(
        @CurrentUser() user: { userId: string },
        @Query('position') position?: string,
        @Query('skills') skillsRaw?: string,
        @Query('salary') salaryStr?: string,
        @Query('limit') limit?: string,
    ) {
        const profileSkills = skillsRaw
            ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean)
            : [];
        const pos = position || '';
        const salary = salaryStr ? parseInt(salaryStr, 10) : undefined;
        const lim = limit ? parseInt(limit) : 10;

        const vacancies = await this.vacanciesService.getRecommendedForProfile(pos, profileSkills, lim, salary, user.userId);

        return vacancies.map((v: any) => ({
            id: v.id,
            company: v.employer || 'Unknown',
            title: v.title,
            location: v.location || 'Не указано',
            type: v.schedule || 'Полная занятость',
            posted: v.publishedAt ? this.formatDate(v.publishedAt) : (v.createdAt ? this.formatDate(v.createdAt) : 'Недавно'),
            skills: Array.isArray(v.skills) ? v.skills : [],
            salary: v.salaryLabel || 'Зарплата не указана',
            salaryFrom: v.salaryFrom || null,
            salaryTo: v.salaryTo || null,
            match: `${v.matchScore ?? 70}`,
            matchScore: v.matchScore ?? 70,
            matchColor: (v.matchScore ?? 70) >= 75
                ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
                : (v.matchScore ?? 70) >= 50
                    ? 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30'
                    : 'text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
            logo: (v.employer || 'X')[0].toUpperCase(),
            url: v.url || null,
            archetype: v.archetype || 'Unknown',
            matchedSkills: v.matchedSkills || [],
            missingSkills: v.missingSkills || [],
            matchReasons: v.matchReasons || [],
            freshnessScore: v.freshness?.score ?? null,
            freshnessLabel: v.freshness?.label ?? null,
            daysOld: v.freshness?.daysOld ?? null,
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

    @Post(':id/interaction')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Record behavioral interaction signal for a vacancy' })
    @ApiParam({ name: 'id', description: 'Vacancy ID' })
    async trackInteraction(
        @CurrentUser() user: { userId: string },
        @Param('id') vacancyId: string,
        @Body() body: { type: string },
    ): Promise<void> {
        await this.vacanciesService.recordInteraction(vacancyId, body.type, user.userId);
    }

    @Get('responses')
    @ApiOperation({ summary: 'Get user responses (stub)' })
    getResponses() {
        return [];
    }

    @Post('responses')
    @ApiOperation({ summary: 'Apply to a vacancy (stub)' })
    applyToVacancy(@Body() body: { vacancyId: string; coverLetter?: string }) {
        return { success: true, vacancyId: body.vacancyId, status: 'Отправлено' };
    }

    @Post('favorites')
    @ApiOperation({ summary: 'Toggle favorite vacancy (stub)' })
    toggleFavorite(@Body() body: { vacancyId: string; isFavorite: boolean }) {
        return { success: true, vacancyId: body.vacancyId, isFavorite: body.isFavorite };
    }

    @Get(':id/interview-prep')
    @ApiOperation({ summary: 'Generate STAR+R interview preparation for a vacancy' })
    @ApiParam({ name: 'id', description: 'Vacancy ID' })
    @ApiQuery({ name: 'resumeId', required: false, description: 'Resume ID to use for interview prep' })
    async getInterviewPrep(
        @CurrentUser() user: { userId: string },
        @Param('id') id: string,
        @Query('resumeId') resumeId?: string,
    ) {
        return this.vacanciesService.interviewPrep(id, resumeId, user.userId);
    }

    @Get(':id/evaluation')
    @ApiOperation({ summary: 'Get AI deep 6-block analysis for a vacancy' })
    @ApiParam({ name: 'id', description: 'Vacancy ID' })
    @ApiQuery({ name: 'resumeId', required: false, description: 'Resume ID to evaluate against' })
    async getEvaluation(
        @CurrentUser() user: { userId: string },
        @Param('id') id: string,
        @Query('resumeId') resumeId?: string,
    ) {
        return this.vacanciesService.evaluateVacancy(id, resumeId, user.userId);
    }

    @Get(':id/cover-letter')
    @ApiOperation({ summary: 'Generate AI cover letter for a vacancy based on user resume' })
    @ApiParam({ name: 'id', description: 'Vacancy ID' })
    @ApiQuery({ name: 'resumeId', required: false, description: 'Resume ID to use for cover letter generation' })
    @ApiQuery({ name: 'language', required: false, description: 'Language for cover letter: ru or en', enum: ['ru', 'en'] })
    async getCoverLetter(
        @CurrentUser() user: { userId: string },
        @Param('id') id: string,
        @Query('resumeId') resumeId?: string,
        @Query('language') language: 'ru' | 'en' = 'ru',
    ) {
        return this.vacanciesService.generateCoverLetter(id, resumeId, language, user.userId);
    }
}

