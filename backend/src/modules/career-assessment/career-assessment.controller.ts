import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CareerAssessmentService } from './career-assessment.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';

@ApiTags('Career Assessment')
@Controller('career-assessment')
@UseGuards(JwtAuthGuard)
export class CareerAssessmentController {
    constructor(private readonly careerAssessmentService: CareerAssessmentService) {}

    @Post()
    @UseGuards(ThrottlerGuard)
    @ApiOperation({ summary: 'Submit career assessment quiz and get AI-powered career path recommendations' })
    @ApiBody({ type: SubmitAssessmentDto })
    async submitAssessment(
        @CurrentUser() user: { userId: string },
        @Body() dto: SubmitAssessmentDto,
    ) {
        return this.careerAssessmentService.submitAssessment(user.userId, dto);
    }

    @Get('latest')
    @ApiOperation({ summary: 'Get the latest career assessment result for current user' })
    async getLatestAssessment(@CurrentUser() user: { userId: string }) {
        return this.careerAssessmentService.getLatestAssessment(user.userId);
    }
}
