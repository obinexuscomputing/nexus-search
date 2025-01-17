import { SearchOptions, IndexConfig, SearchableDocument } from "@/types";
import { getNestedValue } from "./SearchUtils";

export function validateSearchOptions(options: SearchOptions): void {
    if (options.maxResults && options.maxResults < 1) {
        throw new Error('maxResults must be greater than 0');
    }
    if (options.threshold && (options.threshold < 0 || options.threshold > 1)) {
        throw new Error('threshold must be between 0 and 1');
    }
    if (options.fields && !Array.isArray(options.fields)) {
        throw new Error('fields must be an array');
    }
}

export function validateIndexConfig(config: IndexConfig): void {
    if (!config.name) {
        throw new Error('Index name is required');
    }
    if (!config.version || typeof config.version !== 'number') {
        throw new Error('Valid version number is required');
    }
    if (!Array.isArray(config.fields) || config.fields.length === 0) {
        throw new Error('At least one field must be specified for indexing');
    }
}

export function validateDocument(document: SearchableDocument, fields: string[]): boolean {
    return fields.every(field => {
        const value = getNestedValue(document.content, field);
        return value !== undefined;
    });
}