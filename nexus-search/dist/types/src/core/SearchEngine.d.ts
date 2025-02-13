import { IndexedDocument } from "@/storage";
import { SearchOptions, SearchResult, SearchEngineConfig, SearchEventListener, DocumentContent, DocumentStatus, ExtendedSearchOptions, RegexSearchResult } from "@/types";
export declare class SearchEngine {
    private readonly indexManager;
    private readonly queryProcessor;
    private readonly storage;
    private readonly cache;
    private readonly trie;
    private readonly config;
    private readonly documentSupport;
    private isInitialized;
    private readonly documents;
    private readonly eventListeners;
    private readonly trieRoot;
    constructor(config: SearchEngineConfig);
    /**
     * Initialize the search engine and its components
     */
    initialize(): Promise<void>;
    /**
     * Load existing indexes from storage
     */
    private loadExistingIndexes;
    private extractRegexMatches;
    addDocument(document: IndexedDocument): Promise<void>;
    addDocuments(documents: IndexedDocument[]): Promise<void>;
    search<T>(query: string, options?: SearchOptions): Promise<SearchResult<T>[]>;
    private validateDocument;
    /**
     * Helper method to normalize document content
     */
    normalizeContent(content: unknown): DocumentContent;
    /**
     * Helper method to normalize date strings
     */
    normalizeDate(date: unknown): string | undefined;
    /**
     * Helper method to normalize document status
     */
    normalizeStatus(status: unknown): DocumentStatus | undefined;
    normalizeDocument(doc: IndexedDocument): IndexedDocument;
    updateDocument(document: IndexedDocument): Promise<void>;
    /**
     * Performs regex-based search using either BFS or DFS traversal
     */
    performRegexSearch(query: string, options: ExtendedSearchOptions): Promise<SearchResult<IndexedDocument>[]>;
    performBasicSearch(searchTerms: string[], options: SearchOptions): Promise<Array<{
        id: string;
        score: number;
    }>>;
    /**
 * Creates a RegExp object from various input types
 */
    createRegexFromOption(regexOption: string | RegExp | object): RegExp;
    /**
     * Determines if a regex pattern is complex
     */
    private isComplexRegex;
    processSearchResults(results: RegexSearchResult[] | Array<{
        id: string;
        score: number;
    }>, options: SearchOptions): Promise<SearchResult<IndexedDocument>[]>;
    getTrieState(): unknown;
    removeDocument(documentId: string): Promise<void>;
    clearIndex(): Promise<void>;
    private calculateTermScore;
    private normalizeScore;
    private extractMatches;
    private applyPagination;
    loadIndexes(): Promise<void>;
    generateCacheKey(query: string, options: SearchOptions): string;
    addEventListener(listener: SearchEventListener): void;
    removeEventListener(listener: SearchEventListener): void;
    /**
      * Emit search engine events
      */
    private emitEvent;
    close(): Promise<void>;
    getIndexedDocumentCount(): number;
    bulkUpdate(updates: Map<string, Partial<IndexedDocument>>): Promise<void>;
    importIndex(indexData: unknown): Promise<void>;
    exportIndex(): unknown;
    getDocument(id: string): IndexedDocument | undefined;
    getAllDocuments(): IndexedDocument[];
    reindexAll(): Promise<void>;
    optimizeIndex(): Promise<void>;
    handleVersioning(doc: IndexedDocument): Promise<void>;
    restoreVersion(id: string, version: number): Promise<void>;
    getDocumentVersion(id: string, version: number): Promise<unknown | undefined>;
    getStats(): {
        documentCount: number;
        indexSize: number;
        cacheSize: number;
        initialized: boolean;
    };
    isReady(): boolean;
}
