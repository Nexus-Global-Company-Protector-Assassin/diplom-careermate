import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { CareerAssessmentController } from './career-assessment.controller';
import { CareerAssessmentService } from './career-assessment.service';

@Module({
    imports: [AiModule],
    controllers: [CareerAssessmentController],
    providers: [CareerAssessmentService],
})
export class CareerAssessmentModule {}
