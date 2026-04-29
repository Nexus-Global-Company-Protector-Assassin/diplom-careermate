import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { KnowledgeGraphService } from './knowledge-graph.service';

@Injectable()
export class OntologyService {
    private readonly logger = new Logger(OntologyService.name);

    constructor(
        private readonly neo4j: Neo4jService,
        private readonly knowledgeGraph: KnowledgeGraphService,
    ) {}

    async seedCuratedRelations(): Promise<{ relationsAdded: number }> {
        if (!this.neo4j.isConnected()) return { relationsAdded: 0 };
        return { relationsAdded: 0 };
    }

    async classifyTopCoOccurrences(_limit = 50): Promise<void> {
        if (!this.neo4j.isConnected()) return;
    }

    async refreshMarketDemand(): Promise<{ updated: number }> {
        if (!this.neo4j.isConnected()) return { updated: 0 };
        return { updated: 0 };
    }
}
