import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExtractSkillsDto {
    @ApiProperty({ description: 'Text to extract skills from (resume content, job description, etc.)' })
    @IsString()
    text: string;

    @ApiPropertyOptional({ description: 'Use AI (LLM) for extraction. false = dictionary-only (faster)', default: true })
    @IsOptional()
    @IsBoolean()
    useAi?: boolean;
}
