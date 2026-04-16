import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('AI')
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) {}

    @Post('chat')
    @ApiOperation({ summary: 'Send message to AI assistant' })
    async chat(@Body() body: { message: string }) {
        const responseText = await this.aiService.generateResponse(body.message);
        return { response: responseText };
    }
}
