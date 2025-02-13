import { StorageConfig, IndexingConfig, SearchConfig, DocumentConfig, PluginConfig } from './interfaces';
export declare class NexusSearchConfig {
    readonly name: string;
    readonly version: number;
    readonly fields: string[];
    readonly storage: StorageConfig;
    readonly indexing: IndexingConfig;
    readonly search: SearchConfig;
    readonly documentSupport?: DocumentConfig;
    readonly plugins?: PluginConfig[];
    constructor(config?: Partial<NexusSearchConfig>);
    /**
     * Validates the configuration
     */
    validate(): boolean;
    /**
     * Converts configuration to JSON
     */
    toJSON(): object;
    /**
     * Creates configuration from JSON
     */
    static fromJSON(json: string | object): NexusSearchConfig;
    /**
     * Creates configuration from file
     */
    static fromFile(path: string): Promise<NexusSearchConfig>;
    /**
     * Merges multiple configurations
     */
    static merge(...configs: Partial<NexusSearchConfig>[]): NexusSearchConfig;
    /**
     * Creates a development configuration
     */
    static createDevConfig(options?: Partial<NexusSearchConfig>): NexusSearchConfig;
    /**
     * Creates a production configuration
     */
    static createProdConfig(options?: Partial<NexusSearchConfig>): NexusSearchConfig;
}
