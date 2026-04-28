import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import { DatabaseModule } from '../../database/database.module';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { SkillClassifierService } from './skill-classifier.service';
import { OntologyService } from './ontology.service';
import { SkillsSchedulerService } from './skills-scheduler.service';

@Module({
    imports: [HttpModule, DatabaseModule],
    controllers: [SkillsController],
    providers: [
        SkillsService,
        KnowledgeGraphService,
        SkillClassifierService,
        OntologyService,
        SkillsSchedulerService,
    ],
    exports: [SkillsService, KnowledgeGraphService, OntologyService],
})
export class SkillsModule {}
