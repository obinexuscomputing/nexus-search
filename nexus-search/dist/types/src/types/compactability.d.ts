export interface IndexOptions {
    caseSensitive?: boolean;
    stemming?: boolean;
    stopWords?: string[];
    minWordLength?: number;
    maxWordLength?: number;
    fuzzyThreshold?: number;
}
export interface IndexConfig {
    name: string;
    version: number;
    fields: string[];
    options?: IndexOptions;
}
