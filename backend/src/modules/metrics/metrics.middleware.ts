import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
    constructor(private readonly metrics: MetricsService) {}

    use(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();

        res.on('finish', () => {
            const duration = (Date.now() - start) / 1000;
            const route = req.route?.path ?? req.path ?? 'unknown';
            const labels = {
                method: req.method,
                route,
                status: String(res.statusCode),
            };

            this.metrics.httpRequestsTotal.inc(labels);
            this.metrics.httpRequestDuration.observe(labels, duration);
        });

        next();
    }
}
