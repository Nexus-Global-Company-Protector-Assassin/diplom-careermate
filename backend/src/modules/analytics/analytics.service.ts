import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
    getWeeklyReport() {
        return [
            { icon: "📋", value: "5", label: "Новые вакансии" },
            { icon: "🗓️", value: "2", label: "Интервью назначено" },
            { icon: "📧", value: "8", label: "Откликов отправлено" },
            { icon: "🤖", value: "1", label: "Рекомендации ИИ" },
        ];
    }
}
