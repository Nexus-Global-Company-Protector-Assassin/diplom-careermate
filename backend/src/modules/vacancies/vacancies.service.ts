import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

// From HH API docs: currency codes used in salary field
const EXCHANGE_RATES: Record<string, number> = {
    USD: 93.5,
    EUR: 100.2,
    KZT: 0.21,
    BYR: 28.5,
    UZS: 0.0073,
};

// HH API base URL (public, no auth needed for search)
const HH_API = 'https://api.hh.ru';

// Realistic mock vacancies for when HH API is blocked (DDoS Guard / no token)
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

@Injectable()
export class VacanciesService {
    private readonly logger = new Logger(VacanciesService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {}

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
     * Парсит вакансии с HH.ru по HH API и сохраняет в БД.
     * Если HH API недоступен (403 от DDoS Guard или нет токена),
     * использует mock-данные для демонстрации функционала.
     *
     * Для полного доступа без ограничений — зарегистрируйте приложение
     * на https://dev.hh.ru и добавьте HH_ACCESS_TOKEN в .env
     */
    async searchAndSave(query: string, count = 10) {
        this.logger.log(`[HH.ru API] Searching: "${query}", count: ${count}`);

        const hhToken = this.configService.get<string>('HH_ACCESS_TOKEN');
        const headers: Record<string, string> = {
            'User-Agent': 'CareerMate/1.0 (hello@careermate.ai)',
            'Accept': 'application/json',
            'Accept-Language': 'ru-RU,ru;q=0.9',
        };

        if (hhToken) {
            headers['Authorization'] = `Bearer ${hhToken}`;
            this.logger.log(`[HH.ru API] Using access token`);
        }

        // Step 1: Try to search via HH API
        let items: any[] = [];
        let useMock = false;

        try {
            const searchRes = await firstValueFrom(
                this.httpService.get(`${HH_API}/vacancies`, {
                    headers,
                    params: {
                        text: query,
                        per_page: Math.min(count, 20),
                        area: 113,           // Russia
                        search_field: 'name', // search in vacancy name
                        order_by: 'relevance',
                    },
                    timeout: 15000,
                })
            );
            items = searchRes.data?.items || [];
            this.logger.log(`[HH.ru API] Found ${items.length} vacancies`);
        } catch (err: any) {
            const status = err.response?.status;
            if (status === 403) {
                this.logger.warn(`[HH.ru API] 403 Forbidden — DDoS Guard is blocking server IP. Using mock data. To fix: add HH_ACCESS_TOKEN to .env (see https://dev.hh.ru)`);
                useMock = true;
            } else {
                this.logger.error(`[HH.ru API] Search failed: ${err.message}`);
                throw new Error(`HH API недоступен: ${err.message}`);
            }
        }

        // Use mock data if HH API is blocked
        if (useMock) {
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

        // Step 2: Process real HH data
        const saved: any[] = [];

        for (const item of items) {
            try {
                const detRes = await firstValueFrom(
                    this.httpService.get(`${HH_API}/vacancies/${item.id}`, {
                        headers,
                        timeout: 10000,
                    })
                );
                const d = detRes.data;

                let salaryFrom: number | null = null;
                let salaryTo: number | null = null;
                let salaryLabel = 'Зарплата не указана';

                if (d.salary) {
                    const rate = EXCHANGE_RATES[d.salary.currency] ?? 1;
                    salaryFrom = d.salary.from ? Math.round(d.salary.from * rate) : null;
                    salaryTo = d.salary.to ? Math.round(d.salary.to * rate) : null;

                    if (salaryFrom && salaryTo) {
                        salaryLabel = `от ${salaryFrom.toLocaleString('ru')} до ${salaryTo.toLocaleString('ru')} ₽`;
                    } else if (salaryFrom) {
                        salaryLabel = `от ${salaryFrom.toLocaleString('ru')} ₽`;
                    } else if (salaryTo) {
                        salaryLabel = `до ${salaryTo.toLocaleString('ru')} ₽`;
                    }

                    if (d.salary.gross) {
                        salaryLabel += ' до вычета';
                    }
                }

                const skills: string[] = (d.key_skills || []).map((k: any) => k.name);
                const descriptionPreview = this.cleanHtml(d.description || '').slice(0, 200) + '...';
                const experience = d.experience?.name ?? null;
                const schedule = d.schedule?.name ?? null;

                const upserted = await this.prisma.vacancy.upsert({
                    where: { hhId: String(item.id) },
                    create: {
                        hhId: String(item.id),
                        title: d.name,
                        employer: item.employer?.name ?? 'Неизвестно',
                        location: item.area?.name ?? null,
                        salaryLabel,
                        salaryFrom,
                        salaryTo,
                        salaryCurrency: d.salary?.currency ?? 'RUR',
                        skills,
                        descriptionPreview,
                        experience,
                        schedule,
                        searchQuery: query,
                    },
                    update: {
                        title: d.name,
                        salaryLabel,
                        skills,
                        experience,
                        schedule,
                        searchQuery: query,
                        updatedAt: new Date(),
                    },
                });

                saved.push(upserted);
            } catch (detailErr: any) {
                this.logger.warn(`[HH.ru API] Failed to get details for vacancy ${item.id}: ${detailErr.message}`);
            }
        }

        this.logger.log(`[HH.ru API] Saved ${saved.length} vacancies to DB`);
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
