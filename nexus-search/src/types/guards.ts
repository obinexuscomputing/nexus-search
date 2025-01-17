import { IndexConfig } from "./compactability";
import { SearchOptions, SearchResult } from "./search";

export function isSearchOptions(obj: unknown): obj is SearchOptions {
  return typeof obj === 'object' && obj !== null &&
      (typeof (obj as any).fuzzy === 'undefined' || typeof (obj as any).fuzzy === 'boolean') &&
      (typeof (obj as any).maxResults === 'undefined' || typeof (obj as any).maxResults === 'number');
}

export function isIndexConfig(obj: unknown): obj is IndexConfig {
  return typeof obj === 'object' && obj !== null &&
      typeof (obj as any).name === 'string' &&
      typeof (obj as any).version === 'number' &&
      Array.isArray((obj as any).fields);
}

export function isSearchResult<T>(obj: unknown): obj is SearchResult<T> {
  return (
      typeof obj === 'object' &&
      obj !== null &&
      'item' in obj &&
      typeof (obj as any).score === 'number' &&
      Array.isArray((obj as any).matches)
  );
}

  

  