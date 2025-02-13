import { DocumentLink } from "@/core";
import { SearchOptions, NexusDocumentPluginConfig, NexusDocument as INexusDocument, SearchResult, RegexSearchConfig, NexusDocumentMetadata } from "@/types";
/**
 * Represents a searchable document in the Nexus system
 */
export interface NexusDocument extends INexusDocument {
    id: string;
    title: string;
    content: string | {
        text: string;
    };
    path: string;
    type: string;
    metadata?: NexusDocumentMetadata;
    score?: number;
    matches?: string[];
    rank?: number;
}
/**
 * NexusDocument Plugin - Provides advanced document search and management capabilities
 *
 * Features:
 * - Document indexing and storage
 * - Full-text search with fuzzy matching
 * - BFS and DFS search algorithms
 * - Document ranking and scoring
 * - Performance monitoring
 * - Document linking
 */
export declare class NexusDocumentPlugin {
    private documents;
    private searchEngine;
    private performanceMonitor;
    private documentLinks;
    private root;
    /**
     * Initialize a new NexusDocument plugin
     * @param config Plugin configuration options
     */
    constructor(config?: NexusDocumentPluginConfig);
    /**
     * Add a document to the index
     * @param document Document to add
     */
    addDocument(document: NexusDocument): Promise<void>;
    /**
     * Add multiple documents to the index
     * @param documents Array of documents to add
     */
    addDocuments(documents: NexusDocument[]): Promise<void>;
    /**
     * Remove a document from the index
     * @param id Document ID to remove
     */
    removeDocument(id: string): Promise<void>;
    /**
     * Perform a search across indexed documents
     * @param query Search query string
     * @param options Search options
     */
    search(query: string, options?: Partial<SearchOptions>): Promise<SearchResult<NexusDocument>[]>;
    /**
     * Perform a breadth-first search
     * @param query Search query
     * @param config Optional regex search configuration
     */
    bfsSearch(query: string, config?: RegexSearchConfig): Promise<NexusDocument | null>;
    /**
     * Perform a depth-first search
     * @param query Search query
     * @param config Optional regex search configuration
     */
    dfsSearch(query: string, config?: RegexSearchConfig): Promise<NexusDocument | null>;
    /**
     * Create a link between two documents
     * @param fromId Source document ID
     * @param toId Target document ID
     * @param type Link type
     */
    addDocumentLink(fromId: string, toId: string, type: string): Promise<void>;
    /**
     * Perform ranked search using document relationships
     * @param query Search query
     */
    searchWithRank(query: string): Promise<Array<NexusDocument & {
        rank: number;
    }>>;
    /**
     * Get all indexed documents
     */
    getDocuments(): NexusDocument[];
    /**
     * Get document by ID
     * @param id Document ID
     */
    getDocument(id: string): NexusDocument | undefined;
    /**
     * Get all document links
     */
    getDocumentLinks(): DocumentLink[];
    /**
     * Get performance metrics
     */
    getPerformanceMetrics(): Record<string, unknown>;
    /**
     * Clear all documents and reset the plugin
     */
    clear(): Promise<void>;
}
