import { 
    DocumentContent,
    DocumentMetadata, 
    DocumentVersion,
    DocumentRelation,
    BaseFields,
    IndexedDocument as IIndexedDocument,
    IndexedDocumentData,
    DocumentBase,
    DocumentLink,
    DocumentRank
} from "@/types/document";


/**
 * Enhanced IndexedDocument implementation with proper type handling 
 * and versioning support
 */
export class IndexedDocument implements IIndexedDocument {
    // Removed unused methods
  
    readonly id: string;
    fields: BaseFields;
    metadata?: DocumentMetadata;
    versions: Array<DocumentVersion>;
    relations: Array<DocumentRelation>;
    content: DocumentContent;
    links?: DocumentLink[];
    ranks?: DocumentRank[];
    title: string = '';
    author: string = '';
    tags: string[] = [];
    version: string = '1.0';
    constructor(
        id: string,
        fields: BaseFields,
        metadata?: DocumentMetadata,
        versions: Array<DocumentVersion> = [],
        relations: Array<DocumentRelation> = []
    ) {
        this.id = id;
        this.fields = this.normalizeFields(fields);
        this.metadata = this.normalizeMetadata(metadata);
        this.versions = versions;
        this.relations = relations;
        this.content = this.normalizeContent(this.fields.content); // Add this line
    }
   
    /**
     * Implement required document() method from interface
     */
    document(): IIndexedDocument {
        return this;
    }

    /**
     * Implement required base() method from interface
     */
    base(): DocumentBase {
        return {
            id: this.id,
            title: this.fields.title,
            author: this.fields.author,
            tags: this.fields.tags,
            version: this.fields.version,
            versions: this.versions,
            relations: this.relations
        };
    }

    /**
     * Normalize document fields ensuring required fields exist
     */
    private normalizeFields(fields: BaseFields): BaseFields {
        const normalizedFields: BaseFields = {
            ...fields,
            title: fields.title || '',
            author: fields.author || '',
            tags: Array.isArray(fields.tags) ? [...fields.tags] : [],
            version: fields.version || '1.0'
        };

        return normalizedFields;
    }

    private normalizeContent(content: DocumentContent | string): DocumentContent {
        if (typeof content === 'string') {
            return { text: content };
        }
        return content || {};
    }

    /**
     * Normalize document metadata with timestamps
     */
    private normalizeMetadata(metadata?: DocumentMetadata): DocumentMetadata {
        const now = Date.now();
        return {
            indexed: now,
            lastModified: now,
            ...metadata
        };
    }

    /**
     * Create a deep clone of the document
     */
    clone(): IndexedDocument {
        return new IndexedDocument(
            this.id,
            JSON.parse(JSON.stringify(this.fields)),
            this.metadata ? { ...this.metadata } : undefined,
            this.versions.map(v => ({ ...v })),
            this.relations.map(r => ({ ...r }))
        );
    }

    /**
     * Update document fields and metadata
     */
    update(updates: Partial<IndexedDocumentData>): IndexedDocument {
        const updatedFields = { ...this.fields };
        const updatedMetadata = { 
            ...this.metadata,
            lastModified: Date.now()
        };

        if (updates.fields) {
            Object.entries(updates.fields).forEach(([key, value]) => {
                if (value !== undefined) {
                    (updatedFields as BaseFields)[key] = value;
                }
            });
        }

        if (updates.metadata) {
            Object.assign(updatedMetadata, updates.metadata);
        }

        return new IndexedDocument(
            this.id,
            updatedFields,
            updatedMetadata,
            updates.versions || this.versions,
            updates.relations || this.relations
        );
    }

    /**
     * Get a specific field value
     */
    getField<T extends keyof BaseFields>(field: T): BaseFields[T] {
        return this.fields[field];
    }

    /**
     * Set a specific field value
     */
    setField<T extends keyof BaseFields>(
        field: T,
        value: BaseFields[T]
    ): void {
        this.fields[field] = value;
        if (this.metadata) {
            this.metadata.lastModified = Date.now();
        }
        if (field === 'content') {
            this.content = value as DocumentContent;
        }
    }

    /**
     * Add a new version of the document
     */
    addVersion(version: Omit<DocumentVersion, 'version'>): void {
        const nextVersion = this.versions.length + 1;
        this.versions.push({
            ...version,
            version: nextVersion
        });
        this.fields.version = String(nextVersion);
        if (this.metadata) {
            this.metadata.lastModified = Date.now();
        }
    }

    /**
     * Add a relationship to another document
     */
    addRelation(relation: DocumentRelation): void {
        this.relations.push(relation);
        if (this.metadata) {
            this.metadata.lastModified = Date.now();
        }
    }

    /**
     * Convert to plain object representation
     */
    toObject(): IndexedDocumentData {
        return {
            id: this.id,
            fields: { ...this.fields },
            metadata: this.metadata ? { ...this.metadata } : undefined,
            versions: this.versions.map(v => ({ ...v })),
            relations: this.relations.map(r => ({ ...r })),
            title: this.fields.title,
            author: this.fields.author,
            tags: this.fields.tags,
            version: this.fields.version
        };
    }

    /**
     * Convert to JSON string
     */
    toJSON(): string {
        return JSON.stringify(this.toObject());
    }

    /**
     * Create string representation
     */
    toString(): string {
        return `IndexedDocument(${this.id})`;
    }

    /**
     * Create new document instance
     */
    static create(data: IndexedDocumentData): IndexedDocument {
        return new IndexedDocument(
            data.id,
            data.fields,
            data.metadata,
            data.versions,
            data.relations
        );
    }

    /**
     * Create from plain object
     */
    static fromObject(obj: Partial<IndexedDocumentData> & { 
        id: string; 
        fields: BaseFields;
    }): IndexedDocument {
        return IndexedDocument.create({
            id: obj.id,
            fields: obj.fields,
            metadata: obj.metadata,
            versions: obj.versions || [],
            relations: obj.relations || [],
            title: "",
            author: "",
            tags: [],
            version: ""
        });
    }

    /**
     * Create from raw data
     */
    static fromRawData(
        id: string,
        content: string | DocumentContent,
        metadata?: DocumentMetadata
    ): IndexedDocument {
        const fields: BaseFields = {
            title: "",
            content: typeof content === 'string' ? { text: content } : content,
            author: "",
            tags: [],
            version: "1.0"
        };

        return new IndexedDocument(id, fields, metadata);
    }
}


