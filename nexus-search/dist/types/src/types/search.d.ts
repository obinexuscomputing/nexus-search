import { DocumentMetadata, DocumentValue, IndexConfig, IndexedDocument } from './document';
export interface SearchResult<T = unknown> {
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
export interface Search {
    search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}
export interface SearchOptions {
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
export interface SearchContext {
    query: string;
    options: SearchOptions;
    startTime: number;
    results: SearchResult[];
    stats: SearchStats;
}
export interface SearchStats {
    totalResults: number;
    searchTime: number;
    indexSize: number;
    queryComplexity: number;
}
export interface SearchableDocument {
    id: string;
    content: Record<string, DocumentValue>;
    metadata?: DocumentMetadata;
    [key: string]: unknown;
    version: string;
    indexed?: number;
}
export interface SearchableField {
    value: DocumentValue;
    weight?: number;
    metadata?: DocumentMetadata;
}
export interface SearchNode {
    id?: string;
    score: number;
    value?: DocumentValue;
    children: Map<string, SearchNode>;
    metadata?: DocumentMetadata;
}
export interface SearchScoreParams {
    term: string;
    documentId: string;
    options: SearchOptions;
}
export interface SearchMatch {
    field: string;
    value: string;
    indices: number[];
}
export interface SearchEngineOptions {
    fuzzyMatchingEnabled?: boolean;
    regexSearchEnabled?: boolean;
    maxSearchResults?: number;
    defaultThreshold?: number;
    defaultBoost?: Record<string, number>;
}
export interface SearchPagination {
    page: number;
    pageSize: number;
    totalPages: number;
    totalResults: number;
}
export interface SearchEngineConfig extends IndexConfig {
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
 * Enhanced regex search configuration
 */
export interface RegexSearchConfig {
    maxDepth?: number;
    timeoutMs?: number;
    caseSensitive?: boolean;
    wholeWord?: boolean;
}
/**
 * Search result with regex matching details
 */
export interface RegexSearchResult {
    id: string;
    score: number;
    matches: string[];
    path: string[];
    positions: Array<[number, number]>;
}
/**
 * Enhanced regex search configuration
 */
export interface RegexSearchConfig {
    maxDepth?: number;
    timeoutMs?: number;
    caseSensitive?: boolean;
    wholeWord?: boolean;
}
export interface ExtendedSearchOptions extends SearchOptions {
    regexConfig?: RegexSearchConfig;
}
