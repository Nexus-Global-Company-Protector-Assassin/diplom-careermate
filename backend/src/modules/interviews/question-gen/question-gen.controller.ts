import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { QuestionGenService } from './question-gen.service';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';

@ApiTags('Interviews')
@Controller('interviews/question-gen')
@UseGuards(ThrottlerGuard)
export class QuestionGenController {
    constructor(private readonly questionGenService: QuestionGenService) {}

    @Post()
    @ApiOperation({
        summary: 'Generate AI interview questions (STAR+R method)',
        description:
            'Generates personalised interview questions based on a job vacancy description and the candidate\'s resume. Returns questions with ready-made STAR+R answers and tips.',
    })
    @ApiBody({ type: GenerateQuestionsDto })
    @ApiResponse({
        status: 201,
        description: 'Questions generated successfully',
        schema: {
            example: {
                questions: [
                    {
                        question: 'Расскажите о сложном техническом проекте, который вы реализовали',
                        category: 'behavioral',
                        star: {
                            situation: 'Описание ситуации...',
                            task: 'Поставленная задача...',
                            action: 'Конкретные действия...',
                            result: 'Измеримый результат...',
                            reflection: 'Вывод из опыта...',
                        },
                    },
                ],
                candidate_questions: [
                    'Какой стек технологий используется в команде?',
                    'Как устроен процесс code review?',
                    'Каковы возможности для профессионального роста?',
                ],
                tips: 'Общие советы для данного собеседования...',
            },
        },
    })
    async generate(@Body() dto: GenerateQuestionsDto) {
        return this.questionGenService.generate(dto);
    }
}
