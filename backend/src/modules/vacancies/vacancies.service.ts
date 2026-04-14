import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../database/prisma.service';
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

@Injectable()
export class VacanciesService {
    private readonly logger = new Logger(VacanciesService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService,
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
     * HH API: GET https://api.hh.ru/vacancies?text=...&per_page=20&area=113
     * Полная документация: https://github.com/hhru/api/blob/master/docs/vacancies.md
     */
    async searchAndSave(query: string, count = 10) {
        this.logger.log(`[HH.ru API] Searching: "${query}", count: ${count}`);

        const headers = {
            'User-Agent': 'CareerMate/1.0 (hello@careermate.ai)',
            'HH-User-Agent': 'CareerMate/1.0 (hello@careermate.ai)',
        };

        // Step 1: Search vacancies list
        // API: GET /vacancies?text=...&per_page=...&area=113 (113 = Russia)
        // See: https://api.hh.ru/openapi/redoc#tag/Poisk-vakansij/operation/get-vacancies
        let items: any[] = [];
        try {
            const searchRes = await firstValueFrom(
                this.httpService.get(`${HH_API}/vacancies`, {
                    headers,
                    params: {
                        text: query,
                        per_page: Math.min(count, 20),
                        area: 113,          // Russia
                        search_field: 'name', // search in vacancy name
                        order_by: 'relevance',
                    },
                    timeout: 15000,
                })
            );
            items = searchRes.data?.items || [];
            this.logger.log(`[HH.ru API] Found ${items.length} vacancies in search results`);
        } catch (err: any) {
            this.logger.error(`[HH.ru API] Search failed: ${err.message}`);
            throw new Error(`HH API недоступен: ${err.message}`);
        }

        const saved: any[] = [];

        for (const item of items) {
            try {
                // Step 2: Get full vacancy details for key_skills and description
                // API: GET /vacancies/{id}
                // See: https://api.hh.ru/openapi/redoc#tag/Vakansii/operation/get-vacancy
                const detRes = await firstValueFrom(
                    this.httpService.get(`${HH_API}/vacancies/${item.id}`, {
                        headers,
                        timeout: 10000,
                    })
                );
                const d = detRes.data;

                // Parse salary with currency conversion
                // HH salary object: { from: number|null, to: number|null, currency: "RUR"|"USD"|..., gross: boolean }
                // "gross" = true means salary is stated "before taxes" (до вычета)
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

                // key_skills is array of { name: string }
                const skills: string[] = (d.key_skills || []).map((k: any) => k.name);

                // description is HTML, clean it
                const descriptionPreview = this.cleanHtml(d.description || '').slice(0, 200) + '...';

                // experience: { id: "between1And3", name: "От 1 года до 3 лет" }
                const experience = d.experience?.name ?? null;

                // schedule: { id: "remote", name: "Удалённая работа" }
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
