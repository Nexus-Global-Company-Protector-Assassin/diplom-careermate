// Runtime stub — replaces neo4j-driver when the package is not installed.
// Neo4jService checks NEO4J_URI and disables itself if not configured.

export type SessionMode = 'READ' | 'WRITE';

export interface Session {
    run(cypher: string, params?: Record<string, any>): Promise<{ records: Array<{ toObject(): any }> }>;
    close(): Promise<void>;
}

export interface Driver {
    verifyConnectivity(): Promise<void>;
    session(options?: { defaultAccessMode?: SessionMode; database?: string }): Session;
    close(): Promise<void>;
}

const neo4j = {
    driver(_uri: string, _auth: any): Driver {
        throw new Error('neo4j-driver not installed — set NEO4J_URI to enable Knowledge Graph');
    },
    auth: {
        basic(user: string, credentials: string) {
            return { scheme: 'basic', principal: user, credentials };
        },
    },
    session: { READ: 'READ' as SessionMode, WRITE: 'WRITE' as SessionMode },
};

export default neo4j;
