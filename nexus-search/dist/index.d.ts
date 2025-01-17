import { DBSchema } from 'idb';
import { SearchEngine } from '@core/SearchEngine';
export { SearchEngine } from '@core/SearchEngine';
import { IndexManager } from '@storage/IndexManager';
export { IndexManager } from '@storage/IndexManager';
import { QueryProcessor } from '@core/QueryProcessor';
export { QueryProcessor } from '@core/QueryProcessor';
import { TrieNode } from '@algorithms/trie/TrieNode';
export { TrieNode } from '@algorithms/trie/TrieNode';
import { TrieSearch } from '@algorithms/trie/TrieSearch';
export { TrieSearch } from '@algorithms/trie/TrieSearch';
export { DataMapper } from '@/mappers/DataMapper';
export { IndexMapper } from '@/mappers/IndexMapper';
export { CacheManager } from '@storage/CacheManager';
export { IndexedDB } from '@storage/IndexedDBService';
export { PerformanceMonitor, createSearchableFields, getNestedValue, normalizeFieldValue, optimizeIndex, validateDocument, validateIndexConfig, validateSearchOptions } from '@utils/index';

type PrimitiveValue = string | number | boolean | null;
type ArrayValue = PrimitiveValue[];
type DocumentValue = PrimitiveValue | ArrayValue | Record<string, unknown>;
type DocumentContent = {
    [key: string]: DocumentValue | DocumentContent;
};
interface DocumentMetadata {
    indexed?: number;
    lastModified?: number;
    [key: string]: unknown;
}
interface NexusDocumentMetadata extends DocumentMetadata {
    indexed: number;
    lastModified: number;
    checksum?: string;
    permissions?: string[];
    workflow?: DocumentWorkflow;
}
interface BaseFields {
    title: string;
    content: DocumentContent;
    author: string;
    tags: string[];
    version: string;
    modified?: string;
    [key: string]: DocumentValue | undefined;
}
interface IndexableFields extends BaseFields {
    content: DocumentContent;
}
interface NexusFields extends IndexableFields {
    type: string;
    category?: string;
    created: string;
    status: DocumentStatus;
    locale?: string;
}
interface IndexConfig$1 {
    name: string;
    fields: string[];
    searchFields: string[];
    metadataFields: string[];
    searchOptions: SearchOptions;
}
interface DocumentBase {
    id: string;
    metadata?: DocumentMetadata;
    versions: DocumentVersion[];
    relations: DocumentRelation[];
    title: string;
    author: string;
    tags: string[];
    version: string;
}
interface IndexedDocument extends DocumentBase {
    fields: IndexableFields;
    metadata?: DocumentMetadata;
    links?: DocumentLink[];
    ranks?: DocumentRank[];
    versions: DocumentVersion[];
    relations: DocumentRelation[];
    document(): IndexedDocument;
    base(): DocumentBase;
}
interface IndexedDocumentData extends DocumentBase {
    fields: BaseFields;
    metadata?: DocumentMetadata;
    versions: Array<DocumentVersion>;
    relations: Array<DocumentRelation>;
}
interface DocumentLink {
    weight: number;
    url: string;
    source: string;
    target: string;
    fromId(fromId: string): string;
    toId(toId: string): string;
    type: string;
}
interface DocumentRelation {
    sourceId: string;
    targetId: string;
    type: RelationType;
    metadata?: Record<string, unknown>;
}
interface DocumentVersion {
    version: number;
    content: DocumentContent;
    modified: Date;
    author: string;
    changelog?: string;
}
interface DocumentRank {
    id: string;
    rank: number;
    incomingLinks: number;
    outgoingLinks: number;
    content: Record<string, unknown>;
    metadata?: DocumentMetadata;
}
interface DocumentWorkflow {
    status: string;
    assignee?: string;
    dueDate?: string;
}
interface DocumentConfig {
    fields?: string[];
    storage?: StorageConfig;
    versioning?: VersioningConfig;
    validation?: ValidationConfig;
}
interface StorageConfig {
    type: 'memory' | 'indexeddb';
    options?: Record<string, unknown>;
}
interface VersioningConfig {
    enabled: boolean;
    maxVersions?: number;
}
interface ValidationConfig {
    required?: string[];
    customValidators?: Record<string, (value: unknown) => boolean>;
}
interface CreateDocumentOptions {
    title: string;
    content: DocumentContent;
    type: string;
    tags?: string[];
    category?: string;
    author: string;
    status?: DocumentStatus;
    locale?: string;
    metadata?: Partial<NexusDocumentMetadata>;
}
interface AdvancedSearchOptions extends SearchOptions {
    filters?: SearchFilters;
    sort?: SortConfig;
}
type DocumentStatus = 'draft' | 'published' | 'archived';
type RelationType = 'reference' | 'parent' | 'child' | 'related';
interface SearchFilters {
    status?: DocumentStatus[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    categories?: string[];
    types?: string[];
    authors?: string[];
}
interface SortConfig {
    field: keyof NexusFields;
    order: 'asc' | 'desc';
}
interface NexusDocument extends IndexedDocument {
    fields: NexusFields;
    metadata?: NexusDocumentMetadata;
    links?: DocumentLink[];
    ranks?: DocumentRank[];
    document(): NexusDocument;
}
interface NexusDocumentInput extends Partial<NexusDocument> {
    id?: string;
    content?: DocumentContent;
}
/**
 * Plugin configuration for NexusDocument
 */
interface NexusDocumentPluginConfig {
    name?: string;
    version?: number;
    fields?: string[];
    storage?: {
        type: 'memory' | 'indexeddb';
        options?: Record<string, unknown>;
    };
    versioning?: {
        enabled?: boolean;
        maxVersions?: number;
    };
    validation?: {
        required?: string[];
        customValidators?: Record<string, (value: unknown) => boolean>;
    };
}

interface SearchResult<T = unknown> {
    docId: string;
    term: string;
    distance?: number;
    id: string;
    document: IndexedDocument;
    item: T;
    score: number;
    matches: string[];
    metadata?: DocumentMetadata;
}
interface Search {
    search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}
interface SearchOptions {
    fuzzy?: boolean;
    fields?: string[];
    boost?: Record<string, number>;
    maxResults?: number;
    threshold?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
    enableRegex?: boolean;
    maxDistance?: number;
    regex?: string | RegExp;
    highlight?: boolean;
    includeMatches?: boolean;
    includeScore?: boolean;
    includeStats?: boolean;
    prefixMatch?: boolean;
    minScore?: number;
    includePartial?: boolean;
    caseSensitive?: boolean;
}
interface SearchContext {
    query: string;
    options: SearchOptions;
    startTime: number;
    results: SearchResult[];
    stats: SearchStats;
}
interface SearchStats {
    totalResults: number;
    searchTime: number;
    indexSize: number;
    queryComplexity: number;
}
interface SearchableDocument {
    id: string;
    content: Record<string, DocumentValue>;
    metadata?: DocumentMetadata;
    [key: string]: unknown;
    version: string;
    indexed?: number;
}
interface SearchableField {
    value: DocumentValue;
    weight?: number;
    metadata?: DocumentMetadata;
}
interface SearchNode {
    id?: string;
    score: number;
    value?: DocumentValue;
    children: Map<string, SearchNode>;
    metadata?: DocumentMetadata;
}
interface SearchScoreParams {
    term: string;
    documentId: string;
    options: SearchOptions;
}
interface SearchMatch {
    field: string;
    value: string;
    indices: number[];
}
interface SearchEngineOptions {
    fuzzyMatchingEnabled?: boolean;
    regexSearchEnabled?: boolean;
    maxSearchResults?: number;
    defaultThreshold?: number;
    defaultBoost?: Record<string, number>;
}
interface SearchPagination {
    page: number;
    pageSize: number;
    totalPages: number;
    totalResults: number;
}
interface SearchEngineConfig extends IndexConfig$1 {
    version: number;
    documentSupport?: {
        enabled: boolean;
        versioning?: {
            enabled?: boolean;
            maxVersions?: number;
        };
    };
    storage: {
        type: string;
        options?: object;
    };
    search?: {
        defaultOptions?: SearchOptions;
    };
    fields: string[];
    indexing: {
        enabled: boolean;
        fields: string[];
        options: {
            tokenization: boolean;
            caseSensitive: boolean;
            stemming: boolean;
        };
    };
}
/**
 * Search result with regex matching details
 */
interface RegexSearchResult {
    id: string;
    score: number;
    matches: string[];
    path: string[];
    positions: Array<[number, number]>;
}
/**
 * Enhanced regex search configuration
 */
interface RegexSearchConfig {
    maxDepth?: number;
    timeoutMs?: number;
    caseSensitive?: boolean;
    wholeWord?: boolean;
}
/**
 * Enhanced regex search configuration
 */
interface RegexSearchConfig {
    maxDepth?: number;
    timeoutMs?: number;
    caseSensitive?: boolean;
    wholeWord?: boolean;
}
interface ExtendedSearchOptions extends SearchOptions {
    regexConfig?: RegexSearchConfig;
}

interface IndexOptions {
    caseSensitive?: boolean;
    stemming?: boolean;
    stopWords?: string[];
    minWordLength?: number;
    maxWordLength?: number;
    fuzzyThreshold?: number;
}
interface IndexConfig {
    name: string;
    version: number;
    fields: string[];
    options?: IndexOptions;
}

interface IndexNode {
    depth: number;
    id: string;
    value: unknown;
    score: number;
    children: Map<string, IndexNode>;
}
interface TokenInfo {
    value: string;
    type: 'word' | 'operator' | 'modifier' | 'delimiter';
    position: number;
    length: number;
}
interface SerializedIndex {
    documents: Array<{
        key: string;
        value: IndexedDocument;
    }>;
    indexState: unknown;
    config: IndexConfig;
}

interface SearchDBSchema extends DBSchema {
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
interface MetadataEntry {
    id: string;
    config: IndexConfig;
    lastUpdated: number;
}
interface DatabaseConfig {
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

declare class ValidationError extends Error {
    constructor(message: string);
}
declare class StorageError extends Error {
    constructor(message: string);
}
declare class CacheError extends Error {
    constructor(message: string);
}
declare class MapperError extends Error {
    constructor(message: string);
}
declare class PerformanceError extends Error {
    constructor(message: string);
}
declare class ConfigError extends Error {
    constructor(message: string);
}

type SearchEventType = 'engine:initialized' | 'engine:closed' | 'index:start' | 'index:complete' | 'index:error' | 'index:clear' | 'index:clear:error' | 'search:start' | 'search:complete' | 'search:error' | 'update:start' | 'update:complete' | 'update:error' | 'remove:start' | 'remove:complete' | 'remove:error' | 'bulk:update:start' | 'bulk:update:complete' | 'bulk:update:error' | 'import:start' | 'import:complete' | 'import:error' | 'export:start' | 'export:complete' | 'export:error' | 'optimize:start' | 'optimize:complete' | 'optimize:error' | 'reindex:start' | 'reindex:complete' | 'reindex:error' | 'storage:error' | 'storage:clear' | 'storage:clear:error';
interface BaseEvent {
    timestamp: number;
    region?: string;
}
interface SuccessEvent extends BaseEvent {
    data?: {
        documentCount?: number;
        searchTime?: number;
        resultCount?: number;
        documentId?: string;
        updateCount?: number;
        query?: string;
        options?: unknown;
    };
}
interface ErrorEvent extends BaseEvent {
    error: Error;
    details?: {
        documentId?: string;
        operation?: string;
        phase?: string;
    };
}
interface SearchEvent extends BaseEvent {
    type: SearchEventType;
    data?: unknown;
    error?: Error;
    regex?: RegExp;
}
interface SearchEventListener {
    (event: SearchEvent): void;
}
interface SearchEventEmitter {
    addEventListener(listener: SearchEventListener): void;
    removeEventListener(listener: SearchEventListener): void;
    emitEvent(event: SearchEvent): void;
}
declare class SearchEventError extends Error {
    readonly type: SearchEventType;
    readonly details?: unknown | undefined;
    constructor(message: string, type: SearchEventType, details?: unknown | undefined);
}

interface MapperState {
    trie: unknown;
    dataMap: Record<string, string[]>;
    documents: Array<{
        key: string;
        value: IndexedDocument;
    }>;
    config: IndexConfig;
}
interface MapperOptions {
    caseSensitive?: boolean;
    normalization?: boolean;
}

interface StorageEntry<T> {
    id: string;
    data: T;
    timestamp: number;
}
interface StorageOptions {
    type: string;
    maxSize?: number;
    ttl?: number;
}

interface CacheEntry {
    data: SearchResult<unknown>[];
    timestamp: number;
    lastAccessed: number;
    accessCount: number;
}
interface CacheOptions {
    maxSize: number;
    ttlMinutes: number;
}
interface CacheOptions {
    strategy: CacheStrategyType;
    maxSize: number;
    ttlMinutes: number;
}
declare enum CacheStrategyType {
    LRU = "LRU",
    MRU = "MRU"
}
type CacheStrategy = keyof typeof CacheStrategyType;
interface CacheStatus {
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

interface DocumentScore {
    textScore: number;
    documentRank: number;
    termFrequency: number;
    inverseDocFreq: number;
}
interface TextScore {
    termFrequency: number;
    documentFrequency: number;
    score: number;
}
interface TextScore {
    termFrequency: number;
    documentFrequency: number;
    score: number;
}
interface ScoringMetrics {
    textScore: number;
    documentRank: number;
    termFrequency: number;
    inverseDocFreq: number;
}

interface PerformanceMetrics {
    avg: number;
    min: number;
    max: number;
    count: number;
}
interface PerformanceData {
    [key: string]: PerformanceMetrics;
}
interface PerformanceMetric {
    avg: number;
    min: number;
    max: number;
    count: number;
}
interface MetricsResult {
    [key: string]: PerformanceMetric;
}

interface OptimizationOptions {
    deduplication?: boolean;
    sorting?: boolean;
    compression?: boolean;
}
interface OptimizationResult<T> {
    data: T[];
    stats: {
        originalSize: number;
        optimizedSize: number;
        compressionRatio?: number;
    };
}

interface SerializedTrieNode {
    isEndOfWord: boolean;
    documentRefs: string[];
    weight: number;
    children: {
        [key: string]: SerializedTrieNode;
    };
}
interface SerializedState {
    trie: SerializedTrieNode;
    documents: [string, IndexedDocument][];
    documentLinks: [string, DocumentLink[]][];
}

interface QueryToken {
    type: 'operator' | 'modifier' | 'term';
    value: string;
    original: string;
    field?: string;
}

declare global {
    interface Window {
        NexusSearch: typeof NexusSearch;
    }
}

interface TrieSearchOptions {
    caseSensitive?: boolean;
    fuzzy?: boolean;
    maxDistance?: number;
}

declare class SearchError extends Error {
    constructor(message: string);
}
declare class IndexError extends Error {
    constructor(message: string);
}
declare function isSearchOptions(obj: unknown): obj is SearchOptions;
declare function isIndexConfig(obj: unknown): obj is IndexConfig;
declare function isSearchResult<T>(obj: unknown): obj is SearchResult<T>;
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

declare const NexusSearch: {
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

export { type AdvancedSearchOptions, type ArrayValue, type BaseEvent, type BaseFields, type CacheEntry, CacheError, type CacheOptions, type CacheStatus, type CacheStrategy, CacheStrategyType, ConfigError, type CreateDocumentOptions, type DatabaseConfig, type DocumentBase, type DocumentConfig, type DocumentContent, type DocumentLink, type DocumentMetadata, type DocumentRank, type DocumentRelation, type DocumentScore, type DocumentStatus, type DocumentValue, type DocumentVersion, type DocumentWorkflow, type ErrorEvent, type ExtendedSearchOptions, type IndexConfig, IndexError, type IndexNode, type IndexOptions, type IndexableFields, type IndexedDocument, type IndexedDocumentData, MapperError, type MapperOptions, type MapperState, type MetadataEntry, type MetricsResult, type NexusDocument, type NexusDocumentInput, type NexusDocumentMetadata, type NexusDocumentPluginConfig, type NexusFields, NexusSearch, type OptimizationOptions, type OptimizationResult, type PerformanceData, PerformanceError, type PerformanceMetric, type PerformanceMetrics, type PrimitiveValue, type QueryToken, type RegexSearchConfig, type RegexSearchResult, type RelationType, type ScoringMetrics, type Search, type SearchContext, type SearchDBSchema, type SearchEngineConfig, type SearchEngineOptions, SearchError, type SearchEvent, type SearchEventEmitter, SearchEventError, type SearchEventListener, type SearchEventType, type SearchMatch, type SearchNode, type SearchOptions, type SearchPagination, type SearchResult, type SearchScoreParams, type SearchStats, type SearchableDocument, type SearchableField, type SerializedIndex, type SerializedState, type SerializedTrieNode, type StorageConfig, type StorageEntry, StorageError, type StorageOptions, type SuccessEvent, type TextScore, type TokenInfo, type TrieSearchOptions, type ValidationConfig, ValidationError, type VersioningConfig, NexusSearch as default, isIndexConfig, isSearchOptions, isSearchResult };
