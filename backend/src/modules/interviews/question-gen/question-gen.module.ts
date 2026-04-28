import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { QuestionGenController } from './question-gen.controller';
import { QuestionGenService } from './question-gen.service';

@Module({
    imports: [HttpModule],
    controllers: [QuestionGenController],
    providers: [QuestionGenService],
    exports: [QuestionGenService],
})
export class QuestionGenModule {}
