import { 
    ConfigValidationResult,
    StorageConfig,
    IndexingConfig,
    SearchConfig,
    DocumentConfig,
    PluginConfig
} from './interfaces';

export function validateConfig(config: unknown): boolean {
    const result = validateConfigWithDetails(config);
    return result.valid;
}

export function validateConfigWithDetails(config: unknown): ConfigValidationResult {
    const errors: string[] = [];

    if (!config || typeof config !== 'object') {
        return {
            valid: false,
            errors: ['Configuration must be an object']
        };
    }

    const typedConfig = config as Record<string, unknown>;

    // Validate required fields
    if (!typedConfig.name || typeof typedConfig.name !== 'string') {
        errors.push('name is required and must be a string');
    }

    if (typeof typedConfig.version !== 'number') {
        errors.push('version is required and must be a number');
    }

    if (!Array.isArray(typedConfig.fields) || typedConfig.fields.length === 0) {
        errors.push('fields must be a