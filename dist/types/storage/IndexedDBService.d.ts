import { IndexOptions, SearchOptions, IndexConfig, MetadataEntry } from "@/types";
export declare const DEFAULT_INDEX_OPTIONS: Required<IndexOptions>;
export declare const DEFAULT_SEARCH_OPTIONS: Required<SearchOptions>;
export declare class IndexedDB {
    private db;
    private readonly DB_NAME;
    private readonly DB_VERSION;
    private initPromise;
    constructor();
    initialize(): Promise<void>;
    private ensureConnection;
    storeIndex(key: string, data: unknown): Promise<void>;
    getIndex(key: string): Promise<unknown | null>;
    updateMetadata(config: IndexConfig): Promise<void>;
    getMetadata(): Promise<MetadataEntry | null>;
    clearIndices(): Promise<void>;
    deleteIndex(key: string): Promise<void>;
    close(): Promise<void>;
}
export declare class SearchStorage {
    private db;
    private readonly DB_NAME;
    private readonly DB_VERSION;
    private initPromise;
    constructor();
    initialize(): Promise<void>;
    private ensureConnection;
    storeIndex(key: string, data: any): Promise<void>;
    getIndex(key: string): Promise<any | null>;
    updateMetadata(config: IndexConfig): Promise<void>;
    getMetadata(): Promise<MetadataEntry | null>;
    clearIndices(): Promise<void>;
    close(): Promise<void>;
}
