// Runtime stub — replaces @qdrant/js-client-rest when package is not installed.
export class QdrantClient {
    constructor(_options: any) {}
    async getCollections() { return { collections: [] }; }
    async createCollection(_name: string, _options: any) {}
    async upsert(_collection: string, _options: any) {}
    async search(_collection: string, _options: any) { return []; }
    async delete(_collection: string, _options: any) {}
}
