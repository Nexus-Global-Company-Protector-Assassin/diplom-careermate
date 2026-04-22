import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
    constructor(private readonly metricsService: MetricsService) {}

    @Get()
    @ApiOperation({ summary: 'Prometheus metrics endpoint' })
    @ApiExcludeEndpoint()
    async getMetrics(@Res() res: Response) {
        const metrics = await this.metricsService.getMetrics();
        res.setHeader('Content-Type', this.metricsService.contentType());
        res.send(metrics);
    }
}
