declare module 'neo4j-driver' {
    export interface Driver {
        verifyConnectivity(): Promise<void>;
        session(options?: { defaultAccessMode?: SessionMode; database?: string }): Session;
        close(): Promise<void>;
    }
    export interface Session {
        run(cypher: string, params?: Record<string, any>): Promise<{ records: Array<{ toObject(): any }> }>;
        close(): Promise<void>;
    }
    export type SessionMode = 'READ' | 'WRITE';
    export interface Auth {
        basic(user: string, password: string): { scheme: string; principal: string; credentials: string };
    }
    const neo4j: {
        driver(uri: string, auth: any, config?: any): Driver;
        auth: Auth;
        session: { READ: SessionMode; WRITE: SessionMode };
    };
    export default neo4j;
}
