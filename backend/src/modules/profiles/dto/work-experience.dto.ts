import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class WorkExperienceDto {
    @ApiProperty({ example: 'Frontend Developer', description: 'Job title' })
    @IsString()
    title: string;

    @ApiProperty({ example: 'Acme Corp', description: 'Company name' })
    @IsString()
    company: string;

    @ApiProperty({ example: '2020-01-01', description: 'Start date (ISO string)' })
    @IsString()
    startDate: string;

    @ApiProperty({ example: '2022-12-31', description: 'End date (ISO string), null if current', required: false })
    @IsOptional()
    @IsString()
    endDate?: string;

    @ApiProperty({ example: 'Moscow, Russia', description: 'Location', required: false })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiProperty({ example: 'Developed React applications...', description: 'Job description', required: false })
    @IsOptional()
    @IsString()
    description?: string;
}
