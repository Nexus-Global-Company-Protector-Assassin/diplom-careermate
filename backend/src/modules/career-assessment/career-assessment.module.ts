import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { QuotaModule } from '../quota/quota.module';
import { CareerAssessmentController } from './career-assessment.controller';
import { CareerAssessmentService } from './career-assessment.service';

@Module({
    imports: [AiModule, QuotaModule],
    controllers: [CareerAssessmentController],
    providers: [CareerAssessmentService],
})
export class CareerAssessmentModule {}
