import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

// Adzuna API base URL
const ADZUNA_API = 'https://api.adzuna.com/v1/api/jobs';

// Realistic mock vacancies for when Adzuna API is unavailable or not configured
function getMockVacancies(query: string, count: number) {
    const templates = [
        {
            hhId: `mock-${query}-001`,
            title: query,
            employer: 'Yandex',
            location: 'Москва',
            salaryLabel: 'от 200 000 до 350 000 ₽',
            salaryFrom: 200000,
            salaryTo: 350000,
            salaryCurrency: 'RUR',
            skills: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'GraphQL'],
            descriptionPreview: `Ищем опытного ${query} для работы над высоконагруженными продуктами. Команда использует современный стек: TypeScript, React, Node.js...`,
            experience: 'От 3 до 6 лет',
            schedule: 'Полный день',
            searchQuery: query,
        },
        {
            hhId: `mock-${query}-002`,
            title: `Senior ${query}`,
            employer: 'Сбер',
            location: 'Удалённо',
            salaryLabel: 'от 250 000 до 400 000 ₽',
            salaryFrom: 250000,
            salaryTo: 400000,
            salaryCurrency: 'RUR',
            skills: ['TypeScript', 'Vue.js', 'React', 'Docker', 'Kubernetes'],
            descriptionPreview: `Приглашаем Senior ${query} в нашу команду. Мы занимаемся разработкой финтех-продуктов с миллионами пользователей...`,
            experience: 'От 6 лет',
            schedule: 'Удалённая работа',
            searchQuery: query,
        },
        {
            hhId: `mock-${query}-003`,
            title: `Middle ${query}`,
            employer: 'VK',
            location: 'Санкт-Петербург',
            salaryLabel: 'от 150 000 до 220 000 ₽',
            salaryFrom: 150000,
            salaryTo: 220000,
            salaryCurrency: 'RUR',
            skills: ['JavaScript', 'React', 'Redux', 'Node.js', 'PostgreSQL'],
            descriptionPreview: `Ищем Middle ${query} для работы над социальной сетью. Задачи: разработка новых фичей, оптимизация производительности...`,
            experience: 'От 1 года до 3 лет',
            schedule: 'Гибкий график',
            searchQuery: query,
        },
        {
            hhId: `mock-${query}-004`,
            title: `${query} / Frontend Developer`,
            employer: 'Авито',
            location: 'Москва',
            salaryLabel: 'от 180 000 до 300 000 ₽',
            salaryFrom: 180000,
            salaryTo: 300000,
            salaryCurrency: 'RUR',
            skills: ['React', 'TypeScript', 'CSS', 'WebPack', 'Git'],
            descriptionPreview: `Авито ищет Frontend Developer со специализацией ${query}. Продукт — крупнейшая площадка объявлений в России...`,
            experience: 'От 3 до 6 лет',
            schedule: 'Полный день',
            searchQuery: query,
        },
        {
            hhId: `mock-${query}-005`,
            title: `Junior ${query}`,
            employer: 'OZON',
            location: 'Удалённо',
            salaryLabel: 'от 80 000 до 130 000 ₽',
            salaryFrom: 80000,
            salaryTo: 130000,
            salaryCurrency: 'RUR',
            skills: ['JavaScript', 'React', 'HTML', 'CSS', 'Git'],
            descriptionPreview: `OZON Tech ищет начинающего ${query}. Мы предлагаем быстрый профессиональный рост, наставника и работу над реальными продуктами...`,
            experience: 'Нет опыта',
            schedule: 'Удалённая работа',
            searchQuery: query,
        },
    ];
    return templates.slice(0, Math.min(count, templates.length));
}

/** Maps Adzuna contract_type/contract_time to a human-readable schedule label */
function mapSchedule(contractType?: string, contractTime?: string): string | null {
    const type = (contractType || '').toLowerCase();
    const time = (contractTime || '').toLowerCase();

    if (type === 'permanent') return 'Полная занятость';
    if (type === 'contract') return 'Контракт';
    if (type === 'part_time' || time === 'part_time') return 'Частичная занятость';
    if (time === 'full_time') return 'Полный день';
    return null;
}

@Injectable()
export class VacanciesService {
    private readonly logger = new Logger(VacanciesService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Получить список вакансий из БД
     */
    async getVacancies(query?: string, limit = 20) {
        const where = query
            ? { searchQuery: { contains: query, mode: 'insensitive' as const } }
            : {};

        return this.prisma.vacancy.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    /**
     * Ищет вакансии через Adzuna API и сохраняет в БД.
     * Если ADZUNA_APP_ID/APP_KEY не заданы или API недоступен —
     * автоматически использует mock-данные для демонстрации функционала.
     *
     * Для подключения реального API: зарегистрируйтесь на https://developer.adzuna.com
     * и добавьте ADZUNA_APP_ID / ADZUNA_APP_KEY в .env
     */
    async searchAndSave(query: string, count = 10) {
        this.logger.log(`[Adzuna API] Searching: "${query}", count: ${count}`);

        const appId = this.configService.get<string>('ADZUNA_APP_ID');
        const appKey = this.configService.get<string>('ADZUNA_APP_KEY');
        const country = this.configService.get<string>('ADZUNA_COUNTRY') || 'gb';

        // Fast-path mock: no credentials configured
        if (!appId || !appKey) {
            this.logger.warn('[Adzuna API] No credentials (ADZUNA_APP_ID / ADZUNA_APP_KEY). Using mock data.');
            return this.saveMock(query, count);
        }

        let results: any[] = [];

        try {
            const res = await firstValueFrom(
                this.httpService.get(`${ADZUNA_API}/${country}/search/1`, {
                    params: {
                        app_id: appId,
                        app_key: appKey,
                        what: query,
                        results_per_page: Math.min(count, 50),
                        'content-type': 'application/json',
                    },
                    timeout: 15000,
                })
            );
            results = res.data?.results || [];
            this.logger.log(`[Adzuna API] Found ${results.length} vacancies`);
        } catch (err: any) {
            const status = err.response?.status;
            this.logger.warn(`[Adzuna API] Request failed (status ${status ?? 'unknown'}): ${err.message}. Falling back to mock data.`);
            return this.saveMock(query, count);
        }

        // Map Adzuna response → Prisma Vacancy
        const saved: any[] = [];

        for (const item of results) {
            try {
                const salaryFrom: number | null = item.salary_min ? Math.round(item.salary_min) : null;
                const salaryTo: number | null = item.salary_max ? Math.round(item.salary_max) : null;

                let salaryLabel = 'Зарплата не указана';
                if (salaryFrom && salaryTo) {
                    salaryLabel = `от ${salaryFrom.toLocaleString('ru')} до ${salaryTo.toLocaleString('ru')} £`;
                } else if (salaryFrom) {
                    salaryLabel = `от ${salaryFrom.toLocaleString('ru')} £`;
                } else if (salaryTo) {
                    salaryLabel = `до ${salaryTo.toLocaleString('ru')} £`;
                }

                const descriptionRaw = item.description || '';
                const descriptionPreview = this.cleanHtml(descriptionRaw).slice(0, 200) + (descriptionRaw.length > 200 ? '...' : '');

                const upserted = await this.prisma.vacancy.upsert({
                    where: { hhId: String(item.id) },
                    create: {
                        hhId: String(item.id),
                        title: item.title ?? query,
                        employer: item.company?.display_name ?? 'Unknown',
                        location: item.location?.display_name ?? null,
                        salaryLabel,
                        salaryFrom,
                        salaryTo,
                        salaryCurrency: 'GBP',
                        skills: [],
                        descriptionPreview,
                        experience: null,
                        schedule: mapSchedule(item.contract_type, item.contract_time),
                        searchQuery: query,
                    },
                    update: {
                        title: item.title ?? query,
                        salaryLabel,
                        schedule: mapSchedule(item.contract_type, item.contract_time),
                        searchQuery: query,
                        updatedAt: new Date(),
                    },
                });

                saved.push(upserted);
            } catch (e: any) {
                this.logger.warn(`[Adzuna API] Upsert failed for vacancy ${item.id}: ${e.message}`);
            }
        }

        this.logger.log(`[Adzuna API] Saved ${saved.length} vacancies to DB`);
        return saved;
    }

    /** Save mock vacancies to DB and return them */
    private async saveMock(query: string, count: number) {
        const mockItems = getMockVacancies(query, count);
        const saved: any[] = [];

        for (const mock of mockItems) {
            try {
                const upserted = await this.prisma.vacancy.upsert({
                    where: { hhId: mock.hhId },
                    create: mock,
                    update: {
                        title: mock.title,
                        salaryLabel: mock.salaryLabel,
                        skills: mock.skills,
                        experience: mock.experience,
                        schedule: mock.schedule,
                        searchQuery: query,
                        updatedAt: new Date(),
                    },
                });
                saved.push(upserted);
            } catch (e: any) {
                this.logger.warn(`[Mock] Upsert failed for ${mock.hhId}: ${e.message}`);
            }
        }

        this.logger.log(`[Mock] Saved ${saved.length} mock vacancies to DB`);
        return saved;
    }

    private cleanHtml(html: string): string {
        return html
            .replace(/<\/?[^>]+(>|$)/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ')
            .trim();
    }
}
