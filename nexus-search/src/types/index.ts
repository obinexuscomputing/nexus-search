// Core types
export * from './search';
export * from './core';
export type * from './database';
export * from './errors';
export * from './events';
export * from './mapper';
export * from './storage';
export * from './cache';
export * from './scoring';
export * from './performance';
export * from './optimization';
export * from './state';
export * from './query';
export * from './compactability';
export * from './global';
export * from './document';
export * from './algorithms';
// Algorithm types
export * from './algorithms';

// Utility types
// export * from './utils'; 

// Export specific types for backwards compatibility
export type {
    // Search types
    SearchResult,
    SearchOptions,
    SearchContext,
    SearchStats,
    SearchableDocument,
    SearchableField,
    SearchNode
} from './search';

// Index and configuration types
export type {
    IndexConfig,
    IndexOptions
} from './compactability';

// Document types
export type {
    DocumentLink,
    DocumentRank,
    IndexedDocument,
    NexusDocument,
    DocumentBase,
    DocumentMetadata,
    DocumentRelation,
    DocumentVersion,
    DocumentValue,
    DocumentContent,
    DocumentStatus,


} from './document';

// Database types
export type {
    DatabaseConfig,
    SearchDBSchema,
    MetadataEntry
} from './database';

// Error types
export type {
    SearchError,
    IndexError,
    ValidationError,
    StorageError
} from './errors';

// Event types
export type {
    SearchEvent,
    SearchEventType,
    SearchEventListener
} from './events';

// Core processing types
export type {
    TokenInfo,
    IndexNode
} from './core';

// Mapper types
export type {
    MapperState,
    MapperOptions
} from './mapper';

// Storage types
export type {
    StorageEntry,
    StorageOptions
} from './storage';

// Cache types
export type {
    CacheEntry,
    CacheOptions
} from './cache';

// Scoring types
export type {
    TextScore,
    DocumentScore,
    ScoringMetrics
} from './scoring';

// Performance types
export type {
    PerformanceMetric,
    MetricsResult
} from './performance';

// Optimization types
export type {
    OptimizationOptions,
    OptimizationResult
} from './optimization';

// State types
export type {
    SerializedState,
    SerializedTrieNode
} from './state';

// Query types
export type {
    QueryToken
} from './query';