import type { IndexConfig, SearchContext, SearchOptions, SearchResult, SearchStats, SearchEventType, SearchEvent, DocumentLink, DocumentRank } from './types/index';
export { DocumentLink, DocumentRank, SearchEvent, SearchEventType, SearchStats, SearchContext };
import { SearchEngine } from '@core/SearchEngine';
import { IndexManager } from '@storage/IndexManager';
import { QueryProcessor } from '@core/QueryProcessor';
import { TrieNode } from '@algorithms/trie/TrieNode';
import { TrieSearch } from '@algorithms/trie/TrieSearch';
import { DataMapper } from '@/mappers/DataMapper';
import { IndexMapper } from '@/mappers/IndexMapper';
import { CacheManager } from '@storage/CacheManager';
import { IndexedDB } from '@storage/IndexedDBService';
import { PerformanceMonitor, createSearchableFields, optimizeIndex, getNestedValue, normalizeFieldValue, validateSearchOptions, validateIndexConfig, validateDocument } from '@utils/index';
export * from './types/';
export declare class SearchError extends Error {
    constructor(message: string);
}
export declare class IndexError extends Error {
    constructor(message: string);
}
export declare function isSearchOptions(obj: unknown): obj is SearchOptions;
export declare function isIndexConfig(obj: unknown): obj is IndexConfig;
export declare function isSearchResult<T>(obj: unknown): obj is SearchResult<T>;
declare global {
    interface Window {
        NexusSearch: typeof NexusSearchNamespace;
    }
}
declare const NexusSearchNamespace: {
    readonly DEFAULT_INDEX_OPTIONS: {
        fields: never[];
    };
    readonly DEFAULT_SEARCH_OPTIONS: Required<SearchOptions>;
    readonly SearchError: typeof SearchError;
    readonly IndexError: typeof IndexError;
    readonly SearchEngine: typeof SearchEngine;
    readonly IndexManager: typeof IndexManager;
    readonly QueryProcessor: typeof QueryProcessor;
    readonly TrieNode: typeof TrieNode;
    readonly TrieSearch: typeof TrieSearch;
    readonly isSearchOptions: typeof isSearchOptions;
    readonly isIndexConfig: typeof isIndexConfig;
    readonly isSearchResult: typeof isSearchResult;
};
export { SearchEngine, IndexManager, QueryProcessor, TrieNode, TrieSearch, DataMapper, IndexMapper, CacheManager, IndexedDB, PerformanceMonitor, createSearchableFields, optimizeIndex, getNestedValue, normalizeFieldValue, validateSearchOptions, validateIndexConfig, validateDocument };
export declare const NexusSearch: {
    readonly DEFAULT_INDEX_OPTIONS: {
        fields: never[];
    };
    readonly DEFAULT_SEARCH_OPTIONS: Required<SearchOptions>;
    readonly SearchError: typeof SearchError;
    readonly IndexError: typeof IndexError;
    readonly SearchEngine: typeof SearchEngine;
    readonly IndexManager: typeof IndexManager;
    readonly QueryProcessor: typeof QueryProcessor;
    readonly TrieNode: typeof TrieNode;
    readonly TrieSearch: typeof TrieSearch;
    readonly isSearchOptions: typeof isSearchOptions;
    readonly isIndexConfig: typeof isIndexConfig;
    readonly isSearchResult: typeof isSearchResult;
};
export default NexusSearch;
