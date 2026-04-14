import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
    @Get()
    @ApiOperation({ summary: 'Root endpoint' })
    @ApiResponse({ status: 200, description: 'Welcome message' })
    root() {
        return {
            message: 'Welcome to CareerMate API',
            docs: '/api/docs',
        };
    }
}
