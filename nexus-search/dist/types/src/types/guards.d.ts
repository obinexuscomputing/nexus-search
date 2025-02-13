import { IndexConfig } from "./compactability";
import { SearchOptions, SearchResult } from "./search";
export declare function isSearchOptions(obj: unknown): obj is SearchOptions;
export declare function isIndexConfig(obj: unknown): obj is IndexConfig;
export declare function isSearchResult<T>(obj: unknown): obj is SearchResult<T>;
