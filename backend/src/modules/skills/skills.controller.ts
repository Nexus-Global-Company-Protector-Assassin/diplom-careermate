import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SkillsService } from './skills.service';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { OntologyService } from './ontology.service';
import { SkillsSchedulerService } from './skills-scheduler.service';
import { ExtractSkillsDto } from './dto/extract-skills.dto';

@ApiTags('Skills')
@ApiBearerAuth()
@Controller('skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
    constructor(
        private readonly skillsService: SkillsService,
        private readonly knowledgeGraphService: KnowledgeGraphService,
        private readonly ontologyService: OntologyService,
        private readonly schedulerService: SkillsSchedulerService,
    ) {}

    // ── Core ──────────────────────────────────────────────────────────────────

    @Post('extract')
    @UseGuards(ThrottlerGuard)
    @ApiOperation({ summary: 'Extract and normalize skills from text (resume / job description)' })
    async extract(@Body() dto: ExtractSkillsDto) {
        const skills = await this.skillsService.extractFromText(dto.text, dto.useAi ?? true);
        return { skills, count: skills.length };
    }

    @Get()
    @ApiOperation({ summary: 'Get all canonical skills (for autocomplete)' })
    @ApiQuery({ name: 'category', required: false })
    async getAll(@Query('category') category?: string) {
        return this.skillsService.getAllSkills(category);
    }

    @Get('gap/:profileId/:vacancyId')
    @ApiOperation({ summary: 'Get skill gap between a profile and a vacancy (Jaccard + semantic score)' })
    @ApiParam({ name: 'profileId' })
    @ApiParam({ name: 'vacancyId' })
    async getGap(@Param('profileId') profileId: string, @Param('vacancyId') vacancyId: string) {
        return this.skillsService.getSkillGap(profileId, vacancyId);
    }

    @Post('migrate')
    @ApiOperation({ summary: '[Admin] Migrate existing JSON skills to normalized tables' })
    async migrate() {
        return this.skillsService.migrateExistingData();
    }

    // ── Graph — co-occurrence ─────────────────────────────────────────────────

    @Get('graph/related')
    @ApiOperation({ summary: 'Get skills co-occurring with a given skill (decay-weighted)' })
    @ApiQuery({ name: 'name', required: true })
    @ApiQuery({ name: 'limit', required: false })
    async getRelated(@Query('name') name: string, @Query('limit') limit?: string) {
        return this.knowledgeGraphService.getRelatedSkills(name, limit ? parseInt(limit, 10) : 10);
    }

    @Get('graph/stats')
    @ApiOperation({ summary: 'Get KG statistics (skills, categories, co-occurrences, users, vacancies)' })
    async getGraphStats() {
        return this.knowledgeGraphService.getStats();
    }

    // ── Phase 1: Community detection ──────────────────────────────────────────

    @Get('graph/communities')
    @ApiOperation({ summary: 'Get skill communities grouped by Louvain communityId' })
    @ApiQuery({ name: 'minSize', required: false })
    async getCommunities(@Query('minSize') minSize?: string) {
        return this.knowledgeGraphService.getCommunities(minSize ? parseInt(minSize, 10) : 2);
    }

    @Post('graph/communities/refresh')
    @ApiOperation({ summary: '[Admin] Run Louvain community detection (GDS plugin required)' })
    async refreshCommunities() {
        const result = await this.knowledgeGraphService.refreshCommunities();
        return result ?? { message: 'GDS plugin not available or Neo4j not connected' };
    }

    @Get('graph/scheduler/status')
    @ApiOperation({ summary: 'Get scheduler job health (last run, status, consecutive failures)' })
    getSchedulerStatus() {
        return this.schedulerService.getStatus();
    }

    // ── Phase 4: Ontology ─────────────────────────────────────────────────────

    @Post('graph/ontology/seed')
    @ApiOperation({ summary: '[Admin] Seed curated IS_A / REQUIRES / ENABLES / DEPRECATED_BY relations' })
    async seedOntology() {
        return this.ontologyService.seedCuratedRelations();
    }

    @Post('graph/ontology/classify')
    @ApiOperation({ summary: '[Admin] LLM-classify top unclassified CO_OCCURS_WITH pairs (runs in background)' })
    @ApiQuery({ name: 'limit', required: false, description: 'Max pairs to classify (default 50)' })
    classifyOntology(@Query('limit') limit?: string) {
        const n = limit ? parseInt(limit, 10) : 50;
        // Fire-and-forget: each LLM call takes 1-2s so never await this in an HTTP handler
        void this.ontologyService.classifyTopCoOccurrences(n);
        return { status: 'started', pairsToClassify: n, message: 'Running in background — check server logs for progress.' };
    }

    @Get('graph/ontology/deprecations')
    @ApiOperation({ summary: 'Get DEPRECATED_BY warnings for given skill IDs' })
    @ApiQuery({ name: 'ids', required: true, description: 'Comma-separated skill IDs (max 50)' })
    async getDeprecations(@Query('ids') ids: string) {
        const skillIds = ids.split(',').map(s => s.trim()).filter(Boolean).slice(0, 50);
        return this.knowledgeGraphService.getDeprecationWarnings(skillIds);
    }

    // ── Phase 4: Market demand ────────────────────────────────────────────────

    @Get('market-demand')
    @ApiOperation({ summary: 'Get top skills by market demand score (0–100, last 30 days)' })
    @ApiQuery({ name: 'topN', required: false })
    async getMarketDemand(@Query('topN') topN?: string) {
        return this.skillsService.getMarketDemand(topN ? parseInt(topN, 10) : 50);
    }

    @Post('market-demand/refresh')
    @ApiOperation({ summary: '[Admin] Recompute market demand scores from recent vacancies' })
    async refreshMarketDemand() {
        return this.ontologyService.refreshMarketDemand();
    }

    // ── Bootstrap ─────────────────────────────────────────────────────────────

    @Post('graph/bootstrap')
    @ApiOperation({ summary: '[Admin] One-shot bootstrap: seed ontology → market demand → community detection' })
    async bootstrap() {
        let ontology: unknown;
        let marketDemand: unknown;
        let communities: unknown;

        try {
            ontology = await this.ontologyService.seedCuratedRelations();
        } catch (e) {
            ontology = { error: e instanceof Error ? e.message : String(e) };
        }

        try {
            marketDemand = await this.ontologyService.refreshMarketDemand();
        } catch (e) {
            marketDemand = { error: e instanceof Error ? e.message : String(e) };
        }

        try {
            const result = await this.knowledgeGraphService.refreshCommunities();
            communities = result ?? { message: 'GDS plugin not available or Neo4j not connected' };
        } catch (e) {
            communities = { error: e instanceof Error ? e.message : String(e) };
        }

        return { ontology, marketDemand, communities };
    }
}
