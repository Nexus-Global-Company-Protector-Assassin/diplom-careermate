import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AiService } from './ai.service';

@ApiTags('AI')
@Controller('ai')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
export class AiController {
    constructor(private readonly aiService: AiService) {}

    @Post('chat')
    @ApiOperation({ summary: 'Send message to AI assistant' })
    async chat(
        @CurrentUser() user: { userId: string },
        @Body() body: { message: string },
    ) {
        const responseText = await this.aiService.generateResponse(body.message, user.userId);
        return { response: responseText };
    }
}
