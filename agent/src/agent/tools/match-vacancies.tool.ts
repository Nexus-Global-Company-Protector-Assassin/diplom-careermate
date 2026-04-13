import { Injectable, Logger } from '@nestjs/common';
import { LlmGatewayService } from '../llm/llm-gateway.service';
import { CacheService } from '../cache/cache.service';
import { PineconeService } from '../pinecone/pinecone.service';
import {
    VacancyMatchResult,
    VacancyMatchResultSchema,
} from '../schemas/vacancy-match.schema';
import { ProfileAnalysis } from '../schemas/profile-analysis.schema';
import { VACANCIES_DATABASE, RawVacancy } from './vacancies.data';

@Injectable()
export class MatchVacanciesTool {
    private readonly logger = new Logger(MatchVacanciesTool.name);

    constructor(
        private readonly llmGateway: LlmGatewayService,
        private readonly cacheService: CacheService,
        private readonly pineconeService: PineconeService,
    ) { }

    async run(
        analysis: ProfileAnalysis,
        topN: number = 5,
    ): Promise<VacancyMatchResult> {
        this.logger.log(
            `[match_vacancies] Matching for level=${analysis.level}, score=${analysis.score}`,
        );

        const hash = this.cacheService.generateHash({ analysis, topN });
        const cacheKey = `ai:match-vacancies:${hash}`;

        return this.cacheService.getOrSet(cacheKey, async () => {
            // Формируем запрос для векторного поиска
            const queryContext = [
                `Уровень: ${analysis.level}`,
                `Желаемая позиция: ${analysis.desiredRole || ''}`,
                `Ключевые навыки: ${analysis.skills.join(', ')}`,
                `Summary: ${analysis.summary}`
            ].join(' ');

            // Получаем эмбеддинг профиля
            const queryVectorBatch = await this.llmGateway.generateEmbeddings([queryContext]);
            const queryVector = queryVectorBatch[0];

            // Ищем Топ-10 похожих вакансий в Pinecone
            const pineconeMatches = await this.pineconeService.searchVacancies(queryVector, 10);

            // Если Pinecone пустой или вернул 0 (база не seeded), фоллбэк на хардкод (для PoC)
            const retrievedVacancies = pineconeMatches.length > 0
                ? pineconeMatches
                : VACANCIES_DATABASE;

            // Передаём вакансии и анализ профиля в LLM для финального матчинга (из Топ-10 в Топ-N)
            const vacanciesContext = this.buildVacanciesContext(
                retrievedVacancies as any[],
                analysis,
            );

            const result = await this.llmGateway.generateJson(
                [
                    {
                        role: 'user',
                        content: `Ты рекрутер. Подбери топ-${topN} подходящих вакансий для кандидата.

АНАЛИЗ ПРОФИЛЯ:
- Уровень: ${analysis.level}
- Скор: ${analysis.score}/100
- Навыки: ${analysis.skills.join(', ')}
- Желаемая роль: ${analysis.desiredRole ?? 'не указана'}
- Слабые места: ${analysis.skillGaps.join(', ')}
- Сильные стороны: ${analysis.strengths?.join(', ') ?? 'не указаны'}
- Краткое резюме: ${analysis.summary}

СПИСОК ВАКАНСИЙ:
${vacanciesContext}

Верни JSON объект:
{
  "vacancies": [
    {
      "id": "v001",
      "title": "...",
      "company": "...",
      "location": "...",
      "salary": {"min": 150000, "max": 220000, "currency": "RUB"},
      "matchScore": 85,
      "matchReasons": ["Совпадает React", "Опыт 3 года соответствует Middle"],
      "requiredSkills": ["React", "TypeScript"],
      "description": "..."
    }
  ],
  "totalAnalyzed": ${VACANCIES_DATABASE.length}
}

Правила:
- Выбери ровно ${topN} лучших вакансий (или меньше, если нет подходящих)
- matchScore 0-100: насколько профиль подходит под вакансию
- matchReasons — конкретные причины (навыки, опыт, уровень)
- Сортируй по matchScore убыванию
- Не выдумывай данные о вакансиях — используй только из списка выше`,
                    },
                ],
                VacancyMatchResultSchema,
                { temperature: 0.2, timeoutMs: 60000 },
            );

            this.logger.log(
                `[match_vacancies] Found ${result.data.vacancies.length} vacancies`,
            );

            return result.data;
        });
    }

    private buildVacanciesContext(
        vacancies: RawVacancy[],
        analysis: ProfileAnalysis,
    ): string {
        // Предфильтрация: убираем явно несовместимые уровни
        const filtered = vacancies.filter((v) => {
            if (!v.level || v.level === 'Any') return true;
            if (analysis.level === 'Junior') return v.level === 'Junior';
            if (analysis.level === 'Senior')
                return v.level === 'Senior' || v.level === 'Middle';
            return true; // Middle видит всех
        });

        return filtered
            .map(
                (v) =>
                    `[${v.id}] ${v.title} @ ${v.company} (${v.location ?? 'Remote'})
  Уровень: ${v.level ?? 'Any'} | ЗП: ${v.salary?.min ?? '?'}-${v.salary?.max ?? '?'} ${v.salary?.currency ?? 'RUB'}
  Навыки: ${v.requiredSkills.join(', ')}
  Описание: ${v.description}`,
            )
            .join('\n\n');
    }
}
