import { DocumentMetadata, DocumentValue, IndexConfig, IndexedDocument } from './document';

// Core search result interface with proper generic typing
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

// Search interface for implementation
export interface Search {
    search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}

// Enhanced search options with complete type safety
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
    regex?:string |  RegExp;  // Simplified to just RegExp to fix type errors
    highlight?: boolean;
    includeMatches?: boolean;
    includeScore?: boolean;
    includeStats?: boolean;
    prefixMatch?: boolean;
    minScore?: number;
    includePartial?: boolean;
    caseSensitive?: boolean;
}

// Search context with runtime information
export interface SearchContext {
    query: string;
    options: SearchOptions;
    startTime: number;
    results: SearchResult[];
    stats: SearchStats;
}

// Search statistics interface
export interface SearchStats {
    totalResults: number;
    searchTime: number;
    indexSize: number;
    queryComplexity: number;
}

// Document interface for indexing with improved typing
export interface SearchableDocument {
    id: string;
    content: Record<string, DocumentValue>;
    metadata?: DocumentMetadata;
    [key: string]: unknown;  // Changed any to unknown for better type safety
    version: string;
    indexed?: number;

}

// Field interface for indexing
export interface SearchableField {
    value: DocumentValue;
    weight?: number;
    metadata?: DocumentMetadata;
}

// Enhanced search node interface
export interface SearchNode {
    id?: string;
    score: number;
    value?: DocumentValue;
    children: Map<string, SearchNode>;
    metadata?: DocumentMetadata;
}

// Additional helper types for search functionality
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

// Export a type for search engine configuration
export interface SearchEngineOptions {
    fuzzyMatchingEnabled?: boolean;
    regexSearchEnabled?: boolean;
    maxSearchResults?: number;
    defaultThreshold?: number;
    defaultBoost?: Record<string, number>;
}

// Helper type for search results pagination
export interface SearchPagination {
    page: number;
    pageSize: number;
    totalPages: number;
    totalResults: number;
}


// Search engine configuration
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

