// src/constants/defaults.ts
import { SearchOptions } from '../types/search';

export const DEFAULT_SEARCH_OPTIONS: Required<SearchOptions> = {
    // Basic search options
    fuzzy: false,
    fields: [],
    boost: {}, // Empty object to satisfy Required type
    maxResults: 10,
    threshold: 0.5,

    // Sorting and pagination
    sortBy: 'score',
    sortOrder: 'desc',
    page: 1,
    pageSize: 10,

    // Advanced features
    highlight: false,

    // Result customization
    includeMatches: false,
    includeScore: false,
    includeStats: false,
    enableRegex: false,
    maxDistance: 0,
    regex: /./ // Simplified to just RegExp to fix type errors
    ,
    prefixMatch: false,
    minScore: 0,
    includePartial: false,
    caseSensitive: false
};

export const DEFAULT_INDEX_OPTIONS = {
    fields: []
};


// Helper function to merge options
export function mergeSearchOptions(
    options?: Partial<SearchOptions>
): Required<SearchOptions> {
    return {
        ...DEFAULT_SEARCH_OPTIONS,
        ...options,
        // Ensure boost is always an object
        boost: options?.boost || {}
    };
}

// Type guard for search options
export function isValidSearchOptions(options: unknown): options is SearchOptions {
    if (!options || typeof options !== 'object') return false;
    const opt = options as Partial<SearchOptions>;
    
    return (
        (opt.fuzzy === undefined || typeof opt.fuzzy === 'boolean') &&
        (opt.fields === undefined || Array.isArray(opt.fields)) &&
        (opt.boost === undefined || (typeof opt.boost === 'object' && opt.boost !== null)) &&
        (opt.maxResults === undefined || typeof opt.maxResults === 'number') &&
        (opt.threshold === undefined || typeof opt.threshold === 'number') &&
        (opt.sortBy === undefined || typeof opt.sortBy === 'string') &&
        (opt.sortOrder === undefined || ['asc', 'desc'].includes(opt.sortOrder)) &&
        (opt.page === undefined || typeof opt.page === 'number') &&
        (opt.pageSize === undefined || typeof opt.pageSize === 'number') &&
        (opt.regex === undefined || typeof opt.regex === 'string' || opt.regex instanceof RegExp) &&
        (opt.highlight === undefined || typeof opt.highlight === 'boolean') &&
        (opt.includeMatches === undefined || typeof opt.includeMatches === 'boolean') &&
        (opt.includeScore === undefined || typeof opt.includeScore === 'boolean') &&
        (opt.includeStats === undefined || typeof opt.includeStats === 'boolean')
    );
}