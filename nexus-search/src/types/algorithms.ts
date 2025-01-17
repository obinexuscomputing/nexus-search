export interface TrieNode<T = unknown> {
    isEndOfWord: boolean;
    documentRefs: unknown;
    weight: number;
    value: T;
    isEnd: boolean;
    children: Map<string, TrieNode<T>>;
}

export interface TrieSearchOptions {
    caseSensitive?: boolean;
    fuzzy?: boolean;
    maxDistance?: number;
}