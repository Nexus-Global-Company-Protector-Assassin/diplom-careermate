import { Controller } from '@nestjs/common';
import { ResumesService } from './resumes.service';

@Controller('resumes')
export class ResumesController {
    constructor(private readonly resumesService: ResumesService) { }
}
