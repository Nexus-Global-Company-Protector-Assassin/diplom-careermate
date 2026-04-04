import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class EducationDto {
    @ApiProperty({ example: 'Moscow State University', description: 'Institution name' })
    @IsString()
    institution: string;

    @ApiProperty({ example: 'Computer Science', description: 'Field of study / degree' })
    @IsString()
    degree: string;

    @ApiProperty({ example: '2016-09-01', description: 'Start date (ISO string)' })
    @IsString()
    startDate: string;

    @ApiProperty({ example: '2020-06-30', description: 'End date (ISO string)', required: false })
    @IsOptional()
    @IsString()
    endDate?: string;

    @ApiProperty({
        example: 'Bachelor',
        description: 'Level of education',
        enum: ['High School', 'Bachelor', 'Master', 'PhD', 'Other'],
        required: false,
    })
    @IsOptional()
    @IsIn(['High School', 'Bachelor', 'Master', 'PhD', 'Other'])
    level?: string;
}
