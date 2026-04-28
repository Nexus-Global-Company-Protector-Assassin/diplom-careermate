import { IsString, IsArray, IsNumber, ValidateNested, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AnswerDto {
    @ApiProperty({ example: 'u-1' })
    @IsString()
    questionId: string;

    @ApiProperty({ example: 0, minimum: 0, maximum: 3 })
    @IsNumber()
    @Min(0)
    @Max(3)
    optionIndex: number;
}

export class DimensionScoresDto {
    @IsNumber() @Min(0) @Max(5) analytical: number;
    @IsNumber() @Min(0) @Max(5) technical: number;
    @IsNumber() @Min(0) @Max(5) social: number;
    @IsNumber() @Min(0) @Max(5) creative: number;
    @IsNumber() @Min(0) @Max(5) leadership: number;
    @IsNumber() @Min(0) @Max(5) structured: number;
}

export class SubmitAssessmentDto {
    @ApiProperty({ example: 'it', description: 'it | finance | marketing | management | creative | other' })
    @IsString()
    domain: string;

    @ApiProperty({ type: [AnswerDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AnswerDto)
    answers: AnswerDto[];

    @ApiProperty({ type: DimensionScoresDto })
    @ValidateNested()
    @Type(() => DimensionScoresDto)
    dimensionScores: DimensionScoresDto;

    @ApiProperty({ example: ['Backend Developer', 'Data Scientist'], description: 'Top-5 roles from client-side cosine similarity' })
    @IsArray()
    @IsString({ each: true })
    topPathRoles: string[];
}
