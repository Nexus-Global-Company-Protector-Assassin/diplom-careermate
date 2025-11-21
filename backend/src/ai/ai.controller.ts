import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('analyze-profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyze user profile with AI' })
  async analyzeProfile(@Body() profileData: any) {
    return this.aiService.analyzeProfile(profileData.id);
  }
}