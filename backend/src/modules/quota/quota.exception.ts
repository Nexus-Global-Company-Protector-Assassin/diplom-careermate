import { HttpException, HttpStatus } from '@nestjs/common';

const MESSAGES: Record<string, (limit: number) => string> = {
    ai_daily: (l) => `Достигнут дневной лимит AI-запросов (${l}/день). Попробуйте завтра.`,
    resumes:  (l) => `Достигнут лимит резюме (${l} шт). Удалите старое и попробуйте снова.`,
    quiz:     (l) => `Достигнут лимит карьерных тестов (${l} попытки).`,
};

export class QuotaExceededException extends HttpException {
    constructor(
        public readonly quotaType: string,
        public readonly used: number,
        public readonly limit: number,
    ) {
        const message = MESSAGES[quotaType]?.(limit) ?? `Лимит достигнут (${used}/${limit})`;
        super(
            {
                statusCode: HttpStatus.TOO_MANY_REQUESTS,
                error: 'quota_exceeded',
                type: quotaType,
                message,
                used,
                limit,
            },
            HttpStatus.TOO_MANY_REQUESTS,
        );
    }
}
