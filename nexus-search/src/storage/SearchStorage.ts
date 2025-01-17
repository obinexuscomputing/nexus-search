import { openDB, IDBPDatabase } from 'idb';
import type { SearchDBSchema, StorageOptions } from '@/types';

export class SearchStorage {
    private db: IDBPDatabase<SearchDBSchema> | null = null;
    private memoryStorage: Map<string, unknown> = new Map();
    private storageType: 'indexeddb' | 'memory';
    
    constructor(options: StorageOptions = {
        type: 'memory'
    }) {
        this.storageType = this.determineStorageType(options);
    }

    private determineStorageType(options: StorageOptions): 'indexeddb' | 'memory' {
        // Use memory storage if explicitly specified or if in Node.js environment
        if (options.type === 'memory' || !this.isIndexedDBAvailable()) {
            return 'memory';
        }
        return 'indexeddb';
    }

    private isIndexedDBAvailable(): boolean {
        try {
            return typeof indexedDB !== 'undefined' && indexedDB !== null;
        } catch {
            return false;
        }
    }

    async initialize(): Promise<void> {
        if (this.storageType === 'memory') {
            // No initialization needed for memory storage
            return;
        }

        try {
            this.db = await openDB<SearchDBSchema>('nexus-search-db', 1, {
                upgrade(db) {
                    const indexStore = db.createObjectStore('searchIndices', { keyPath: 'id' });
                    indexStore.createIndex('timestamp', 'timestamp');

                    const metaStore = db.createObjectStore('metadata', { keyPath: 'id' });
                    metaStore.createIndex('lastUpdated', 'lastUpdated');
                }
            });
        } catch (error) {
            // Fallback to memory storage if IndexedDB fails
            this.storageType = 'memory';
            console.warn('Failed to initialize IndexedDB, falling back to memory storage:', error);
        }
    }

    async storeIndex(name: string, data: unknown): Promise<void> {
        if (this.storageType === 'memory') {
            this.memoryStorage.set(name, data);
            return;
        }

        try {
            await this.db?.put('searchIndices', {
                id: name,
                data,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Storage error:', error);
            // Fallback to memory storage
            this.memoryStorage.set(name, data);
        }
    }

    async getIndex(name: string): Promise<unknown> {
        if (this.storageType === 'memory') {
            return this.memoryStorage.get(name);
        }

        try {
            const entry = await this.db?.get('searchIndices', name);
            return entry?.data;
        } catch (error) {
            console.error('Retrieval error:', error);
            // Fallback to memory storage
            return this.memoryStorage.get(name);
        }
    }

    async clearIndices(): Promise<void> {
        if (this.storageType === 'memory') {
            this.memoryStorage.clear();
            return;
        }

        try {
            await this.db?.clear('searchIndices');
        } catch (error) {
            console.error('Clear error:', error);
            this.memoryStorage.clear();
        }
    }

    async close(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        this.memoryStorage.clear();
    }
}