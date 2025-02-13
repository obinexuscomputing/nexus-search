export interface StorageConfig {
    type: 'memory' | 'indexeddb';
    options?: StorageOptions;
    maxSize?: number;
    ttl?: number;
}
export interface StorageOptions {
    prefix?: string;
    compression?: boolean;
    encryption?: boolean;
    backupEnabled?: boolean;
}
export interface IndexingConfig {
    enabled: boolean;
    fields: string[];
    options: IndexOptions;
}
export interface IndexOptions {
    tokenization: boolean;
    caseSensitive: boolean;
    stemming: boolean;
    stopWords?: string[];
    minWordLength?: number;
    maxWordLength?: number;
    customTokenizer?: (text: string) => string[];
}
export interface SearchConfig {
    defaultOptions: SearchOptions;
    fuzzy?: boolean;
    maxResults?: number;
    threshold?: number;
    boost?: Record<string, number>;
}
export interface SearchOptions {
    fuzzy?: boolean;
    maxDistance?: number;
    includeMatches?: boolean;
    caseSensitive?: boolean;
    boost?: Record<string, number>;
    fields?: string[];
    maxResults?: number;
    threshold?: number;
    enableRegex?: boolean;
    regex?: string | RegExp;
}
export interface DocumentConfig {
    enabled: boolean;
    versioning?: VersioningConfig;
    validation?: ValidationConfig;
    storage?: StorageConfig;
}
export interface PluginConfig {
    name: string;
    enabled: boolean;
    options?: Record<string, unknown>;
}
export interface ValidationConfig {
    required?: string[];
    customValidators?: Record<string, (value: unknown) => boolean>;
}
export interface VersioningConfig {
    enabled: boolean;
    maxVersions?: number;
    strategy?: 'simple' | 'timestamp' | 'semantic';
}
export interface ConfigValidationResult {
    valid: boolean;
    errors: string[];
}
