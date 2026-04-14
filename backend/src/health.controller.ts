import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    @Get()
    @ApiOperation({ summary: 'Check API health' })
    @ApiResponse({ status: 200, description: 'API is running' })
    check() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
}
