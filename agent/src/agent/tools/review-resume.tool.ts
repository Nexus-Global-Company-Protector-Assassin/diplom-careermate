import { Injectable, Logger } from '@nestjs/common';
import { LlmGatewayService } from '../llm/llm-gateway.service';
import { ResumeReviewSchema, ResumeReview } from '../schemas/resume-review.schema';

export interface ReviewContext {
    desiredPosition?: string;
    skills?: string[];
    aboutMe?: string;
}

@Injectable()
export class ReviewResumeTool {
    private readonly logger = new Logger(ReviewResumeTool.name);

    constructor(private readonly llmGateway: LlmGatewayService) {}

    async run(rawResumeText: string, context?: ReviewContext): Promise<ResumeReview> {
        this.logger.log(
            `[review_resume] Starting deep analysis (text length: ${rawResumeText.length}, target: ${context?.desiredPosition ?? 'не указана'})`,
        );

        const profileContext = this.buildContext(context);

        const result = await this.llmGateway.generateJson<ResumeReview>(
            [
                {
                    role: 'system',
                    content: `Ты опытный HR-консультант и карьерный коуч с 15+ годами опыта в подборе IT-специалистов.
Твоя задача — провести ГЛУБОКИЙ и ЧЕСТНЫЙ анализ резюме, а затем создать УЛУЧШЕННУЮ версию.

═══ ГЛАВНЫЙ ПРИНЦИП ═══
Улучшенное резюме должно быть ЛУЧШЕ оригинала, а НЕ короче и проще.
Твоя работа — ДОБАВЛЯТЬ ценность: улучшать структуру, формулировки, визуальную иерархию.
ЗАПРЕЩЕНО: удалять детали, упрощать описания, «сжимать» технические подробности.

═══ ПРАВИЛА УЛУЧШЕНИЯ РЕЗЮМЕ ═══
1. СОХРАНЯЙ ВСЕ технические детали, метрики, цифры и конкретику из оригинала.
   Если в оригинале написано "Window functions, CTE, Redis, Semantic Caching" — ЭТО ДОЛЖНО ОСТАТЬСЯ.
   Если написано "обработка сообщений < 50ms" — ЭТА МЕТРИКА ДОЛЖНА ОСТАТЬСЯ.
2. СОХРАНЯЙ вложенную структуру. Если есть подзаголовки (Системный дизайн, ML-разработка, Инфраструктура) — ОСТАВЛЯЙ ИХ.
3. СОХРАНЯЙ блок "Обо мне" / "Summary" с его содержанием и УТП кандидата.
4. Улучшенная версия должна быть НЕ КОРОЧЕ оригинала. Допускается быть длиннее.
5. ДОБАВЛЯЙ только: лучшую структуру разделов, исправление грамматики, усиление формулировок (action verbs), ATS-совместимость.
6. НИКОГДА не выдумывай навыки, опыт, достижения или метрики, которых НЕТ в оригинале.

═══ ПРАВИЛА ОЦЕНКИ ═══
1. Будь ОБЪЕКТИВНЫМ. Если резюме хорошее — поставь высокую оценку. Оценка 9-10 ДОПУСТИМА.
2. Если резюме не требует серьёзных изменений — поставь noChangesNeeded=true и сделай improvedResume максимально близким к оригиналу.
3. Пустой список weaknesses допустим для отличных резюме.

═══ СТРУКТУРА АНАЛИЗА ═══
- Оцени качество: структура, полнота, формулировки, визуальная чистота, ATS-совместимость
- Найди сильные стороны (минимум 2)
- Найди слабые стороны с конкретными рекомендациями
- Если указана желаемая позиция — сравни и найди пробелы
- Сгенерируй улучшенную версию в Markdown, СОХРАНИВ все детали оригинала

Пиши на русском языке.`,
                },
                {
                    role: 'user',
                    content: `Проанализируй следующее резюме и создай его УЛУЧШЕННУЮ версию.

ВАЖНО: улучшенная версия должна содержать ВСЕ технические детали, метрики
и конкретику из оригинала. Не упрощай и не сокращай. Только улучшай структуру,
формулировки и визуальную иерархию.

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
