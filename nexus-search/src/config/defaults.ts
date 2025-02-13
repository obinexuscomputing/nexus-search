import { 
    StorageConfig, 
    IndexingConfig, 
    SearchConfig, 
    DocumentConfig
} from '../interfaces';

export const defaultConfig = {
    name: 'default',
    version: 1,
    fields: ['field1', 'field2'],

    storage: {
        type: 'memory',
        options: {
            prefix: 'nexus',
            compression: false,
            encryption: false,
            backupEnabled: false
        },
        maxSize: 1000,
        ttl: 3600
    } as StorageConfig,

    indexing: {
        enabled: true,
        fields: ['title', 'content'],
        options: {
            tokenization: true,
            caseSensitive: false,
            stemming: true,
            stopWords: [
                'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for',
                'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on',
                'that', 'the', 'to', 'was', 'were', 'will', 'with'
            ],
            minWordLength: 2,
            maxWordLength: 50
        }
    } as IndexingConfig,

    search: {
        defaultOptions: {
            fuzzy: true,
            maxDistance: 2,
            includeMatches: true,
            caseSensitive: false,
            maxResults: 10,
            threshold: 0.5,
            enableRegex: false
        }
    } as SearchConfig,

    documentSupport: {
        enabled: true,
        versioning: {
            enabled: false,
            maxVersions: 10,
            strategy: 'simple'
        },
        validation: {
            required: ['title', 'content']
        },
        storage: {
            type: 'memory',
            options: {
                prefix: 'nexus-docs'
            }
        }
    } as DocumentConfig,

    plugins: []
};

// Environment-specific configurations
export const developmentConfig = {
    ...defaultConfig,
    storage: {
        ...defaultConfig.storage,
        type: 'memory'
    },
    indexing: {
        ...defaultConfig.indexing,
        options: {
            ...defaultConfig.indexing.options,
            stemming: false
        }
    }
};

export const productionConfig = {
    ...defaultConfig,
    storage: {
        ...defaultConfig.storage,
        type: 'indexeddb',
        options: {
            ...defaultConfig.storage.options,
            compression: true
        }
    }
};

// Feature-specific configurations
export const fullTextSearchConfig = {
    ...defaultConfig,
    indexing: {
        ...defaultConfig.indexing,
        options: {
            ...defaultConfig.indexing.options,
            stemming: true,
            stopWords: []
        }
    }
};

export const documentManagementConfig = {
    ...defaultConfig,
    documentSupport: {
        ...defaultConfig.documentSupport,
        enabled: true,
        versioning: {
            enabled: true,
            maxVersions: 5,
            strategy: 'timestamp'
        }
    }
};