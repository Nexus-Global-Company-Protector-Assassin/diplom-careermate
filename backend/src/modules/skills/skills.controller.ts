import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SkillsService } from './skills.service';
import { ExtractSkillsDto } from './dto/extract-skills.dto';

@ApiTags('Skills')
@Controller('skills')
export class SkillsController {
    constructor(private readonly skillsService: SkillsService) {}

    /**
     * Extract and normalize skills from arbitrary text (resume, job description).
     * Optionally uses LLM for intelligent normalization.
     */
    @Post('extract')
    @UseGuards(ThrottlerGuard)
    @ApiOperation({ summary: 'Extract and normalize skills from text (resume / job description)' })
    async extract(@Body() dto: ExtractSkillsDto) {
        const skills = await this.skillsService.extractFromText(dto.text, dto.useAi ?? true);
        return { skills, count: skills.length };
    }

    /**
     * Get the full skills dictionary (for autocomplete in profile editor).
     */
    @Get()
    @ApiOperation({ summary: 'Get all canonical skills (for autocomplete)' })
    @ApiQuery({ name: 'category', required: false, description: 'Filter by category: Frontend, Backend, DevOps, Data, Mobile, Database, Tools' })
    async getAll(@Query('category') category?: string) {
        return this.skillsService.getAllSkills(category);
    }

    /**
     * Get normalized skill gap between the current profile and a vacancy.
     * Returns matched skills, missing skills, and a 0–100 match score.
     */
    @Get('gap/:profileId/:vacancyId')
    @ApiOperation({ summary: 'Get skill gap between a profile and a vacancy' })
    @ApiParam({ name: 'profileId', description: 'Profile UUID' })
    @ApiParam({ name: 'vacancyId', description: 'Vacancy UUID' })
    async getGap(
        @Param('profileId') profileId: string,
        @Param('vacancyId') vacancyId: string,
    ) {
        return this.skillsService.getSkillGap(profileId, vacancyId);
    }

    /**
     * Trigger one-time migration of existing JSON skills → normalized skill tables.
     * Safe to call multiple times (idempotent).
     */
    @Post('migrate')
    @ApiOperation({ summary: '[Admin] Migrate existing JSON skills to normalized tables' })
    async migrate() {
        return this.skillsService.migrateExistingData();
    }
}
