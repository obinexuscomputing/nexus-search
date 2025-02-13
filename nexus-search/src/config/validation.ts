import { 
    ConfigValidationResult,
    StorageConfig,
    IndexingConfig,
    SearchConfig,
    DocumentConfig,
    PluginConfig,
    StorageOptions,
    IndexOptions,
    SearchOptions,
    ValidationConfig,
    VersioningConfig
} from './interfaces';

export function validateConfigWithDetails(config: unknown): ConfigValidationResult {
    const errors: string[] = [];

    if (!config || typeof config !== 'object') {
        return {
            valid: false,
            errors: ['Configuration must be an object']
        };
    }

    const typedConfig = config as Record<string, unknown>;

    // Validate basic required fields
    if (!typedConfig.name || typeof typedConfig.name !== 'string') {
        errors.push('name is required and must be a string');
    }

    if (typeof typedConfig.version !== 'number') {
        errors.push('version is required and must be a number');
    }

    if (!Array.isArray(typedConfig.fields) || typedConfig.fields.length === 0) {
        errors.push('fields must be a non-empty array of strings');
    } else if (!typedConfig.fields.every(field => typeof field === 'string')) {
        errors.push('all fields must be strings');
    }

    // Validate storage configuration
    if (typedConfig.storage) {
        const storageErrors = validateStorageConfig(typedConfig.storage as StorageConfig);
        errors.push(...storageErrors);
    } else {
        errors.push('storage configuration is required');
    }

    // Validate indexing configuration
    if (typedConfig.indexing) {
        const indexingErrors = validateIndexingConfig(typedConfig.indexing as IndexingConfig);
        errors.push(...indexingErrors);
    } else {
        errors.push('indexing configuration is required');
    }

    // Validate search configuration
    if (typedConfig.search) {
        const searchErrors = validateSearchConfig(typedConfig.search as SearchConfig);
        errors.push(...searchErrors);
    } else {
        errors.push('search configuration is required');
    }

    // Validate optional document support configuration
    if (typedConfig.documentSupport) {
        const docErrors = validateDocumentConfig(typedConfig.documentSupport as DocumentConfig);
        errors.push(...docErrors);
    }

    // Validate optional plugins configuration
    if (typedConfig.plugins !== undefined) {
        if (!Array.isArray(typedConfig.plugins)) {
            errors.push('plugins must be an array');
        } else {
            typedConfig.plugins.forEach((plugin, index) => {
                const pluginErrors = validatePluginConfig(plugin as PluginConfig);
                errors.push(...pluginErrors.map(err => `Plugin ${index}: ${err}`));
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

function validateStorageConfig(storage: StorageConfig): string[] {
    const errors: string[] = [];

    if (!['memory', 'indexeddb'].includes(storage.type)) {
        errors.push('storage type must be either "memory" or "indexeddb"');
    }

    if (storage.maxSize !== undefined && (typeof storage.maxSize !== 'number' || storage.maxSize <= 0)) {
        errors.push('storage maxSize must be a positive number');
    }

    if (storage.ttl !== undefined && (typeof storage.ttl !== 'number' || storage.ttl <= 0)) {
        errors.push('storage ttl must be a positive number');
    }

    if (storage.options) {
        const optionsErrors = validateStorageOptions(storage.options);
        errors.push(...optionsErrors);
    }

    return errors;
}

function validateStorageOptions(options: StorageOptions): string[] {
    const errors: string[] = [];

    if (options.prefix !== undefined && typeof options.prefix !== 'string') {
        errors.push('storage prefix must be a string');
    }

    if (options.compression !== undefined && typeof options.compression !== 'boolean') {
        errors.push('storage compression must be a boolean');
    }

    if (options.encryption !== undefined && typeof options.encryption !== 'boolean') {
        errors.push('storage encryption must be a boolean');
    }

    if (options.backupEnabled !== undefined && typeof options.backupEnabled !== 'boolean') {
        errors.push('storage backupEnabled must be a boolean');
    }

    return errors;
}

function validateIndexingConfig(indexing: IndexingConfig): string[] {
    const errors: string[] = [];

    if (typeof indexing.enabled !== 'boolean') {
        errors.push('indexing enabled must be a boolean');
    }

    if (!Array.isArray(indexing.fields) || indexing.fields.length === 0) {
        errors.push('indexing fields must be a non-empty array of strings');
    } else if (!indexing.fields.every(field => typeof field === 'string')) {
        errors.push('all indexing fields must be strings');
    }

    if (indexing.options) {
        const optionsErrors = validateIndexOptions(indexing.options);
        errors.push(...optionsErrors);
    } else {
        errors.push('indexing options are required');
    }

    return errors;
}

function validateIndexOptions(options: IndexOptions): string[] {
    const errors: string[] = [];

    if (typeof options.tokenization !== 'boolean') {
        errors.push('indexing tokenization must be a boolean');
    }

    if (typeof options.caseSensitive !== 'boolean') {
        errors.push('indexing caseSensitive must be a boolean');
    }

    if (typeof options.stemming !== 'boolean') {
        errors.push('indexing stemming must be a boolean');
    }

    if (options.stopWords !== undefined && !Array.isArray(options.stopWords)) {
        errors.push('indexing stopWords must be an array of strings');
    }

    if (options.minWordLength !== undefined && 
        (typeof options.minWordLength !== 'number' || options.minWordLength < 1)) {
        errors.push('indexing minWordLength must be a positive number');
    }

    if (options.maxWordLength !== undefined && 
        (typeof options.maxWordLength !== 'number' || options.maxWordLength < 1)) {
        errors.push('indexing maxWordLength must be a positive number');
    }

    if (options.customTokenizer !== undefined && typeof options.customTokenizer !== 'function') {
        errors.push('indexing customTokenizer must be a function');
    }

    return errors;
}

function validateSearchConfig(search: SearchConfig): string[] {
    const errors: string[] = [];

    if (!search.defaultOptions) {
        errors.push('search defaultOptions are required');
    } else {
        const optionsErrors = validateSearchOptions(search.defaultOptions);
        errors.push(...optionsErrors);
    }

    if (search.fuzzy !== undefined && typeof search.fuzzy !== 'boolean') {
        errors.push('search fuzzy must be a boolean');
    }

    if (search.maxResults !== undefined && 
        (typeof search.maxResults !== 'number' || search.maxResults < 1)) {
        errors.push('search maxResults must be a positive number');
    }

    if (search.threshold !== undefined && 
        (typeof search.threshold !== 'number' || search.threshold < 0 || search.threshold > 1)) {
        errors.push('search threshold must be a number between 0 and 1');
    }

    if (search.boost !== undefined && 
        (typeof search.boost !== 'object' || 
        !Object.values(search.boost).every(v => typeof v === 'number'))) {
        errors.push('search boost must be an object with number values');
    }

    return errors;
}

function validateSearchOptions(options: SearchOptions): string[] {
    const errors: string[] = [];

    if (options.fuzzy !== undefined && typeof options.fuzzy !== 'boolean') {
        errors.push('searchOptions fuzzy must be a boolean');
    }

    if (options.maxDistance !== undefined && 
        (typeof options.maxDistance !== 'number' || options.maxDistance < 1)) {
        errors.push('searchOptions maxDistance must be a positive number');
    }

    if (options.includeMatches !== undefined && typeof options.includeMatches !== 'boolean') {
        errors.push('searchOptions includeMatches must be a boolean');
    }

    if (options.caseSensitive !== undefined && typeof options.caseSensitive !== 'boolean') {
        errors.push('searchOptions caseSensitive must be a boolean');
    }

    return errors;
}

function validateDocumentConfig(doc: DocumentConfig): string[] {
    const errors: string[] = [];

    if (typeof doc.enabled !== 'boolean') {
        errors.push('documentSupport enabled must be a boolean');
    }

    if (doc.versioning) {
        const versioningErrors = validateVersioningConfig(doc.versioning);
        errors.push(...versioningErrors);
    }

    if (doc.validation) {
        const validationErrors = validateValidationConfig(doc.validation);
        errors.push(...validationErrors);
    }

    if (doc.storage) {
        const storageErrors = validateStorageConfig(doc.storage);
        errors.push(...storageErrors);
    }

    return errors;
}

function validateVersioningConfig(versioning: VersioningConfig): string[] {
    const errors: string[] = [];

    if (typeof versioning.enabled !== 'boolean') {
        errors.push('versioning enabled must be a boolean');
    }

    if (versioning.maxVersions !== undefined && 
        (typeof versioning.maxVersions !== 'number' || versioning.maxVersions < 1)) {
        errors.push('versioning maxVersions must be a positive number');
    }

    if (versioning.strategy !== undefined && 
        !['simple', 'timestamp', 'semantic'].includes(versioning.strategy)) {
        errors.push('versioning strategy must be one of: simple, timestamp, semantic');
    }

    return errors;
}

function validateValidationConfig(validation: ValidationConfig): string[] {
    const errors: string[] = [];

    if (validation.required !== undefined) {
        if (!Array.isArray(validation.required)) {
            errors.push('validation required must be an array of strings');
        } else if (!validation.required.every(field => typeof field === 'string')) {
            errors.push('all validation required fields must be strings');
        }
    }

    if (validation.customValidators !== undefined && 
        (typeof validation.customValidators !== 'object' || 
        !Object.values(validation.customValidators).every(v => typeof v === 'function'))) {
        errors.push('validation customValidators must be an object with function values');
    }

    return errors;
}

function validatePluginConfig(plugin: PluginConfig): string[] {
    const errors: string[] = [];

    if (!plugin.name || typeof plugin.name !== 'string') {
        errors.push('plugin name is required and must be a string');
    }

    if (typeof plugin.enabled !== 'boolean') {
        errors.push('plugin enabled must be a boolean');
    }

    if (plugin.options !== undefined && typeof plugin.options !== 'object') {
        errors.push('plugin options must be an object');
    }

    return errors;
}

export function validateConfig(config: unknown): boolean {
    const result = validateConfigWithDetails(config);
    return result.valid;
}