import { IndexConfig, IndexedDocument } from ".";
export interface MapperState {
    trie: unknown;
    dataMap: Record<string, string[]>;
    documents: Array<{
        key: string;
        value: IndexedDocument;
    }>;
    config: IndexConfig;
}
export interface MapperOptions {
    caseSensitive?: boolean;
    normalization?: boolean;
}
