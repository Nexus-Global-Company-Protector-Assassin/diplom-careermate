import { IsString, IsOptional, IsArray, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RunPocDto {
  @ApiProperty({ description: 'Full name of the user', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Location/City', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Desired Job Position', required: false })
  @IsString()
  @IsOptional()
  desiredPosition?: string;

  @ApiProperty({ description: 'Years of Experience', required: false })
  @IsNumber()
  @IsOptional()
  experienceYears?: number;

  @ApiProperty({ description: 'Education records', required: false, type: [Object] })
  @IsArray()
  @IsOptional()
  education?: any[];

  @ApiProperty({ description: 'Work experience records', required: false, type: [Object] })
  @IsArray()
  @IsOptional()
  workExperience?: any[];

  @ApiProperty({ description: 'Skills object (technical, professional)', required: false, type: Object })
  @IsObject()
  @IsOptional()
  skills?: Record<string, any>;

  @ApiProperty({ description: 'About Me text', required: false })
  @IsString()
  @IsOptional()
  aboutMe?: string;
}
