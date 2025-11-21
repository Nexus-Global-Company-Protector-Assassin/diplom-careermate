import { IsEmail, IsString, IsOptional, IsNumber, Min, Max, IsArray, IsObject } from 'class-validator';

export class CreateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  desiredPosition?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000)
  desiredSalaryMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000)
  desiredSalaryMax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @IsOptional()
  @IsObject()
  education?: any;

  @IsOptional()
  @IsObject()
  workExperience?: any;

  @IsOptional()
  @IsArray()
  skills?: string[];

  @IsOptional()
  @IsObject()
  languages?: any;

  @IsOptional()
  @IsString()
  aboutMe?: string;

  @IsOptional()
  @IsString()
  careerGoals?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  githubUrl?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  portfolioUrl?: string;
}