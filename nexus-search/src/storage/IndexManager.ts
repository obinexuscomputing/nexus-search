import { IndexMapper } from "@/mappers";
import { 
    IndexConfig, 
    SearchOptions, 
    SearchResult, 
    IndexedDocument, 
    SearchableDocument, 
    SerializedState,
} from "@/types";
import { SerializedIndex } from "@/types/core";
import { DocumentValue } from "@/types/document";
import { createSearchableFields } from "@/utils";

export class IndexManager {
    initialize(): void {
        this.documents = new Map();
        this.indexMapper = new IndexMapper();
        this.config = {
            name: "default",
            version: 1,
            fields: [
                "content",   // Document body/main text
                "title",     // Document title
                "metadata",  // Metadata information
                "author",    // Document author
                "tags",      // Associated tags
                "type"       // Document type
            ] // Comprehensive list of default fields
        };
    }
    importDocuments(documents: IndexedDocument[]): void {
        documents.forEach(doc => {
            this.documents.set(doc.id, doc);
        });
    }


   getSize(): number {
        return this.documents.size;
    }
    
    getAllDocuments(): Map<string, IndexedDocument> {
        return this.documents;
        
    }
    private indexMapper: IndexMapper;
    private config: IndexConfig;
    private documents: Map<string, IndexedDocument>;

    constructor(config: IndexConfig) {
        this.config = config;
        this.indexMapper = new IndexMapper();
        this.documents = new Map();
    }

    addDocument<T extends IndexedDocument>(document: T): void {
        const id = document.id || this.generateDocumentId(this.documents.size);
        this.documents.set(id, document);

        const contentRecord: Record<string, DocumentValue> = {};
        for (const field of this.config.fields) {
            if (field in document.fields) {
                contentRecord[field] = document.fields[field] as DocumentValue;
            }
        }

        const searchableDoc: SearchableDocument = {
            version: this.config.version.toString(),
            id,
            content: createSearchableFields({
                content: contentRecord,
                id,
                version: this.config.version.toString()
            }, this.config.fields),
            metadata: document.metadata
        };

        this.indexMapper.indexDocument(searchableDoc, id, this.config.fields);
    }

    getDocument(id: string): IndexedDocument | undefined {
        return this.documents.get(id);
    }

    

    exportIndex(): SerializedIndex {
        return {
            documents: Array.from(this.documents.entries()).map(([key, value]) => ({
                key,
                value: this.serializeDocument(value)
            })),
            indexState: this.indexMapper.exportState(),
            config: this.config
        };
    }

    importIndex(data: unknown): void {
        if (!this.isValidIndexData(data)) {
            throw new Error('Invalid index data format');
        }

        try {
            const typedData = data as SerializedIndex;
            this.documents = new Map(
                typedData.documents.map(item => [item.key, item.value])
            );
            this.config = typedData.config;
            this.indexMapper = new IndexMapper();
            
            if (this.isValidIndexState(typedData.indexState)) {
                this.indexMapper.importState({
                    trie: typedData.indexState.trie,
                    dataMap: typedData.indexState.dataMap
                });
            } else {
                throw new Error('Invalid index state format');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to import index: ${message}`);
        }
    }

   

    clear(): void {
        this.documents.clear();
        this.indexMapper = new IndexMapper();
    }

    private generateDocumentId(index: number): string {
        return `${this.config.name}-${index}-${Date.now()}`;
    }

    private isValidIndexData(data: unknown): data is SerializedIndex {
        if (!data || typeof data !== 'object') return false;
        
        const indexData = data as Partial<SerializedIndex>;
        return Boolean(
            indexData.documents &&
            Array.isArray(indexData.documents) &&
            indexData.indexState !== undefined &&
            indexData.config &&
            typeof indexData.config === 'object'
        );
    }

    private isValidIndexState(state: unknown): state is { trie: SerializedState; dataMap: Record<string, string[]> } {
        return (
            state !== null &&
            typeof state === 'object' &&
            'trie' in state &&
            'dataMap' in state
        );
    }

    private serializeDocument(doc: IndexedDocument): IndexedDocument {
        return JSON.parse(JSON.stringify(doc));
    }

    async addDocuments<T extends IndexedDocument>(documents: T[]): Promise<void> {
        for (const doc of documents) {
            // Use document's existing ID if available, otherwise generate new one
            const id = doc.id || this.generateDocumentId(this.documents.size);

            try {
                // Convert document fields to Record<string, DocumentValue>
                const contentRecord: Record<string, DocumentValue> = {};
                for (const field of this.config.fields) {
                    if (field in doc.fields) {
                        contentRecord[field] = doc.fields[field] as DocumentValue;
                    }
                }

                // Create searchable document
                const searchableDoc: SearchableDocument = {
                    id,
                    version: this.config.version.toString(),
                    content: createSearchableFields({
                        content: contentRecord,
                        id,
                        version: this.config.version.toString()
                    }, this.config.fields),
                    metadata: doc.metadata
                };

                // Store original document with ID
                this.documents.set(id, { ...doc, id });

                // Index the document
                await this.indexMapper.indexDocument(searchableDoc, id, this.config.fields);
            } catch (error) {
                console.warn(`Failed to index document ${id}:`, error);
            }
        }
    }

    async updateDocument<T extends IndexedDocument>(document: T): Promise<void> {
        const id = document.id;
        if (!this.documents.has(id)) {
            throw new Error(`Document ${id} not found`);
        }

        try {
            // Update the document in storage
            this.documents.set(id, document);

            // Convert fields for indexing
            const contentRecord: Record<string, DocumentValue> = {};
            for (const field of this.config.fields) {
                if (field in document.fields) {
                    contentRecord[field] = document.fields[field] as DocumentValue;
                }
            }

            // Create searchable document
            const searchableDoc: SearchableDocument = {
                id,
                version: this.config.version.toString(),
                content: createSearchableFields({
                    content: contentRecord,
                    id,
                    version: this.config.version.toString()
                }, this.config.fields),
                metadata: document.metadata
            };

            // Update the index
            await this.indexMapper.updateDocument(searchableDoc, id, this.config.fields);
        } catch (error) {
            console.error(`Failed to update document ${id}:`, error);
            throw error;
        }
    }

    async removeDocument(documentId: string): Promise<void> {
        try {
            if (this.documents.has(documentId)) {
                await this.indexMapper.removeDocument(documentId);
                this.documents.delete(documentId);
            }
        } catch (error) {
            console.error(`Failed to remove document ${documentId}:`, error);
            throw error;
        }
    }

    async search<T extends IndexedDocument>(
        query: string, 
        options: SearchOptions = {}
    ): Promise<SearchResult<T>[]> {
        // Handle null or undefined query
        if (!query?.trim()) return [];

        try {
            const searchResults = await this.indexMapper.search(query, {
                fuzzy: options.fuzzy ?? false,
                maxResults: options.maxResults ?? 10
            });

            return searchResults
                .filter(result => this.documents.has(result.item))
                .map(result => {
                    const item = this.documents.get(result.item) as T;
                    return {
                        id: item.id,
                        docId: item.id,
                        term: query,
                        document: item,
                        metadata: item.metadata,
                        item,
                        score: result.score,
                        matches: result.matches
                    };
                })
                .filter(result => result.score >= (options.threshold ?? 0.5));

        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    // Helper method for tests to check if a document exists
    hasDocument(id: string): boolean {
        return this.documents.has(id);
    }
}