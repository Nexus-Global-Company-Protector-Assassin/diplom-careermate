import { Module } from '@nestjs/common';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { QuestionGenModule } from './question-gen/question-gen.module';

@Module({
    imports: [QuestionGenModule],
    controllers: [InterviewsController],
    providers: [InterviewsService],
    exports: [InterviewsService],
})
export class InterviewsModule {}
