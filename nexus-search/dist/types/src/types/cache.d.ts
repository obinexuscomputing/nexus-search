import { SearchResult } from "./search";
export interface CacheOptions {
    maxSize: number;
    ttlMinutes: number;
}
export interface CacheEntry {
    data: SearchResult<unknown>[];
    timestamp: number;
    lastAccessed: number;
    accessCount: number;
}
export interface CacheOptions {
    strategy: CacheStrategyType;
    maxSize: number;
    ttlMinutes: number;
}
export declare enum CacheStrategyType {
    LRU = "LRU",
    MRU = "MRU"
}
export type CacheStrategy = keyof typeof CacheStrategyType;
export interface CacheStatus {
    size: number;
    maxSize: number;
    strategy: CacheStrategy;
    ttl: number;
    utilization: number;
    oldestEntryAge: number | null;
    newestEntryAge: number | null;
    memoryUsage: {
        bytes: number;
        formatted: string;
    };
}
