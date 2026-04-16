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
                        role: 'user',
                        content: `Ты профессиональный карьерный консультант. Адаптируй резюме кандидата под конкретную вакансию.

ПРОФИЛЬ КАНДИДАТА:
${profileContext}

ЦЕЛЕВАЯ ВАКАНСИЯ:
${vacancyContext}

Верни JSON объект с адаптированным резюме:
{
  "targetPosition": "название желаемой позиции",
  "fullName": "имя кандидата",
  "summary": "профессиональное summary (3-4 предложения), заточенное под вакансию",
  "skills": ["навык1", "навык2", ...] — только релевантные для данной вакансии,
  "experience": [
    {
      "company": "...",
      "position": "...",
      "period": "...",
      "achievements": ["достижение, релевантное для вакансии", ...]
    }
  ],
  "education": [...],
  "languages": [...],
  "contacts": {
    "email": "...",
    "phone": "...",
    "linkedin": "...",
    "github": "..."
  },
  "recommendations": ["Рекомендация что юзеру нужно самому улучшить (например конкретные цифры для опыта)"],
  "autoFixed": ["Какие изменения ты применил автоматически к тексту (например сделал summary более релевантным)"]
}

КРИТИЧЕСКИ ВАЖНО:
- Используй ТОЛЬКО факты из профиля кандидата, не выдумывай ничего
- Summary должно подчёркивать то, что важно для данной вакансии
- В achievements — реальные достижения кандидата, но сформулируй их в контексте вакансии
- Навыки — берёшь из профиля, выбираешь наиболее релевантные для вакансии
- Не добавляй навыки/опыт которых нет у кандидата`,
                    },
                ],
                GeneratedResumeSchema,
                {
                    temperature: 0.2,
                    model: undefined, // использует fast model для экономии
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
