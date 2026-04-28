import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AiService } from '../ai/ai.service';
import { QuotaService } from '../quota/quota.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';

const CAREER_CACHE_TTL = 7 * 24 * 60 * 60; // 7 days

@Injectable()
export class CareerAssessmentService {
    private readonly logger = new Logger(CareerAssessmentService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly aiService: AiService,
        private readonly quota: QuotaService,
    ) {}

    async submitAssessment(userId: string, dto: SubmitAssessmentDto): Promise<any> {
        await this.quota.assertQuizLimit(userId);
        await this.quota.assertAiCall(userId);

        const profile = await this.prisma.profile.findFirst({ where: { userId } });
        if (!profile) {
            throw new NotFoundException('Профиль не найден. Создайте профиль перед прохождением теста.');
        }

        const cacheKey = `career-assessment:${profile.id}:${this.hash(dto.dimensionScores)}`;

        // Check if AI result is cached (avoid repeated expensive calls for same dimension scores)
        let result: any;
        try {
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                this.logger.log(`[Cache HIT] ${cacheKey}`);
                result = JSON.parse(cached);
            }
        } catch { /* Redis unavailable */ }

        if (!result) {
            const prompt = this.buildPrompt(profile, dto);
            result = await this.aiService.generateCareerPathAnalysis(prompt);

            try {
                await this.redis.set(cacheKey, JSON.stringify(result), CAREER_CACHE_TTL);
                this.logger.log(`[Cache SET] ${cacheKey}`);
            } catch { /* non-critical */ }
        }

        // Always store a new assessment record
        await this.prisma.careerAssessment.create({
            data: {
                profileId: profile.id,
                domain: dto.domain,
                answers: dto.answers as any,
                dimensionScores: dto.dimensionScores as any,
                result: result as any,
            },
        });

        void this.quota.commitAiCall(userId);
        return result;
    }

    async getLatestAssessment(userId: string): Promise<any | null> {
        const profile = await this.prisma.profile.findFirst({ where: { userId } });
        if (!profile) return null;

        return this.prisma.careerAssessment.findFirst({
            where: { profileId: profile.id },
            orderBy: { createdAt: 'desc' },
        });
    }

    private buildPrompt(profile: any, dto: SubmitAssessmentDto): string {
        const { dimensionScores, topPathRoles, domain } = dto;
        const skills = profile.skills
            ? Array.isArray(profile.skills)
                ? (profile.skills as string[]).join(', ')
                : JSON.stringify((profile.skills as any)?.technical ?? profile.skills)
            : 'не указаны';

        return `Ты — эксперт по карьерному развитию. Проанализируй личностный профиль кандидата и создай детальные рекомендации по карьерным путям.

ПРОФИЛЬ КАНДИДАТА:
- Имя: ${profile.fullName || 'Не указано'}
- Текущая/желаемая позиция: ${profile.desiredPosition || 'Не указана'}
- Опыт: ${profile.experienceYears || 0} лет
- Навыки: ${skills}
- О себе: ${profile.aboutMe || ''}
- Карьерные цели: ${profile.careerGoals || ''}
- Предпочтение формата работы: ${profile.workFormatPreference || 'Не указано'}

РЕЗУЛЬТАТЫ ОЦЕНКИ ЛИЧНОСТИ (шкала 0-5):
Выбранный домен: ${domain}
- Аналитическое мышление: ${dimensionScores.analytical}
- Техническая направленность: ${dimensionScores.technical}
- Социальная ориентация (работа с людьми): ${dimensionScores.social}
- Творческое мышление: ${dimensionScores.creative}
- Лидерские качества: ${dimensionScores.leadership}
- Структурированность и системность: ${dimensionScores.structured}

ТОП-5 ПОДХОДЯЩИХ РОЛЕЙ (по алгоритму совпадения личностного профиля):
${topPathRoles.map((r, i) => `${i + 1}. ${r}`).join('\n')}

ЗАДАЧА: На основе личностного профиля, навыков кандидата и результатов оценки создай персонализированные рекомендации для топ-3 карьерных путей из списка выше.

Для каждого пути укажи:
1. Почему именно эта роль подходит данному кандидату (matchReason) — конкретно, со ссылкой на его профиль
2. Детальный роадмап роста: Junior → Middle → Senior → Lead/Staff с временными рамками и ключевыми навыками
3. Навыки из его текущего профиля, которые уже подходят для этой роли (currentSkillsMatch)
4. Приоритетные навыки для изучения (skillsToLearn)
5. Реалистичный зарплатный диапазон для России в рублях
6. 2 главных преимущества (pros) и 1-2 сложности (cons) этого пути

Верни ТОЛЬКО валидный JSON без markdown:
{
  "personalitySummary": "2-3 предложения о личностном профиле кандидата",
  "dominantTraits": ["Черта1", "Черта2", "Черта3"],
  "topPaths": [
    {
      "rank": 1,
      "role": "название роли",
      "domain": "домен",
      "matchScore": 85,
      "matchReason": "персонализированное объяснение",
      "roadmap": [
        { "level": "Junior", "timeframe": "0-1 год", "skills": ["навык1", "навык2"], "description": "..." },
        { "level": "Middle", "timeframe": "1-3 года", "skills": ["навык1", "навык2"], "description": "..." },
        { "level": "Senior", "timeframe": "3-6 лет", "skills": ["навык1", "навык2"], "description": "..." },
        { "level": "Lead/Staff", "timeframe": "6+ лет", "skills": ["навык1", "навык2"], "description": "..." }
      ],
      "currentSkillsMatch": ["существующий навык из профиля"],
      "skillsToLearn": ["навык для изучения"],
      "salaryRange": "XXX — YYY ₽",
      "pros": ["плюс1", "плюс2"],
      "cons": ["сложность1"]
    }
  ]
}`;
    }

    private hash(data: unknown): string {
        return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    }
}
