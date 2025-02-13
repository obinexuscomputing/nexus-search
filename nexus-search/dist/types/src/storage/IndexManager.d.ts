import { IndexConfig, SearchOptions, SearchResult, IndexedDocument } from "@/types";
import { SerializedIndex } from "@/types/core";
export declare class IndexManager {
    initialize(): void;
    importDocuments(documents: IndexedDocument[]): void;
    getSize(): number;
    getAllDocuments(): Map<string, IndexedDocument>;
    private indexMapper;
    private config;
    private documents;
    constructor(config: IndexConfig);
    addDocument<T extends IndexedDocument>(document: T): void;
    getDocument(id: string): IndexedDocument | undefined;
    exportIndex(): SerializedIndex;
    importIndex(data: unknown): void;
    clear(): void;
    private generateDocumentId;
    private isValidIndexData;
    private isValidIndexState;
    private serializeDocument;
    addDocuments<T extends IndexedDocument>(documents: T[]): Promise<void>;
    updateDocument<T extends IndexedDocument>(document: T): Promise<void>;
    removeDocument(documentId: string): Promise<void>;
    search<T extends IndexedDocument>(query: string, options?: SearchOptions): Promise<SearchResult<T>[]>;
    hasDocument(id: string): boolean;
}
