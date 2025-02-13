import { SearchOptions } from '../types/search';
export declare const DEFAULT_SEARCH_OPTIONS: Required<SearchOptions>;
export declare const DEFAULT_INDEX_OPTIONS: {
    fields: never[];
};
export declare function mergeSearchOptions(options?: Partial<SearchOptions>): Required<SearchOptions>;
export declare function isValidSearchOptions(options: unknown): options is SearchOptions;
