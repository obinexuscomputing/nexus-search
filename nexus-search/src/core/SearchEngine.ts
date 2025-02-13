
import { CacheManager, IndexedDocument, SearchStorage } from "@/storage";

import {
    SearchOptions,
    SearchResult,
    SearchEngineConfig,
    SearchEventListener,
    SearchEvent,
    IndexNode,
    DocumentContent,
    DocumentStatus,
    ExtendedSearchOptions,
    RegexSearchConfig,
    RegexSearchResult,
    DocumentValue,

    
} from "@/types";
import { bfsRegexTraversal, dfsRegexTraversal, calculateScore, extractMatches } from "@/utils";
import { IndexManager } from "../storage/IndexManager";
import { QueryProcessor } from "./QueryProcessor";
import { TrieSearch } from "@/algorithms/trie";


export class SearchEngine {
   // Core components
   private readonly indexManager: IndexManager;
   private readonly queryProcessor: QueryProcessor;
   private readonly storage: SearchStorage;
   private readonly cache: CacheManager;
   private readonly trie: TrieSearch = new  TrieSearch();
   
   // Configuration and state
   private readonly config: SearchEngineConfig;
   private readonly documentSupport: boolean;
   private isInitialized = false;
   
   // Data structures
   private readonly documents: Map<string, IndexedDocument>;
   private readonly eventListeners: Set<SearchEventListener>;
   private readonly trieRoot: IndexNode;

   constructor(config: SearchEngineConfig) {
       // Validate config
       if (!config || !config.name) {
           throw new Error('Invalid search engine configuration');
       }

       // Initialize configuration
       this.config = {
           ...config,
           search: {
               ...config.search,
               defaultOptions: config.search?.defaultOptions || {}
           }
       };
       this.documentSupport = config.documentSupport?.enabled ?? false;

       // Initialize core components
       this.indexManager = new IndexManager({
           name: config.name,
           version: config.version,
           fields: config.fields,
           options: config.search?.defaultOptions
       });
       this.queryProcessor = new QueryProcessor();
       this.storage = new SearchStorage(config.storage);
       this.cache = new CacheManager();
    this.trie.clear();

       // Initialize data structures
       this.documents = new Map();
       this.eventListeners = new Set();
       this.trieRoot = { 
           id: '', 
           value: '', 
           score: 0, 
           children: new Map(), 
           depth: 0 
       };

       // Bind methods that need 'this' context
       this.search = this.search.bind(this);
       this.addDocument = this.addDocument.bind(this);
       this.removeDocument = this.removeDocument.bind(this);
   }

   /**
    * Initialize the search engine and its components
    */

   async initialize() {
       if (this.isInitialized) return;

       try {
           // Initialize storage
           await this.storage.initialize();

           // Initialize index manager
           this.indexManager.initialize();

           // Load existing indexes if any
           await this.loadExistingIndexes();

           this.isInitialized = true;

           // Emit initialization event
           this.emitEvent({
               type: 'engine:initialized',
               timestamp: Date.now()
           });
       } catch (error) {
           const errorMessage = error instanceof Error ? error.message : String(error);
           throw new Error(`Failed to initialize search engine: ${errorMessage}`);
       }
   }


   /**
    * Load existing indexes from storage
    */
   private async loadExistingIndexes(): Promise<void> {
       try {
           const storedIndex = await this.storage.getIndex(this.config.name);
           if (storedIndex) {
               this.indexManager.importIndex(storedIndex);
               const documents = this.indexManager.getAllDocuments();
               
               for (const [id, doc] of documents) {
                this.documents.set(id, doc as import("../storage/IndexedDocument").IndexedDocument);
                this.trie.addDocument(doc);
               }
           }
       } catch (error) {
           console.warn('Failed to load stored indexes:', error);
       }
   }

    private extractRegexMatches(
        doc: IndexedDocument,
        positions: Array<[number, number]>,
        options: SearchOptions
    ): string[] {
        const searchFields = options.fields || this.config.fields;
        const matches = new Set<string>();

        for (const field of searchFields) {
            const fieldContent = String(doc.fields[field] || '');
            for (const [start, end] of positions) {
                if (start >= 0 && end <= fieldContent.length) {
                    matches.add(fieldContent.slice(start, end));
                }
            }
        }

        return Array.from(matches);
    }

  

    async addDocument(document: IndexedDocument): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Normalize and validate document
        const normalizedDoc = this.normalizeDocument(document);
        if (!this.validateDocument(normalizedDoc)) {
            throw new Error(`Invalid document structure: ${document.id}`);
        }

        try {
            // Store the document
            this.documents.set(normalizedDoc.id, normalizedDoc);
            
            // Index the document
            // Convert links from string[] to DocumentLink[]
        const convertedDoc: IndexedDocument = new IndexedDocument(
            normalizedDoc.id,
            {
                ...normalizedDoc.fields,
                links: (normalizedDoc.links || []).map(link => link.url),
                ranks: (normalizedDoc.ranks || []).map(rank => ({
                    id: '',
                    rank: rank.rank,
                    source: '',
                    target: '',
                    fromId: () => '',
                    toId: () => '',
                    incomingLinks: 0,
                    outgoingLinks: 0,
                    content: {} as Record<string, unknown>
                })) as unknown as DocumentValue,
                content: this.normalizeContent(normalizedDoc.content),
            },
            normalizedDoc.metadata
        );
            this.indexManager.addDocument(convertedDoc);
            
        } catch (error) {
            throw new Error(`Failed to add document: ${error}`);
        }
    }

    async addDocuments(documents: IndexedDocument[]): Promise<void> {
        for (const doc of documents) {
            await this.addDocument(doc);
        }
    }

    async search<T>(query: string, options: SearchOptions = {}): Promise<SearchResult<T>[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!query.trim()) {
            return [];
        }

        const searchOptions = {
            ...this.config.search?.defaultOptions,
            ...options,
            fields: options.fields || this.config.fields
        };

        try {
            // Process the query
            const processedQuery = this.queryProcessor.process(query);
            if (!processedQuery) return [];

            // Get matching documents
            const searchResults = new Map<string, SearchResult<T>>();

            // Search through each field
            for (const field of searchOptions.fields) {
                for (const [docId, document] of this.documents) {
                    const score = calculateScore(document, processedQuery, field, {
                        fuzzy: searchOptions.fuzzy,
                        caseSensitive: searchOptions.caseSensitive,
                        fieldWeight: searchOptions.boost?.[field] || 1
                    });

                    if (score > 0) {
                        const existingResult = searchResults.get(docId);
                        if (!existingResult || score > existingResult.score) {
                            const matches = extractMatches(
                                document,
                                processedQuery,
                                [field],
                                {
                                    fuzzy: searchOptions.fuzzy,
                                    caseSensitive: searchOptions.caseSensitive
                                }
                            );

                            searchResults.set(docId, {
                                id: docId,
                                docId,
                                item: document as unknown as T,
                                score,
                                matches,
                                metadata: {
                                    ...document.metadata,
                                    lastAccessed: Date.now(),
                                    lastModified: document.metadata?.lastModified ?? Date.now()
                                },
                                document: document,
                                term: processedQuery
                            });
                        }
                    }
                }
            }

            // Sort and limit results
            let results = Array.from(searchResults.values())
                .sort((a, b) => b.score - a.score);

            if (searchOptions.maxResults) {
                results = results.slice(0, searchOptions.maxResults);
            }

            return results;
        } catch (error) {
            console.error('Search error:', error);
            throw new Error(`Search failed: ${error}`);
        }
    }

   

    private validateDocument(doc: IndexedDocument): boolean {
        return (
            typeof doc.id === 'string' &&
            doc.id.length > 0 &&
            typeof doc.fields === 'object' &&
            doc.fields !== null
        );
    }
    /**
     * Helper method to normalize document content
     */
    public normalizeContent(content: unknown): DocumentContent {
        if (!content) return {};
        if (typeof content === 'string') return { text: content };
        if (typeof content === 'object') return content as DocumentContent;
        return { value: String(content) };
    }

    /**
     * Helper method to normalize date strings
     */
    public normalizeDate(date: unknown): string | undefined {
        if (!date) return undefined;
        if (date instanceof Date) return date.toISOString();
        if (typeof date === 'string') return new Date(date).toISOString();
        if (typeof date === 'number') return new Date(date).toISOString();
        return undefined;
    }

    /**
     * Helper method to normalize document status
     */
    public normalizeStatus(status: unknown): DocumentStatus | undefined {
        if (!status) return undefined;
        const statusStr = String(status).toLowerCase();
        
        switch (statusStr) {
            case 'draft':
            case 'published':
            case 'archived':
                return statusStr as DocumentStatus;
            case 'active':
                return 'published';
            default:
                return 'draft';
        }
    }


    public normalizeDocument(doc: IndexedDocument): IndexedDocument {
        // Ensure doc has a fields object, defaulting to an empty object if not present
        const fields = doc.fields || {};
    
        // Create a new IndexedDocument with normalized and default values
        return new IndexedDocument(
            doc.id, // Preserve original ID
            {
                // Normalize core fields with defaults
                // Preserve other potential fields from the original document
                ...fields,

                // Additional fields with fallbacks
                links: doc.links as unknown as DocumentValue || [],
                ranks: doc.ranks as unknown as DocumentValue || [],
                
                // Ensure content is normalized
                body: fields.body || '', // Additional fallback for body
                type: fields.type || 'document' // Add a default type
            },
            {
                // Normalize metadata with defaults
                ...(doc.metadata || {}),
                indexed: doc.metadata?.indexed || Date.now(),
                lastModified: doc.metadata?.lastModified || Date.now(),
                
                // Preserve other metadata properties
                ...doc.metadata
            }
        );
    }
    
    public async updateDocument(document: IndexedDocument): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }
    
        // Normalize the document while preserving as much of the original structure as possible
        const normalizedDoc = this.normalizeDocument(document);
    
        // Validate the normalized document
        if (!this.validateDocument(normalizedDoc)) {
            throw new Error(`Invalid document structure: ${document.id}`);
        }
    
        // Handle versioning if enabled
        if (this.documentSupport && this.config.documentSupport?.versioning?.enabled) {
            await this.handleVersioning(normalizedDoc);
        }
    
        // Update documents, trie, and index manager
        this.documents.set(normalizedDoc.id, normalizedDoc);
        this.trie.addDocument(normalizedDoc);
        await this.indexManager.updateDocument(normalizedDoc);
    }


/**
 * Performs regex-based search using either BFS or DFS traversal
 */
public async performRegexSearch(
    query: string,
    options: ExtendedSearchOptions
): Promise<SearchResult<IndexedDocument>[]> {
    const regexConfig: RegexSearchConfig = {
        maxDepth: options.regexConfig?.maxDepth || 50,
        timeoutMs: options.regexConfig?.timeoutMs || 5000,
        caseSensitive: options.regexConfig?.caseSensitive || false,
        wholeWord: options.regexConfig?.wholeWord || false
    };

    const regex = this.createRegexFromOption(options.regex || '');

    // Determine search strategy based on regex complexity
    const regexResults = this.isComplexRegex(regex) ?
        dfsRegexTraversal(
            this.trieRoot,
            regex,
            options.maxResults || 10,
            regexConfig
        ) :
        bfsRegexTraversal(
            this.trieRoot,
            regex,
            options.maxResults || 10,
            regexConfig
        );

    // Map regex results to SearchResult format
    return regexResults.map(result => {
        const document = this.documents.get(result.id);
        if (!document) {
            throw new Error(`Document not found for id: ${result.id}`);
        }

        return {
            id: result.id,
            docId: result.id,
            term: result.matches[0] || query, // Use first match or query as term
            score: result.score,
            matches: result.matches,
            document: document,
            item: document,
            metadata: {
                ...document.metadata,
                lastAccessed: Date.now(),
                lastModified: document.metadata?.lastModified !== undefined ? document.metadata.lastModified : Date.now()
            }
        };
    }).filter(result => result.score >= (options.minScore || 0));
}



    public async performBasicSearch(
        searchTerms: string[],
        options: SearchOptions
    ): Promise<Array<{ id: string; score: number }>> {
        const results = new Map<string, { score: number; matches: Set<string> }>();
    
        for (const term of searchTerms) {
            const matches = options.fuzzy ?
                this.trie.fuzzySearch(term, options.maxDistance || 2) :
                this.trie.search(term);
    
            for (const match of matches) {
                const docId = match.docId;
                const current = results.get(docId) || { score: 0, matches: new Set<string>() };
                current.score += this.calculateTermScore(term, docId, options);
                current.matches.add(term);
                results.set(docId, current);
            }
        }
    
        return Array.from(results.entries())
            .map(([id, { score }]) => ({ id, score }))
            .sort((a, b) => b.score - a.score);
    }

    /**
 * Creates a RegExp object from various input types
 */
public createRegexFromOption(regexOption: string | RegExp | object): RegExp {
    if (regexOption instanceof RegExp) {
        return regexOption;
    }
    if (typeof regexOption === 'string') {
        return new RegExp(regexOption);
    }
    if (typeof regexOption === 'object' && regexOption !== null) {
        const pattern = typeof regexOption === 'object' && regexOption !== null && 'pattern' in regexOption ? (regexOption as { pattern: string }).pattern : '';
        const flags = typeof regexOption === 'object' && regexOption !== null && 'flags' in regexOption ? (regexOption as { flags: string }).flags : '';
        return new RegExp(pattern || '', flags || '');
    }
    return new RegExp('');
}


/**
 * Determines if a regex pattern is complex
 */
private isComplexRegex(regex: RegExp): boolean {
    const pattern = regex.source;
    return (
        pattern.includes('{') ||
        pattern.includes('+') ||
        pattern.includes('*') ||
        pattern.includes('?') ||
        pattern.includes('|') ||
        pattern.includes('(?') ||
        pattern.includes('[') ||
        pattern.length > 20  // Additional complexity check based on pattern length
    );
}

public async processSearchResults(
    results: RegexSearchResult[] | Array<{ id: string; score: number }>,
    options: SearchOptions
): Promise<SearchResult<IndexedDocument>[]> {
    const processedResults: SearchResult<IndexedDocument>[] = [];
    const now = Date.now();

    for (const result of results) {
        const doc = this.documents.get(result.id);
        if (!doc) continue;

        const searchResult: SearchResult<IndexedDocument> = {
            id: result.id,
            docId: result.id,
            item: doc,
            score: (result as { score: number }).score ? this.normalizeScore((result as { score: number }).score) : (result as { score: number }).score,
            matches: [],
            metadata: {
                indexed: doc.metadata?.indexed ?? now,
                lastModified: doc.metadata?.lastModified ?? now,
                lastAccessed: now,
                ...doc.metadata
            },
            document: doc,
            term: 'matched' in result ? String(result.matched) : '',
        };

        if (options.includeMatches) {
            if ('positions' in result) {
                // Handle regex search results
                searchResult.matches = this.extractRegexMatches(doc, result.positions as [number, number][], options);
            } else {
                // Handle basic search results
                searchResult.matches = this.extractMatches(doc, options);
            }
        }

        processedResults.push(searchResult);
    }

    return this.applyPagination(processedResults, options);

}
public getTrieState(): unknown {
        return this.trie.serializeState();
    }
    
   
    
    public async removeDocument(documentId: string): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.documents.has(documentId)) {
            throw new Error(`Document ${documentId} not found`);
        }

        try {
            this.documents.delete(documentId);
            this.trie.removeDocument(documentId);
            await this.indexManager.removeDocument(documentId);
            this.cache.clear();

            try {
                await this.storage.storeIndex(this.config.name, this.indexManager.exportIndex());
            } catch (storageError) {
                this.emitEvent({
                    type: 'storage:error',
                    timestamp: Date.now(),
                    error: storageError instanceof Error ? storageError : new Error(String(storageError))
                });
            }

            this.emitEvent({
                type: 'remove:complete',
                timestamp: Date.now(),
                data: { documentId }
            });
        } catch (error) {
            this.emitEvent({
                type: 'remove:error',
                timestamp: Date.now(),
                error: error instanceof Error ? error : new Error(String(error))
            });
            throw new Error(`Failed to remove document: ${error}`);
        }
    }

    public async clearIndex(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            await this.storage.clearIndices();
            this.documents.clear();
            this.trie.clear();
            this.indexManager.clear();
            this.cache.clear();

            this.emitEvent({
                type: 'index:clear',
                timestamp: Date.now()
            });
        } catch (error) {
            this.emitEvent({
                type: 'index:clear:error',
                timestamp: Date.now(),
                error: error instanceof Error ? error : new Error(String(error))
            });
            throw new Error(`Failed to clear index: ${error}`);
        }
    }

    private calculateTermScore(term: string, docId: string, options: SearchOptions): number {
        const doc = this.documents.get(docId);
        if (!doc) return 0;

        const searchFields = options.fields || this.config.fields;
        let score = 0;

        for (const field of searchFields) {
            const fieldContent = String(doc.fields[field] || '').toLowerCase();
            const fieldBoost = (options.boost?.[field] || 1);
            const termFrequency = (fieldContent.match(new RegExp(term, 'gi')) || []).length;
            score += termFrequency * fieldBoost;
        }

        return score;
    }

    private normalizeScore(score: number): number {
        return Math.min(Math.max(score / 100, 0), 1);
    }

    private extractMatches(doc: IndexedDocument, options: SearchOptions): string[] {
        const matches = new Set<string>();
        const searchFields = options.fields || this.config.fields;

        for (const field of searchFields) {
            const fieldContent = String(doc.fields[field] || '').toLowerCase();

            if (options.regex) {
                const regex = typeof options.regex === 'string' ?
                    new RegExp(options.regex, 'gi') :
                    new RegExp(options.regex.source, 'gi');

                const fieldMatches = fieldContent.match(regex) || [];
                fieldMatches.forEach(match => matches.add(match));
            }
        }

        return Array.from(matches);
    }

    private applyPagination(
        results: SearchResult<IndexedDocument>[],
        options: SearchOptions
    ): SearchResult<IndexedDocument>[] {
        const page = options.page || 1;
        const pageSize = options.pageSize || 10;
        const start = (page - 1) * pageSize;
        return results.slice(start, start + pageSize);
    }

 

    public async loadIndexes(): Promise<void> {
        try {
            const storedIndex = await this.storage.getIndex(this.config.name);
            if (storedIndex) {
                this.indexManager.importIndex(storedIndex);
                const indexedDocs = this.indexManager.getAllDocuments();
                for (const doc of indexedDocs) {
                    this.documents.set(doc[1].id, IndexedDocument.fromObject({
                        id: doc[1].id,
                        fields: {
                            title: doc[1].fields.title,
                            content: doc[1].fields.content,
                            author: doc[1].fields.author,
                            tags: doc[1].fields.tags,
                            version: doc[1].fields.version
                        },
                        metadata: doc[1].metadata
                    }));
                }
            }
        } catch (error) {
            console.warn('Failed to load stored index, starting fresh:', error);
        }
    }

    public generateCacheKey(query: string, options: SearchOptions): string {
        return `${this.config.name}-${query}-${JSON.stringify(options)}`;
    }

    public addEventListener(listener: SearchEventListener): void {
        this.eventListeners.add(listener);
    }

    public removeEventListener(listener: SearchEventListener): void {
        this.eventListeners.delete(listener);
    }

   /**
     * Emit search engine events
     */
   private emitEvent(event: SearchEvent): void {
    this.eventListeners.forEach(listener => {
        try {
            listener(event);
        } catch (error) {
            console.error('Error in event listener:', error);
        }
    });
}
    public async close(): Promise<void> {
        try {
            await this.storage.close();
            this.cache.clear();
            this.documents.clear();
            this.isInitialized = false;

            this.emitEvent({
                type: 'engine:closed',
                timestamp: Date.now()
            });
        } catch (error) {
            console.warn('Error during close:', error);
        }
    }

    public getIndexedDocumentCount(): number {
        return this.documents.size;
    }

  
    public async bulkUpdate(updates: Map<string, Partial<IndexedDocument>>): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const updatePromises: Promise<void>[] = [];

        for (const [id, update] of updates) {
            const existingDoc = this.documents.get(id);
            if (existingDoc) {
                const updatedDoc = new IndexedDocument(
                    id,
                    { ...existingDoc.fields, ...update.fields },
                    { ...existingDoc.metadata ?? {}, ...update.metadata, lastModified: update.metadata?.lastModified ?? existingDoc.metadata?.lastModified ?? Date.now() }
                );
                updatePromises.push(this.updateDocument(updatedDoc));
            }
        }

        try {
            await Promise.all(updatePromises);
            this.emitEvent({
                type: 'bulk:update:complete',
                timestamp: Date.now(),
                data: { updateCount: updates.size }
            });
        } catch (error) {
            this.emitEvent({
                type: 'bulk:update:error',
                timestamp: Date.now(),
                error: error instanceof Error ? error : new Error(String(error))
            });
            throw new Error(`Bulk update failed: ${error}`);
        }
    }

    public async importIndex(indexData: unknown): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            await this.clearIndex();
            this.indexManager.importIndex(indexData);

            const indexedDocuments = Array.from(this.documents.values()).map(doc => IndexedDocument.fromObject(doc));

            await this.addDocuments(indexedDocuments);

            this.emitEvent({
                type: 'import:complete',
                timestamp: Date.now(),
                data: { documentCount: this.documents.size }
            });
        } catch (error) {
            this.emitEvent({
                type: 'import:error',
                timestamp: Date.now(),
                error: error instanceof Error ? error : new Error(String(error))
            });
            throw new Error(`Import failed: ${error}`);
        }
    }

    public exportIndex(): unknown {
        if (!this.isInitialized) {
            throw new Error('Search engine not initialized');
        }
        return this.indexManager.exportIndex();
    }

    public getDocument(id: string): IndexedDocument | undefined {
        return this.documents.get(id);
    }

    public getAllDocuments(): IndexedDocument[] {
        return Array.from(this.documents.values());
    }

    public async reindexAll(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const documents = this.getAllDocuments();
            await this.clearIndex();
            await this.addDocuments(documents);

            this.emitEvent({
                type: 'reindex:complete',
                timestamp: Date.now(),
                data: { documentCount: documents.length }
            });
        } catch (error) {
            this.emitEvent({
                type: 'reindex:error',
                timestamp: Date.now(),
                error: error instanceof Error ? error : new Error(String(error))
            });
            throw new Error(`Reindex failed: ${error}`);
        }
    }

    public async optimizeIndex(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            // Trigger cache cleanup
            this.cache.clear();

            // Compact storage if possible
            if (this.storage instanceof SearchStorage) {
                await this.storage.clearIndices();
                await this.storage.storeIndex(
                    this.config.name,
                    this.indexManager.exportIndex()
                );
            }

            this.emitEvent({
                type: 'optimize:complete',
                timestamp: Date.now()
            });
        } catch (error) {
            this.emitEvent({
                type: 'optimize:error',
                timestamp: Date.now(),
                error: error instanceof Error ? error : new Error(String(error))
            });
            throw new Error(`Optimization failed: ${error}`);
        }
    }

    public  async handleVersioning(doc: IndexedDocument): Promise<void> {
        const existingDoc = this.getDocument(doc.id);
        if (!existingDoc) return;

        const maxVersions = this.config.documentSupport?.versioning?.maxVersions ?? 10;
        const versions = existingDoc.versions || [];

        if (doc.fields.content !== existingDoc.fields.content) {
            versions.push({
                version: Number(existingDoc.fields.version),
                content: existingDoc.fields.content,
                modified: new Date(existingDoc.fields.modified || Date.now()),
                author: existingDoc.fields.author
            });

            // Keep only the latest versions
            if (versions.length > maxVersions) {
                versions.splice(0, versions.length - maxVersions);
            }

            doc.versions = versions;
            doc.fields.version = String(Number(doc.fields.version) + 1);
        }
    }
 
    

    public async restoreVersion(id: string, version: number): Promise<void> {
        if (!this.documentSupport) {
            throw new Error('Document support is not enabled');
        }

        const doc = this.getDocument(id);
        if (!doc) {
            throw new Error(`Document ${id} not found`);
        }

        const targetVersion = await this.getDocumentVersion(id, version) as { content: string };
        if (!targetVersion) {
            throw new Error(`Version ${version} not found for document ${id}`);
        }

        const updatedDoc = new IndexedDocument(
            doc.id,
            {
                ...doc.fields,
                content: this.normalizeContent(targetVersion.content),
                modified: new Date().toISOString(),
                version: String(Number(doc.fields.version) + 1)
            },
            {
                ...doc.metadata,
                lastModified: Date.now()
            }
        );

        await this.updateDocument(updatedDoc);
    }

    // Additional NexusDocument specific methods that are only available when document support is enabled
    public async getDocumentVersion(id: string, version: number): Promise<unknown | undefined> {
        if (!this.documentSupport) {
            throw new Error('Document support is not enabled');
        }

        const doc = this.getDocument(id);
        return doc?.versions?.find(v => v.version === version);
    }


    public getStats(): {
        documentCount: number;
        indexSize: number;
        cacheSize: number;
        initialized: boolean;
    } {
        return {
            documentCount: this.documents.size,
            indexSize: this.indexManager.getSize(),
            cacheSize: this.cache.getSize(),
            initialized: this.isInitialized
        };
    }

    public isReady(): boolean {
        return this.isInitialized;
    }
}