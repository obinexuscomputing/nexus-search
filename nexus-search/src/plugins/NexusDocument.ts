import { DocumentLink, SearchEngine } from "@/core";
import { 
    SearchOptions, 
    DocumentContent,
    IndexNode,
    NexusDocumentPluginConfig,
    NexusDocument as INexusDocument,
    SearchResult,
    RegexSearchConfig,
    NexusDocumentMetadata,
  
} from "@/types";

import { IndexedDocument } from "@/storage";
import { AlgoUtils } from "@/utils/AlgoUtils";
import { ScoringUtils } from "@/utils/ScoringUtils";
import { 
    bfsRegexTraversal, 
    dfsRegexTraversal,
    normalizeFieldValue 
} from "@/utils/SearchUtils";
import { PerformanceMonitor } from "@/utils/PerformanceUtils";

/**
 * Represents a searchable document in the Nexus system
 */
export interface NexusDocument extends INexusDocument {
    id: string;
    title: string;
    content: string;
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
export class NexusDocumentPlugin {
    private documents: Map<string, NexusDocument>;
    private searchEngine: SearchEngine;
    private performanceMonitor: PerformanceMonitor;
    private documentLinks: DocumentLink[];
    private root: IndexNode;

    /**
     * Initialize a new NexusDocument plugin
     * @param config Plugin configuration options
     */
    constructor(config?: NexusDocumentPluginConfig) {
        this.documents = new Map();
        this.documentLinks = [];
        this.performanceMonitor = new PerformanceMonitor();
        
        // Initialize search engine with default or provided config
        this.searchEngine = new SearchEngine({
            name: config?.name || 'nexus-document',
            version: config?.version || 1,
            fields: config?.fields || ['title', 'content', 'path', 'type'],
            storage: config?.storage || { type: 'memory' },
            indexing: {
                enabled: true,
                fields: ['title', 'content'],
                options: {
                    tokenization: true,
                    caseSensitive: false,
                    stemming: true
                }
            },
            searchFields: ['title', 'content'],
            metadataFields: ['path', 'type'],
            searchOptions: {
                fuzzy: true,
                maxResults: 10,
                includeMatches: true
            }
        });

        // Initialize root node for graph traversal
        this.root = {
            id: '',
            value: '',
            score: 0,
            depth: 0,
            children: new Map()
        };
    }

    /**
     * Add a document to the index
     * @param document Document to add
     */
    async addDocument(document: NexusDocument): Promise<void> {
        return await this.performanceMonitor.measure('addDocument', async () => {
            // Store original document
            this.documents.set(document.id, document);

            // Create indexed version
            const indexedDoc = new IndexedDocument(
                document.id,
                {
                    title: normalizeFieldValue(document.title),
                    content: document.content as unknown as DocumentContent,
                    author: document.metadata?.author as string || '',
                    tags: Array.isArray(document.metadata?.tags) ? document.metadata.tags : [],
                    version: document.metadata?.version as string || '1.0'
                },
                document.metadata
            );

            await this.searchEngine.addDocument(indexedDoc);
        });
    }

    /**
     * Add multiple documents to the index
     * @param documents Array of documents to add
     */
    async addDocuments(documents: NexusDocument[]): Promise<void> {
        for (const doc of documents) {
            await this.addDocument(doc);
        }
    }

    /**
     * Remove a document from the index
     * @param id Document ID to remove
     */
    async removeDocument(id: string): Promise<void> {
        await this.performanceMonitor.measure('removeDocument', async () => {
            this.documents.delete(id);
            await this.searchEngine.removeDocument(id);
            this.documentLinks = this.documentLinks.filter(
                link => link.source !== id && link.target !== id
            );
        });
    }

    /**
     * Perform a search across indexed documents
     * @param query Search query string
     * @param options Search options
     */
    async search(query: string, options: Partial<SearchOptions> = {}): Promise<SearchResult<NexusDocument>[]> {
        return await this.performanceMonitor.measure('search', async () => {
            const results = await this.searchEngine.search<NexusDocument>(query, {
                ...options,
                includeMatches: true
            });

            return results.map(result => ({
                ...result,
                item: {
                    ...(this.documents.get(result.item.id) ?? { id: result.item.id }),
                    score: result.score,
                    matches: result.matches
                }
            }));
        });
    }

    /**
     * Perform a breadth-first search
     * @param query Search query
     * @param config Optional regex search configuration
     */
    async bfsSearch(query: string, config?: RegexSearchConfig): Promise<NexusDocument | null> {
        const results = bfsRegexTraversal(
            this.root,
            query,
            1,
            {
                maxDepth: config?.maxDepth || 10,
                caseSensitive: config?.caseSensitive || false,
                wholeWord: config?.wholeWord || true,
                timeoutMs: config?.timeoutMs || 5000
            }
        );

        if (results.length === 0) return null;

        const doc = this.documents.get(results[0].id);
        return doc ? { ...doc, score: results[0].score } : null;
    }

    /**
     * Perform a depth-first search
     * @param query Search query
     * @param config Optional regex search configuration
     */
    async dfsSearch(query: string, config?: RegexSearchConfig): Promise<NexusDocument | null> {
        const results = dfsRegexTraversal(
            this.root,
            query,
            1,
            {
                maxDepth: config?.maxDepth || 10,
                caseSensitive: config?.caseSensitive || false,
                wholeWord: config?.wholeWord || true,
                timeoutMs: config?.timeoutMs || 5000
            }
        );

        if (results.length === 0) return null;

        const doc = this.documents.get(results[0].id);
        return doc ? { ...doc, score: results[0].score } : null;
    }

    /**
     * Create a link between two documents
     * @param fromId Source document ID
     * @param toId Target document ID
     * @param type Link type
     */
    async addDocumentLink(fromId: string, toId: string, type: string): Promise<void> {
        if (this.documents.has(fromId) && this.documents.has(toId)) {
            this.documentLinks.push(new DocumentLink(fromId, toId, type));
        }
    }

    /**
     * Perform ranked search using document relationships
     * @param query Search query
     */
    async searchWithRank(query: string): Promise<Array<NexusDocument & { rank: number }>> {
        const documentsMap = new Map(Array.from(this.documents.entries()));
        
        // Calculate document ranks based on links
        const documentRanks = ScoringUtils.calculateDocumentRanks(
            documentsMap,
            this.documentLinks
        );

        // Perform enhanced search with ranking
        const results = AlgoUtils.enhancedSearch(
            this.root,
            query,
            documentsMap as unknown as Map<string, IndexedDocument>,
            this.documentLinks
        );

        return results.map(result => {
            const doc = this.documents.get(result.id);
            if (!doc) return null;
            return {
                ...doc,
                score: result.score,
                rank: documentRanks.get(doc.id)?.rank || 0
            };
        }).filter(Boolean) as Array<NexusDocument & { rank: number }>;
    }

    /**
     * Get all indexed documents
     */
    getDocuments(): NexusDocument[] {
        return Array.from(this.documents.values());
    }

    /**
     * Get document by ID
     * @param id Document ID
     */
    getDocument(id: string): NexusDocument | undefined {
        return this.documents.get(id);
    }

    /**
     * Get all document links
     */
    getDocumentLinks(): DocumentLink[] {
        return [...this.documentLinks];
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics(): Record<string, unknown> {
        return this.performanceMonitor.getMetrics();
    }

    /**
     * Clear all documents and reset the plugin
     */
    async clear(): Promise<void> {
        this.documents.clear();
        this.documentLinks = [];
        await this.searchEngine.clearIndex();
        this.performanceMonitor.clear();
    }
}