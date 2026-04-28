import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session, SessionMode } from 'neo4j-driver';

const CONNECT_RETRIES = 3;
const CONNECT_RETRY_DELAY_MS = 5_000;

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(Neo4jService.name);
    private driver: Driver | null = null;
    private connected = false;

    constructor(private readonly configService: ConfigService) {}

    async onModuleInit() {
        const uri = this.configService.get<string>('NEO4J_URI');
        const user = this.configService.get<string>('NEO4J_USER', 'neo4j');
        const password = this.configService.get<string>('NEO4J_PASSWORD', '');

        if (!uri) {
            this.logger.warn('NEO4J_URI not configured — Knowledge Graph disabled');
            return;
        }

        this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

        for (let attempt = 1; attempt <= CONNECT_RETRIES; attempt++) {
            try {
                await this.driver.verifyConnectivity();
                this.connected = true;
                this.logger.log(`Connected to Neo4j at ${uri} (attempt ${attempt})`);
                return;
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                if (attempt < CONNECT_RETRIES) {
                    this.logger.warn(
                        `Neo4j connection attempt ${attempt}/${CONNECT_RETRIES} failed: ${msg} — retrying in ${CONNECT_RETRY_DELAY_MS / 1000}s`,
                    );
                    await new Promise((r) => setTimeout(r, CONNECT_RETRY_DELAY_MS));
                } else {
                    this.logger.warn(
                        `Neo4j connection failed after ${CONNECT_RETRIES} attempts: ${msg} — Knowledge Graph disabled`,
                    );
                }
            }
        }
    }

    async onModuleDestroy() {
        if (this.driver) {
            await this.driver.close();
        }
    }

    isConnected(): boolean {
        return this.connected && this.driver !== null;
    }

    async runQuery<T = any>(
        cypher: string,
        params: Record<string, any> = {},
        mode: SessionMode = neo4j.session.READ,
    ): Promise<T[]> {
        if (!this.driver || !this.connected) return [];

        const database = this.configService.get<string>('NEO4J_DATABASE', 'neo4j');
        const session: Session = this.driver.session({ defaultAccessMode: mode, database });

        try {
            const result = await session.run(cypher, params);
            return result.records.map((r) => r.toObject() as T);
        } finally {
            await session.close();
        }
    }
}
