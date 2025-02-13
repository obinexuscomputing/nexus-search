import { DocumentContent, DocumentMetadata, DocumentVersion, DocumentRelation, BaseFields, IndexedDocument as IIndexedDocument, IndexedDocumentData, DocumentBase, DocumentLink, DocumentRank } from "@/types/document";
/**
 * Enhanced IndexedDocument implementation with proper type handling
 * and versioning support
 */
export declare class IndexedDocument implements IIndexedDocument {
    readonly id: string;
    fields: BaseFields;
    metadata?: DocumentMetadata;
    versions: Array<DocumentVersion>;
    relations: Array<DocumentRelation>;
    content: DocumentContent;
    links?: DocumentLink[];
    ranks?: DocumentRank[];
    title: string;
    author: string;
    tags: string[];
    version: string;
    constructor(id: string, fields: BaseFields, metadata?: DocumentMetadata, versions?: Array<DocumentVersion>, relations?: Array<DocumentRelation>);
    /**
     * Implement required document() method from interface
     */
    document(): IIndexedDocument;
    /**
     * Implement required base() method from interface
     */
    base(): DocumentBase;
    /**
     * Normalize document fields ensuring required fields exist
     */
    private normalizeFields;
    private normalizeContent;
    /**
     * Normalize document metadata with timestamps
     */
    private normalizeMetadata;
    /**
     * Create a deep clone of the document
     */
    clone(): IndexedDocument;
    /**
     * Update document fields and metadata
     */
    update(updates: Partial<IndexedDocumentData>): IndexedDocument;
    /**
     * Get a specific field value
     */
    getField<T extends keyof BaseFields>(field: T): BaseFields[T];
    /**
     * Set a specific field value
     */
    setField<T extends keyof BaseFields>(field: T, value: BaseFields[T]): void;
    /**
     * Add a new version of the document
     */
    addVersion(version: Omit<DocumentVersion, 'version'>): void;
    /**
     * Add a relationship to another document
     */
    addRelation(relation: DocumentRelation): void;
    /**
     * Convert to plain object representation
     */
    toObject(): IndexedDocumentData;
    /**
     * Convert to JSON string
     */
    toJSON(): string;
    /**
     * Create string representation
     */
    toString(): string;
    /**
     * Create new document instance
     */
    static create(data: IndexedDocumentData): IndexedDocument;
    /**
     * Create from plain object
     */
    static fromObject(obj: Partial<IndexedDocumentData> & {
        id: string;
        fields: BaseFields;
    }): IndexedDocument;
    /**
     * Create from raw data
     */
    static fromRawData(id: string, content: string | DocumentContent, metadata?: DocumentMetadata): IndexedDocument;
}
