import { DBSchema as IDBSchema } from 'idb';
import { IndexConfig } from './compactability';

// Example usage with idb:
/*
import { openDB } from 'idb';

const db = await openDB<SearchDBSchema>('nexus-search-db', 1, {
    upgrade(db) {
        // Create stores with indexes
        const indexStore = db.createObjectStore('searchIndices', { keyPath: 'id' });
        indexStore.createIndex('timestamp', 'timestamp');

        const metaStore = db.createObjectStore('metadata', { keyPath: 'id' });
        metaStore.createIndex('lastUpdated', 'lastUpdated');
    }
});
*/
export interface SearchDBSchema extends IDBSchema {
    searchIndices: {
        key: string;
        value: {
            id: string;
            data: unknown;
            timestamp: number;
        };
        indexes: {
            'timestamp': number;
        };
    };
    metadata: {
        key: string;
        value: MetadataEntry;
        indexes: {
            'lastUpdated': number;
        };
    };
}

export interface MetadataEntry {
    id: string;
    config: IndexConfig;
    lastUpdated: number;
}


export interface DatabaseConfig {
    name: string;
    version: number;
    stores: Array<{
        name: string;
        keyPath: string;
        indexes: Array<{
            name: string;
            keyPath: string;
            options?: IDBIndexParameters;
        }>;
    }>;
}