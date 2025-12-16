import { IsString, IsArray, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileDto {
    @ApiProperty({ example: 'Frontend Developer', description: 'Target role for the user' })
    @IsString()
    @IsNotEmpty()
    targetRole: string;

    @ApiProperty({ example: ['React', 'TypeScript', 'Node.js'], description: 'List of skills' })
    @IsArray()
    @IsString({ each: true })
    skills: string[];

    @ApiProperty({ example: '5 years of experience in web development...', description: 'Experience description' })
    @IsString()
    @IsOptional()
    experience?: string;
}
