import { StorageConfig, IndexingConfig, SearchConfig, DocumentConfig } from './interfaces';
export declare const defaultConfig: {
    name: string;
    version: number;
    fields: string[];
    storage: StorageConfig;
    indexing: IndexingConfig;
    search: SearchConfig;
    documentSupport: DocumentConfig;
    plugins: never[];
};
export declare const developmentConfig: {
    storage: {
        type: string;
        options?: import("./interfaces").StorageOptions;
        maxSize?: number;
        ttl?: number;
    };
    indexing: {
        options: {
            stemming: boolean;
            tokenization: boolean;
            caseSensitive: boolean;
            stopWords?: string[];
            minWordLength?: number;
            maxWordLength?: number;
            customTokenizer?: (text: string) => string[];
        };
        enabled: boolean;
        fields: string[];
    };
    name: string;
    version: number;
    fields: string[];
    search: SearchConfig;
    documentSupport: DocumentConfig;
    plugins: never[];
};
export declare const productionConfig: {
    storage: {
        type: string;
        options: {
            compression: boolean;
            prefix?: string;
            encryption?: boolean;
            backupEnabled?: boolean;
        };
        maxSize?: number;
        ttl?: number;
    };
    name: string;
    version: number;
    fields: string[];
    indexing: IndexingConfig;
    search: SearchConfig;
    documentSupport: DocumentConfig;
    plugins: never[];
};
export declare const fullTextSearchConfig: {
    indexing: {
        options: {
            stemming: boolean;
            stopWords: never[];
            tokenization: boolean;
            caseSensitive: boolean;
            minWordLength?: number;
            maxWordLength?: number;
            customTokenizer?: (text: string) => string[];
        };
        enabled: boolean;
        fields: string[];
    };
    name: string;
    version: number;
    fields: string[];
    storage: StorageConfig;
    search: SearchConfig;
    documentSupport: DocumentConfig;
    plugins: never[];
};
export declare const documentManagementConfig: {
    documentSupport: {
        enabled: boolean;
        versioning: {
            enabled: boolean;
            maxVersions: number;
            strategy: string;
        };
        validation?: import("./interfaces").ValidationConfig;
        storage?: StorageConfig;
    };
    name: string;
    version: number;
    fields: string[];
    storage: StorageConfig;
    indexing: IndexingConfig;
    search: SearchConfig;
    plugins: never[];
};
