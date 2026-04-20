import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) {}

    async getWeeklyReport() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const [vacancyCount, interviewCount, responseCount, aiResumeCount] = await Promise.all([
            this.prisma.vacancy.count({
                where: { createdAt: { gte: oneWeekAgo } },
            }),
            this.prisma.interview.count({
                where: { status: 'upcoming' },
            }),
            this.prisma.vacancyResponse.count({
                where: { responseDate: { gte: oneWeekAgo } },
            }),
            this.prisma.resume.count({
                where: {
                    type: 'ai_improved',
                    createdAt: { gte: oneWeekAgo },
                },
            }),
        ]);

        return [
            { icon: '📋', value: String(vacancyCount), label: 'Новые вакансии' },
            { icon: '🗓️', value: String(interviewCount), label: 'Интервью назначено' },
            { icon: '📧', value: String(responseCount), label: 'Откликов отправлено' },
            { icon: '🤖', value: String(aiResumeCount), label: 'Рекомендации ИИ' },
        ];
    }

    async getDashboardSummary() {
        // Get first user's profile (PoC mode)
        const profile = await this.prisma.profile.findFirst({
            include: {
                resumes: true,
                interviews: true,
                vacancyResponses: true,
            },
        });

        if (!profile) {
            return this.getEmptyDashboard();
        }

        // Career progress calculation
        const hasProfile = !!(profile.fullName && profile.desiredPosition);
        const hasResume = profile.resumes.length > 0;
        const hasResponses = profile.vacancyResponses.length > 0;
        const hasInvitations = profile.interviews.length > 0;

        // Profile completion calculation
        const completionFields = [
            { id: 'personal', label: 'Личные данные', completed: !!(profile.fullName && profile.phone), href: '/profile' },
            { id: 'experience', label: 'Опыт работы', completed: !!(profile.workExperience && (profile.workExperience as any[]).length > 0), href: '/profile' },
            { id: 'education', label: 'Образование', completed: !!(profile.education && (profile.education as any[]).length > 0), href: '/profile' },
            { id: 'skills', label: 'Навыки', completed: !!(profile.skills && Object.keys(profile.skills as object).length > 0), href: '/profile' },
            { id: 'resume', label: 'Загружено резюме', completed: hasResume, href: '/resume' },
            { id: 'photo', label: 'Фото профиля', completed: false, href: '/profile' },
            { id: 'goal', label: 'Карьерная цель', completed: !!(profile.desiredPosition), href: '/profile' },
            { id: 'linkedin', label: 'Связь с LinkedIn', completed: !!(profile.linkedinUrl), href: '/settings' },
        ];

        // Achievement calculation
        const totalResponses = profile.vacancyResponses.length;
        const totalInterviews = profile.interviews.length;
        const totalResumes = profile.resumes.filter(r => r.type === 'resume').length;
        const completedCount = completionFields.filter(f => f.completed).length;
        const completionPercent = Math.round((completedCount / completionFields.length) * 100);

        const achievements = [
            {
                id: '1', name: 'Первый шаг', description: 'Создать первое резюме',
                unlocked: hasResume, progress: totalResumes, maxProgress: 1, color: 'text-yellow-500',
            },
            {
                id: '2', name: 'Активный соискатель', description: 'Отправить 10 откликов',
                unlocked: totalResponses >= 10, progress: Math.min(totalResponses, 10), maxProgress: 10, color: 'text-blue-500',
            },
            {
                id: '3', name: 'Целеустремлённый', description: 'Установить карьерную цель',
                unlocked: !!(profile.desiredPosition), progress: profile.desiredPosition ? 1 : 0, maxProgress: 1, color: 'text-green-500',
            },
            {
                id: '4', name: 'Профессионал', description: 'Заполнить профиль на 100%',
                unlocked: completionPercent >= 100, progress: completionPercent, maxProgress: 100, color: 'text-purple-500',
            },
            {
                id: '5', name: 'На волне', description: 'Получить 5 приглашений на интервью',
                unlocked: totalInterviews >= 5, progress: Math.min(totalInterviews, 5), maxProgress: 5, color: 'text-orange-500',
            },
            {
                id: '6', name: 'Мастер резюме', description: 'Создать 3 разных резюме',
                unlocked: totalResumes >= 3, progress: Math.min(totalResumes, 3), maxProgress: 3, color: 'text-amber-500',
            },
        ];

        // Salary data from profile + market data from vacancies
        const salaryData = await this.getSalaryComparison(profile);

        return {
            fullName: profile.fullName || 'Пользователь',
            careerGoal: {
                position: profile.desiredPosition || 'Не указана',
                location: profile.location || 'Не указана',
                salary: this.formatSalaryRange(profile.desiredSalaryMin, profile.desiredSalaryMax),
                experience: profile.experienceYears ? `${profile.experienceYears}+ лет` : 'Не указан',
            },
            careerProgress: [
                { label: 'Анализ завершен', done: hasProfile },
                { label: 'Резюме готово', done: hasResume },
                { label: 'Отклики идут', done: hasResponses },
                { label: 'Приглашения', done: hasInvitations },
            ],
            profileCompletion: completionFields,
            achievements,
            salaryData,
        };
    }

    async getAnalyticsStats(period: string) {
        const now = new Date();
        let startDate: Date;
        let previousStartDate: Date;

        switch (period) {
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                previousStartDate = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
                break;
            case 'quarter':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                previousStartDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                break;
            case 'year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                previousStartDate = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
                break;
            default: // week
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        }

        // Current period stats
        const [responses, interviews, prevResponses, prevInterviews] = await Promise.all([
            this.prisma.vacancyResponse.findMany({
                where: { responseDate: { gte: startDate } },
            }),
            this.prisma.interview.findMany({
                where: { createdAt: { gte: startDate } },
            }),
            this.prisma.vacancyResponse.count({
                where: { responseDate: { gte: previousStartDate, lt: startDate } },
            }),
            this.prisma.interview.count({
                where: { createdAt: { gte: previousStartDate, lt: startDate } },
            }),
        ]);

        const totalResponses = responses.length;
        const invitedCount = responses.filter(r => r.status === 'invited').length;
        const responseRate = totalResponses > 0 ? Math.round((invitedCount / totalResponses) * 100) : 0;
        const totalInterviews = interviews.length;

        // Profile completion percentage
        const profile = await this.prisma.profile.findFirst();
        const profileOptimization = profile ? this.calculateProfileCompletion(profile) : 0;

        // Response change
        const responseDiff = totalResponses - prevResponses;
        const interviewDiff = totalInterviews - prevInterviews;

        const periodLabel = period === 'week' ? '24 часа' : period === 'month' ? 'неделю' : period === 'quarter' ? 'месяц' : 'квартал';

        const statsCards = [
            {
                value: String(totalResponses), label: 'Отправлено откликов',
                change: `${responseDiff >= 0 ? '+' : ''}${responseDiff} за последние ${periodLabel}`,
                positive: responseDiff >= 0,
            },
            {
                value: `${responseRate}%`, label: 'Коэффициент ответов',
                change: `Приглашений: ${invitedCount} из ${totalResponses}`,
                positive: responseRate > 0,
            },
            {
                value: String(totalInterviews), label: 'Приглашение на интервью',
                change: `${interviewDiff >= 0 ? '+' : ''}${interviewDiff} за последние ${periodLabel}`,
                positive: interviewDiff >= 0,
            },
            {
                value: `${profileOptimization}%`, label: 'Оптимизация профиля',
                change: profileOptimization >= 80 ? 'Отличный результат!' : 'Заполните профиль',
                positive: profileOptimization >= 50,
            },
        ];

        // Activity data (group responses by day/week/month)
        const activityData = await this.getActivityData(period, startDate);

        // Status pie chart
        const allResponses = await this.prisma.vacancyResponse.findMany();
        const statusData = [
            { name: 'Новые', value: allResponses.filter(r => r.status === 'sent').length, color: '#22c55e' },
            { name: 'Рассматриваются', value: allResponses.filter(r => r.status === 'viewing').length, color: '#3b82f6' },
            { name: 'Приглашения', value: allResponses.filter(r => r.status === 'invited').length, color: '#f59e0b' },
            { name: 'Отклонено', value: allResponses.filter(r => r.status === 'rejected').length, color: '#ef4444' },
        ];

        // If all zeros, show placeholder so chart isn't empty
        const hasAnyStatus = statusData.some(s => s.value > 0);
        const finalStatusData = hasAnyStatus ? statusData : [
            { name: 'Нет данных', value: 1, color: '#94a3b8' },
        ];

        return { statsCards, activityData, statusData: finalStatusData };
    }

    private async getActivityData(period: string, startDate: Date) {
        const responses = await this.prisma.vacancyResponse.findMany({
            where: { responseDate: { gte: startDate } },
            orderBy: { responseDate: 'asc' },
        });

        const interviews = await this.prisma.interview.findMany({
            where: { createdAt: { gte: startDate } },
            orderBy: { createdAt: 'asc' },
        });

        if (period === 'week') {
            const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
            return days.map((name, i) => ({
                name,
                отклики: responses.filter(r => new Date(r.responseDate).getDay() === (i + 1) % 7).length,
                приглашения: interviews.filter(r => new Date(r.createdAt).getDay() === (i + 1) % 7).length,
            }));
        }

        if (period === 'month') {
            return [1, 2, 3, 4].map(week => {
                const weekStart = new Date(startDate.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
                const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                return {
                    name: `${week} нед`,
                    отклики: responses.filter(r => new Date(r.responseDate) >= weekStart && new Date(r.responseDate) < weekEnd).length,
                    приглашения: interviews.filter(r => new Date(r.createdAt) >= weekStart && new Date(r.createdAt) < weekEnd).length,
                };
            });
        }

        if (period === 'quarter') {
            const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
            const result: { name: string; отклики: number; приглашения: number }[] = [];
            for (let i = 0; i < 3; i++) {
                const mDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
                const mEnd = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 1);
                result.push({
                    name: months[mDate.getMonth()],
                    отклики: responses.filter(r => new Date(r.responseDate) >= mDate && new Date(r.responseDate) < mEnd).length,
                    приглашения: interviews.filter(r => new Date(r.createdAt) >= mDate && new Date(r.createdAt) < mEnd).length,
                });
            }
            return result;
        }

        // year — by quarters
        return [1, 2, 3, 4].map(q => {
            const qStart = new Date(startDate.getFullYear(), (q - 1) * 3, 1);
            const qEnd = new Date(startDate.getFullYear(), q * 3, 1);
            return {
                name: `Q${q}`,
                отклики: responses.filter(r => new Date(r.responseDate) >= qStart && new Date(r.responseDate) < qEnd).length,
                приглашения: interviews.filter(r => new Date(r.createdAt) >= qStart && new Date(r.createdAt) < qEnd).length,
            };
        });
    }

    private async getSalaryComparison(profile: any) {
        const position = profile.desiredPosition || 'Разработчик';
        const yourSalary = profile.desiredSalaryMax || profile.desiredSalaryMin || 0;

        // Get market data from saved vacancies
        const vacancies = await this.prisma.vacancy.findMany({
            where: {
                OR: [
                    { salaryFrom: { not: null } },
                    { salaryTo: { not: null } },
                ],
            },
        });

        let marketMin = 0, marketMax = 0, marketAvg = 0, vacancyInRange = 0;

        if (vacancies.length > 0) {
            const salaries = vacancies.map(v => v.salaryTo || v.salaryFrom || 0).filter(s => s > 0);
            if (salaries.length > 0) {
                marketMin = Math.min(...salaries);
                marketMax = Math.max(...salaries);
                marketAvg = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
            }

            if (yourSalary > 0) {
                const range = yourSalary * 0.2;
                vacancyInRange = vacancies.filter(v => {
                    const s = v.salaryTo || v.salaryFrom || 0;
                    return s >= yourSalary - range && s <= yourSalary + range;
                }).length;
            }
        }

        // Fallback values if no vacancy data
        if (marketMin === 0) {
            marketMin = yourSalary > 0 ? Math.round(yourSalary * 0.7) : 100000;
            marketMax = yourSalary > 0 ? Math.round(yourSalary * 1.4) : 350000;
            marketAvg = yourSalary > 0 ? Math.round(yourSalary * 1.0) : 200000;
        }

        return {
            position,
            yourSalary: yourSalary || marketAvg,
            marketAvg,
            marketMin,
            marketMax,
            vacanciesInRange: vacancyInRange,
        };
    }

    private formatSalaryRange(min: number | null, max: number | null): string {
        const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n);
        if (min && max) return `${fmt(min)} - ${fmt(max)} ₽`;
        if (min) return `от ${fmt(min)} ₽`;
        if (max) return `до ${fmt(max)} ₽`;
        return 'Не указана';
    }

    private calculateProfileCompletion(profile: any): number {
        const fields = [
            profile.fullName,
            profile.phone,
            profile.location,
            profile.desiredPosition,
            profile.workExperience && (profile.workExperience as any[]).length > 0,
            profile.education && (profile.education as any[]).length > 0,
            profile.skills && Object.keys(profile.skills as object).length > 0,
            profile.linkedinUrl,
        ];
        const filled = fields.filter(Boolean).length;
        return Math.round((filled / fields.length) * 100);
    }

    private getEmptyDashboard() {
        return {
            fullName: 'Пользователь',
            careerGoal: {
                position: 'Не указана',
                location: 'Не указана',
                salary: 'Не указана',
                experience: 'Не указан',
            },
            careerProgress: [
                { label: 'Анализ завершен', done: false },
                { label: 'Резюме готово', done: false },
                { label: 'Отклики идут', done: false },
                { label: 'Приглашения', done: false },
            ],
            profileCompletion: [
                { id: 'personal', label: 'Личные данные', completed: false, href: '/profile' },
                { id: 'experience', label: 'Опыт работы', completed: false, href: '/profile' },
                { id: 'education', label: 'Образование', completed: false, href: '/profile' },
                { id: 'skills', label: 'Навыки', completed: false, href: '/profile' },
                { id: 'resume', label: 'Загружено резюме', completed: false, href: '/resume' },
                { id: 'photo', label: 'Фото профиля', completed: false, href: '/profile' },
                { id: 'goal', label: 'Карьерная цель', completed: false, href: '/profile' },
                { id: 'linkedin', label: 'Связь с LinkedIn', completed: false, href: '/settings' },
            ],
            achievements: [],
            salaryData: {
                position: 'Не указана',
                yourSalary: 0,
                marketAvg: 200000,
                marketMin: 100000,
                marketMax: 350000,
                vacanciesInRange: 0,
            },
        };
    }
}
