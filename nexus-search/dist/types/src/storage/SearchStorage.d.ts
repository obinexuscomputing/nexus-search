import type { StorageOptions } from '@/types';
export declare class SearchStorage {
    private db;
    private memoryStorage;
    private storageType;
    constructor(options?: StorageOptions);
    private determineStorageType;
    private isIndexedDBAvailable;
    initialize(): Promise<void>;
    storeIndex(name: string, data: unknown): Promise<void>;
    getIndex(name: string): Promise<unknown>;
    clearIndices(): Promise<void>;
    close(): Promise<void>;
}
