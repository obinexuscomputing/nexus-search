import { 
    StorageConfig,
    IndexingConfig,
    SearchConfig,
    DocumentConfig,
    PluginConfig,
    ValidationConfig,
    VersioningConfig
} from './interfaces';

import { validateConfig } from './validation';
import { defaultConfig } from './defaults';

export class NexusSearchConfig {
    readonly name: string;
    readonly version: number;
    readonly fields: string[];
    readonly storage: StorageConfig;
    readonly indexing: IndexingConfig;
    readonly search: SearchConfig;
    readonly documentSupport?: DocumentConfig;
    readonly plugins?: PluginConfig[];

    constructor(config: Partial<NexusSearchConfig> = {}) {
        // Merge with defaults
        const mergedConfig = {
            ...defaultConfig,
            ...config
        };

        // Initialize required properties
        this.name = mergedConfig.name;
        this.version = mergedConfig.version;
        this.fields = [...mergedConfig.fields];
        
        // Initialize complex objects
        this.storage = {
            ...defaultConfig.storage,
            ...mergedConfig.storage
        };

        this.indexing = {
            ...defaultConfig.indexing,
            ...mergedConfig.indexing,
            options: {
                ...defaultConfig.indexing.options,
                ...mergedConfig.indexing?.options
            }
        };

        this.search = {
            ...defaultConfig.search,
            ...mergedConfig.search,
            defaultOptions: {
                ...defaultConfig.search.defaultOptions,
                ...mergedConfig.search?.defaultOptions
            }
        };

        // Optional configurations
        if (mergedConfig.documentSupport) {
            this.documentSupport = {
                ...defaultConfig.documentSupport,
                ...mergedConfig.documentSupport
            };
        }

        if (mergedConfig.plugins) {
            this.plugins = mergedConfig.plugins.map(plugin => ({
                ...plugin,
                enabled: plugin.enabled ?? true
            }));
        }

        // Validate the configuration
        if (!this.validate()) {
            throw new Error('Invalid configuration');
        }
    }

    /**
     * Validates the configuration
     */
    validate(): boolean {
        return validateConfig(this);
    }

    /**
     * Converts configuration to JSON
     */
    toJSON(): object {
        return {
            name: this.name,
            version: this.version,
            fields: this.fields,
            storage: this.storage,
            indexing: this.indexing,
            search: this.search,
            documentSupport: this.documentSupport,
            plugins: this.plugins
        };
    }

    /**
     * Creates configuration from JSON
     */
    static fromJSON(json: string | object): NexusSearchConfig {
        const config = typeof json === 'string' ? JSON.parse(json) : json;
        return new NexusSearchConfig(config);
    }

    /**
     * Creates configuration from file
     */
    static async fromFile(path: string): Promise<NexusSearchConfig> {
        try {
            const configModule = await import(path);
            return new NexusSearchConfig(configModule.default || configModule);
        } catch (error) {
            throw new Error(`Failed to load configuration from ${path}: ${error}`);
        }
    }

    /**
     * Merges multiple configurations
     */
    static merge(...configs: Partial<NexusSearchConfig>[]): NexusSearchConfig {
        return new NexusSearchConfig(
            configs.reduce((merged, config) => ({
                ...merged,
                ...config
            }), {})
        );
    }

    /**
     * Creates a development configuration
     */
    static createDevConfig(options: Partial<NexusSearchConfig> = {}): NexusSearchConfig {
        return new NexusSearchConfig({
            ...defaultConfig,
            storage: { type: 'memory' },
            indexing: { ...defaultConfig.indexing, enabled: true },
            search: { 
                ...defaultConfig.search,
                defaultOptions: { ...defaultConfig.search.defaultOptions, fuzzy: true }
            },
            ...options
        });
    }

    /**
     * Creates a production configuration
     */
    static createProdConfig(options: Partial<NexusSearchConfig> = {}): NexusSearchConfig {
        return new NexusSearchConfig({
            ...defaultConfig,
            storage: { type: 'indexeddb' },
            indexing: { ...defaultConfig.indexing, enabled: true },
            search: {
                ...defaultConfig.search,
                defaultOptions: { ...defaultConfig.search.defaultOptions, fuzzy: false }
            },
            ...options
        });
    }
}