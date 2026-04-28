import { Injectable, Logger } from '@nestjs/common';
import { LlmGatewayService } from '../llm/llm-gateway.service';
import { CacheService } from '../cache/cache.service';
import { ResumeReviewSchema, ResumeReview } from '../schemas/resume-review.schema';

export interface ReviewContext {
    desiredPosition?: string;
    skills?: string[];
    aboutMe?: string;
}

@Injectable()
export class ReviewResumeTool {
    private readonly logger = new Logger(ReviewResumeTool.name);

    constructor(
        private readonly llmGateway: LlmGatewayService,
        private readonly cacheService: CacheService,
    ) {}

    async run(rawResumeText: string, context?: ReviewContext): Promise<ResumeReview> {
        this.logger.log(
            `[review_resume] Starting deep analysis (text length: ${rawResumeText.length}, target: ${context?.desiredPosition ?? 'не указана'})`,
        );

        const hash = this.cacheService.generateHash({ rawResumeText, context });
        const cacheKey = `ai:review-resume:${hash}`;

        return this.cacheService.getOrSet(cacheKey, async () => {
            const profileContext = this.buildContext(context);

            const result = await this.llmGateway.generateJson<ResumeReview>(
                [
                    {
                        role: 'system',
                        content: `Ты опытный HR-консультант и карьерный коуч с 15+ годами опыта в подборе IT-специалистов.
Твоя задача — провести ГЛУБОКИЙ и ЧЕСТНЫЙ анализ резюме по стандартам Stanford Career Education, а затем создать УЛУЧШЕННУЮ ATS-совместимую версию.

═══ ГЛАВНЫЙ ПРИНЦИП ═══
Улучшенное резюме должно быть ЛУЧШЕ оригинала, а НЕ короче и проще.
Твоя работа — ДОБАВЛЯТЬ ценность: улучшать структуру, формулировки, визуальную иерархию.
ЗАПРЕЩЕНО: удалять детали, упрощать описания, «сжимать» технические подробности.

═══ СТАНДАРТ ДОСТИЖЕНИЙ (Stanford CAR Method) ═══
Каждый пункт опыта работы должен следовать формуле:
  CAR = Challenge/Context → Action → Result
  Пример ПЛОХО: "Работал с базами данных"
  Пример ХОРОШО: "Оптимизировал SQL-запросы (Window functions, CTE), сократив время загрузки дашборда с 8 с до 0.9 с для 50 000 активных пользователей"
Каждое достижение должно начинаться с Action Verb (Разработал, Оптимизировал, Внедрил, Сократил, Увеличил, Построил, Автоматизировал).
Цифры и метрики — обязательны там, где они есть в оригинале; если их нет — укажи это как слабость.

═══ ATS-СОВМЕСТИМОСТЬ ═══
- Стандартные заголовки секций: ОПЫТ РАБОТЫ, ОБРАЗОВАНИЕ, НАВЫКИ, SUMMARY/О СЕБЕ
- Нет таблиц, колонок, графики, нестандартных символов
- Ключевые слова из желаемой позиции (если указана) должны присутствовать в тексте
- Даты в формате MM/YYYY или «месяц YYYY»

═══ РЕКОМЕНДОВАННАЯ СТРУКТУРА (Stanford) ═══
1. ФИО + контакты (email, телефон, LinkedIn, GitHub)
2. SUMMARY / Профессиональное резюме (3-4 предложения, заточенные под целевую роль)
3. ОПЫТ РАБОТЫ (обратная хронология, CAR-bullets)
4. НАВЫКИ (технические отдельно от профессиональных)
5. ОБРАЗОВАНИЕ
6. Дополнительно (языки, сертификаты, проекты)

═══ ПРАВИЛА УЛУЧШЕНИЯ ═══
1. СОХРАНЯЙ ВСЕ технические детали, метрики, цифры и конкретику из оригинала.
2. СОХРАНЯЙ вложенную структуру и подзаголовки.
3. СОХРАНЯЙ блок "Обо мне" / "Summary" с его УТП кандидата.
4. Улучшенная версия должна быть НЕ КОРОЧЕ оригинала.
5. ДОБАВЛЯЙ: лучшую структуру, исправление грамматики, усиление через action verbs, CAR-format.
6. НИКОГДА не выдумывай навыки, опыт, достижения или метрики.

═══ ПРАВИЛА ОЦЕНКИ ═══
1. Будь ОБЪЕКТИВНЫМ. Оценка 9-10 допустима для отличных резюме.
2. Если резюме не требует серьёзных изменений — поставь noChangesNeeded=true.
3. Проверяй: наличие метрик в достижениях, ATS-совместимость, action verbs, релевантность summary.

Пиши на русском языке.`,
                    },
                    {
                        role: 'user',
                        content: `Проанализируй следующее резюме по стандартам Stanford Career Education и создай его УЛУЧШЕННУЮ версию.

ЧЕКЛИСТ АНАЛИЗА:
✓ Структура соответствует Stanford-стандарту (ФИО → Summary → Опыт → Навыки → Образование)
✓ Достижения написаны по методу CAR (Context → Action → Result с метриками)
✓ Каждый пункт начинается с Action Verb
✓ ATS-совместимость (нет колонок/таблиц, стандартные заголовки, ключевые слова)
✓ Summary tailored под целевую роль (если указана)
✓ Нет личных местоимений (я, мы, меня)
✓ Нет "обязанности включали" — только достижения

ВАЖНО: улучшенная версия должна содержать ВСЕ технические детали, метрики
и конкретику из оригинала. Не упрощай и не сокращай. Только улучшай структуру,
формулировки (CAR-метод) и визуальную иерархию.

=== ТЕКСТ РЕЗЮМЕ ===
${rawResumeText}
=== КОНЕЦ РЕЗЮМЕ ===

${profileContext}

Верни структурированный JSON с результатами глубокого анализа.`,
                    },
                ],
                ResumeReviewSchema,
                { temperature: 0.3, timeoutMs: 120000, maxTokens: 8192 },
            );

            this.logger.log(
                `[review_resume] Done. Score: ${result.data.overallScore}/10, verdict: ${result.data.overallVerdict}, changes needed: ${!result.data.noChangesNeeded}`,
            );

            return result.data;
        });
    }

    private buildContext(ctx?: ReviewContext): string {
        if (!ctx) return '';

        const lines: string[] = ['КОНТЕКСТ ПРОФИЛЯ КАНДИДАТА:'];

        if (ctx.desiredPosition) {
            lines.push(`Желаемая позиция: ${ctx.desiredPosition}`);
        }
        if (ctx.skills?.length) {
            lines.push(`Навыки из профиля: ${ctx.skills.join(', ')}`);
        }
        if (ctx.aboutMe) {
            lines.push(`О себе: ${ctx.aboutMe}`);
        }

        if (lines.length === 1) return '';

        lines.push('');
        lines.push('Сравни резюме с информацией из профиля и желаемой позицией. Если позиция не указана — анализируй резюме в целом.');

        return lines.join('\n');
    }
}
