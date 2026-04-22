import { IsOptional, IsString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateQuestionsDto {
    @ApiPropertyOptional({ description: 'Job title / vacancy name' })
    @IsOptional()
    @IsString()
    vacancyTitle?: string;

    @ApiPropertyOptional({ description: 'Employer / company name' })
    @IsOptional()
    @IsString()
    vacancyEmployer?: string;

    @ApiPropertyOptional({ description: 'Job description text' })
    @IsOptional()
    @IsString()
    vacancyDescription?: string;

    @ApiPropertyOptional({ description: 'Required skills list', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    vacancySkills?: string[];

    @ApiPropertyOptional({ description: 'Required experience level' })
    @IsOptional()
    @IsString()
    vacancyExperience?: string;

    @ApiPropertyOptional({ description: 'Work schedule / format (remote, hybrid…)' })
    @IsOptional()
    @IsString()
    vacancySchedule?: string;

    @ApiPropertyOptional({ description: 'Candidate resume content (plain text or markdown)' })
    @IsOptional()
    @IsString()
    resumeContent?: string;
}
