import { Injectable, Logger } from '@nestjs/common';
import { LlmGatewayService } from '../llm/llm-gateway.service';
import { CacheService } from '../cache/cache.service';
import {
    GeneratedResume,
    GeneratedResumeSchema,
} from '../schemas/resume.schema';
import { ProfileData } from './analyze-profile.tool';
import { Vacancy } from '../schemas/vacancy-match.schema';

@Injectable()
export class GenerateResumeTool {
    private readonly logger = new Logger(GenerateResumeTool.name);

    constructor(
        private readonly llmGateway: LlmGatewayService,
        private readonly cacheService: CacheService,
    ) { }

    async run(
        profileData: ProfileData,
        targetVacancy: Vacancy,
    ): Promise<GeneratedResume> {
        this.logger.log(
            `[generate_resume] Generating for vacancy: ${targetVacancy.title} @ ${targetVacancy.company}`,
        );

        const hash = this.cacheService.generateHash({ profileData, targetVacancyId: targetVacancy.id });
        const cacheKey = `ai:generate-resume:${hash}`;

        return this.cacheService.getOrSet(cacheKey, async () => {
            const profileContext = this.buildProfileContext(profileData);
            const vacancyContext = this.buildVacancyContext(targetVacancy);

            const result = await this.llmGateway.generateJson(
                [
                    {
                        role: 'system',
                        content: `Ты профессиональный карьерный консультант, обученный по стандартам Stanford Career Education.
Твоя задача — адаптировать резюме кандидата под конкретную вакансию, следуя лучшим практикам найма.

═══ СТАНДАРТ ДОСТИЖЕНИЙ (Stanford CAR Method) ═══
Каждый пункт в achievements должен следовать формуле CAR:
  Challenge/Context → Action → Result
  ПЛОХО: "Занимался разработкой микросервисов"
  ХОРОШО: "Спроектировал и реализовал 4 микросервиса на NestJS, сократив время развёртывания на 60% за счёт контейнеризации через Docker"
Начинай каждый пункт с Action Verb: Разработал, Оптимизировал, Внедрил, Автоматизировал, Увеличил, Сократил, Построил, Спроектировал, Масштабировал, Руководил.
Включай метрики везде, где они логичны (%, мс, $, пользователи, команда N человек).

═══ ПРАВИЛА SUMMARY ═══
Summary = 3-4 предложения, где:
1. Кто ты: роль + лет опыта
2. Ключевые технологии, релевантные для ДАННОЙ вакансии
3. Главное достижение / УТП кандидата
4. Что ищешь / как можешь помочь компании
Пример: "Senior Data Engineer с 5+ годами опыта проектирования ETL-пайплайнов на Spark и Airflow. Построил data warehouse на 10 TB в Yandex Cloud, обеспечивающий аналитику для 3M+ пользователей. Сократил время доставки данных с 6 ч до 45 мин за счёт стриминговой архитектуры (Kafka). Ищу роль, где могу масштабировать data-платформу от десятков до сотен петабайт."

═══ ATS-ОПТИМИЗАЦИЯ ═══
- Включи в summary и achievements ключевые слова из описания вакансии
- Используй точные названия технологий из требований вакансии (если они есть у кандидата)
- Навыки: технические (hard skills) — отдельно, профессиональные (soft) — отдельно

КРИТИЧЕСКИ ВАЖНО:
- Используй ТОЛЬКО факты из профиля кандидата, не выдумывай ничего
- Не добавляй навыки/опыт которых нет у кандидата`,
                    },
                    {
                        role: 'user',
                        content: `Адаптируй резюме кандидата под конкретную вакансию, применяя Stanford CAR-метод для достижений.

ПРОФИЛЬ КАНДИДАТА:
${profileContext}

ЦЕЛЕВАЯ ВАКАНСИЯ:
${vacancyContext}

ЗАДАЧА:
1. Перепиши каждое достижение по формуле CAR (Context → Action → Result с метриками)
2. Напиши tailored Summary под эту конкретную вакансию (3-4 предложения)
3. Выбери только релевантные для этой вакансии навыки
4. Включи ключевые слова из описания вакансии в summary и achievements (ATS-оптимизация)

Верни JSON объект с адаптированным резюме.`,
                    },
                ],
                GeneratedResumeSchema,
                {
                    temperature: 0.2,
                    model: undefined,
                },
            );

            this.logger.log(
                `[generate_resume] Done for: ${result.data.fullName} → ${result.data.targetPosition}`,
            );

            return result.data;
        });
    }

    private buildProfileContext(profile: ProfileData): string {
        const lines: string[] = [];

        if (profile.fullName) lines.push(`Имя: ${profile.fullName}`);
        if (profile.desiredPosition)
            lines.push(`Желаемая позиция: ${profile.desiredPosition}`);
        if (profile.experienceYears !== undefined)
            lines.push(`Лет опыта: ${profile.experienceYears}`);
        if (profile.skills?.length)
            lines.push(`Навыки: ${profile.skills.join(', ')}`);

        if (profile.workExperience?.length) {
            lines.push('\nОпыт работы:');
            for (const exp of profile.workExperience) {
                lines.push(`  - ${exp.position} в ${exp.company}`);
                if (exp.duration) lines.push(`    Длительность: ${exp.duration}`);
                if (exp.description) lines.push(`    ${exp.description}`);
            }
        }

        if (profile.education?.length) {
            lines.push('\nОбразование:');
            for (const edu of profile.education) {
                lines.push(`  - ${edu.degree}, ${edu.institution}`);
            }
        }

        if (profile.aboutMe) lines.push(`\nО себе: ${profile.aboutMe}`);

        return lines.join('\n');
    }

    private buildVacancyContext(vacancy: Vacancy): string {
        return [
            `Позиция: ${vacancy.title}`,
            `Компания: ${vacancy.company}`,
            `Локация: ${vacancy.location ?? 'Remote'}`,
            `Требуемые навыки: ${vacancy.requiredSkills.join(', ')}`,
            `Описание: ${vacancy.description ?? ''}`,
        ].join('\n');
    }
}
