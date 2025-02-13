import { 
    DocumentMetadata, 
    IndexedDocument,
    DocumentContent,
    DocumentVersion,
    DocumentRelation,
    RelationType,
    IndexableFields,
    PrimitiveValue,
    DocumentValue,
    DocumentLink,
    DocumentRank,
    DocumentBase
} from "@/types";

export class BaseDocument implements IndexedDocument {
    readonly id: string;
    fields: IndexableFields;
    metadata?: DocumentMetadata;
    versions: DocumentVersion[];
    relations: DocumentRelation[];
    content?: Record<string, DocumentValue>;
    links?: DocumentLink[];
    ranks?: DocumentRank[];

    // Required interface properties
    title: string;
    author: string;
    tags: string[];
    version: string;

    constructor(doc: Partial<BaseDocument>) {
        this.id = doc.id || this.generateId();
        this.title = doc.fields?.title || '';
        this.author = doc.fields?.author || '';
        this.tags = Array.isArray(doc.fields?.tags) ? [...doc.fields.tags] : [];
        this.version = doc.fields?.version || '1.0';
        
        this.fields = this.normalizeFields(doc.fields);
        this.metadata = this.normalizeMetadata(doc.metadata || {});
        this.versions = doc.versions || [];
        this.relations = this.normalizeRelations(doc.relations || []);
        this.content = doc.content;
        this.links = this.normalizeLinks(doc.links);
        this.ranks = this.normalizeRanks(doc.ranks);
    }

    base(): DocumentBase {
        return {
            id: this.id,
            title: this.title,
            author: this.author,
            version: this.version,
            metadata: this.metadata,
            versions: this.versions,
            relations: this.relations,
            tags: this.tags
        };
    }

    private generateId(): string {
        return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    private normalizeFields(fields?: Partial<IndexableFields>): IndexableFields {
        return {
            title: this.title,
            content: this.normalizeContent(fields?.content),
            author: this.author,
            tags: this.tags,
            version: this.version,
            modified: fields?.modified || new Date().toISOString(),
            ...fields
        };
    }

    private normalizeMetadata(metadata?: Partial<DocumentMetadata>): DocumentMetadata {
        const now = Date.now();
        return {
            indexed: metadata?.indexed ?? now,
            lastModified: metadata?.lastModified ?? now,
            ...metadata
        };
    }

    private normalizeContent(content: unknown): DocumentContent {
        if (!content) {
            return { text: '' };
        }

        if (typeof content === 'string') {
            return { text: content };
        }

        if (typeof content === 'object' && content !== null) {
            return this.normalizeContentObject(content as Record<string, unknown>);
        }

        return { text: String(content) };
    }

    private normalizeContentObject(obj: Record<string, unknown>): DocumentContent {
        const result: DocumentContent = {};
        
        for (const [key, value] of Object.entries(obj)) {
            if (value === null || value === undefined) {
                result[key] = null;
                continue;
            }

            if (typeof value === 'object') {
                if (Array.isArray(value)) {
                    result[key] = this.normalizePrimitiveArray(value);
                } else {
                    result[key] = this.normalizeContentObject(value as Record<string, unknown>);
                }
            } else {
                result[key] = this.normalizePrimitive(value);
            }
        }

        return result;
    }

    private normalizePrimitiveArray(arr: unknown[]): PrimitiveValue[] {
        return arr.map(v => this.normalizePrimitive(v));
    }

    private normalizePrimitive(value: unknown): PrimitiveValue {
        if (value === null) return null;
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return value;
        }
        return String(value);
    }


    private normalizeRelations(relations: Array<Partial<DocumentRelation>>): DocumentRelation[] {
        return relations.map(relation => ({
            sourceId: this.id,
            targetId: relation.targetId || '',
            type: this.normalizeRelationType(relation.type || 'reference'),
            metadata: relation.metadata
        }));
    }

    private normalizeLinks(links?: DocumentLink[]): DocumentLink[] | undefined {
        if (!links) return undefined;
        return links.map(link => ({
            fromId: link.fromId || this.id,
            toId: link.toId,
            weight: link.weight || 1,
            url: link.url || '',
            source: link.source || '',
            target: link.target || '',
            type: link.type || 'default'
        }));
    }

    private normalizeRanks(ranks?: DocumentRank[]): DocumentRank[] | undefined {
        if (!ranks) return undefined;
        return ranks.map(rank => ({
            id: rank.id || this.id,
            rank: rank.rank || 0,
            incomingLinks: rank.incomingLinks || 0,
            outgoingLinks: rank.outgoingLinks || 0,
            content: rank.content || {},
            metadata: rank.metadata
        }));
    }

    private normalizeRelationType(type: string): RelationType {
        const normalizedType = type.toLowerCase();
        switch (normalizedType) {
            case 'parent':
                return 'parent';
            case 'child':
                return 'child';
            case 'related':
                return 'related';
            default:
                return 'reference';
        }
    }

    document(): IndexedDocument {
        return this;
    }

    clone(): IndexedDocument {
        return new BaseDocument(this.toObject());
    }

    toObject(): IndexedDocument {
        return {
            id: this.id,
            title: this.title,
            author: this.author,
            tags: [...this.tags],
            version: this.version,
            fields: { ...this.fields },
            metadata: { ...this.metadata, lastModified: this.metadata?.lastModified ?? Date.now() },
            versions: [...this.versions],
            relations: [...this.relations],
            links: this.links ? [...this.links] : undefined,
            ranks: this.ranks ? [...this.ranks] : undefined,
            document: () => this,
            base: () => this.base()
        };
    }

    update(updates: Partial<IndexedDocument>): IndexedDocument {
        const now = Date.now();
        const updatedFields: Partial<IndexableFields> = updates.fields || {};

        if (updatedFields.content && !this.isContentEqual(updatedFields.content, this.fields.content)) {
            this.versions.push({
                version: Number(this.version),
                content: this.fields.content,
                modified: new Date(this.metadata?.lastModified || now),
                author: this.author
            });
        }

        return new BaseDocument({
            id: this.id,
            fields: {
                ...this.fields,
                ...updatedFields,
                version: updatedFields.content ? String(Number(this.version) + 1) : this.version,
                modified: new Date().toISOString()
            },
            versions: this.versions,
            relations: updates.relations || this.relations,
            metadata: {
                ...this.metadata,
                lastModified: now
            },
            content: (updates as Partial<BaseDocument>).content !== undefined ? (updates as Partial<BaseDocument>).content : this.content,
            links: updates.links,
            ranks: updates.ranks
        });
    }

    private isContentEqual(content1: DocumentContent, content2: DocumentContent): boolean {
        return JSON.stringify(content1) === JSON.stringify(content2);
    }
}