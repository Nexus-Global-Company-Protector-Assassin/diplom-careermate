import {
    IsString,
    IsArray,
    IsOptional,
    IsInt,
    Min,
    Max,
    IsUrl,
    ValidateNested,
    IsMobilePhone,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WorkExperienceDto } from './work-experience.dto';
import { EducationDto } from './education.dto';

export class CreateProfileDto {
    @ApiProperty({ example: 'Иван Иванов', description: 'Full name', required: false })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiProperty({ example: '+79991234567', description: 'Phone number', required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ example: 'Moscow, Russia', description: 'Location city/country', required: false })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiProperty({ example: 'Frontend Developer', description: 'Desired job position', required: false })
    @IsOptional()
    @IsString()
    desiredPosition?: string;

    @ApiProperty({ example: 80000, description: 'Minimum desired salary (RUB)', required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    desiredSalaryMin?: number;

    @ApiProperty({ example: 150000, description: 'Maximum desired salary (RUB)', required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    desiredSalaryMax?: number;

    @ApiProperty({ example: 3, description: 'Years of experience (0–50)', required: false })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(50)
    experienceYears?: number;

    @ApiProperty({
        description: 'Education history JSON',
        required: false,
    })
    @IsOptional()
    education?: any;

    @ApiProperty({
        description: 'Work experience history JSON',
        required: false,
    })
    @IsOptional()
    workExperience?: any;

    @ApiProperty({
        example: { technical: ['React'], professional: ['Management'] },
        description: 'List of skills',
        required: false,
    })
    @IsOptional()
    skills?: any;

    @ApiProperty({
        example: [{ language: 'Russian', level: 'Native' }, { language: 'English', level: 'B2' }],
        description: 'Languages the user speaks',
        required: false,
    })
    @IsOptional()
    @IsArray()
    languages?: any[];

    @ApiProperty({ example: 'Passionate developer with 3 years of experience...', description: 'About me text', required: false })
    @IsOptional()
    @IsString()
    aboutMe?: string;

    @ApiProperty({ example: 'Become a Senior Frontend Developer in 2 years', description: 'Career goals', required: false })
    @IsOptional()
    @IsString()
    careerGoals?: string;

    @ApiProperty({ example: 'https://linkedin.com/in/ivanivanov', description: 'LinkedIn profile URL', required: false })
    @IsOptional()
    @IsUrl({}, { message: 'linkedinUrl must be a valid URL' })
    linkedinUrl?: string;

    @ApiProperty({ example: 'https://github.com/ivanivanov', description: 'GitHub profile URL', required: false })
    @IsOptional()
    @IsUrl({}, { message: 'githubUrl must be a valid URL' })
    githubUrl?: string;

    @ApiProperty({ example: 'https://ivanivanov.dev', description: 'Portfolio website URL', required: false })
    @IsOptional()
    @IsUrl({}, { message: 'portfolioUrl must be a valid URL' })
    portfolioUrl?: string;
}

