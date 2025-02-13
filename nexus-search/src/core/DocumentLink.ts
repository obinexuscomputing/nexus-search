import { DocumentLink as IDocumentLink } from '@/types';

/**
 * Implements a link/relationship between two documents
 */
export class DocumentLink implements IDocumentLink {
    public readonly source: string;
    public readonly target: string;
    public readonly type: string;
    public weight: number;
    public url: string;

    /**
     * Create a new document link
     * @param source The source document ID
     * @param target The target document ID
     * @param type The type of relationship
     * @param weight Optional weight of the relationship (default: 1.0)
     * @param url Optional URL reference
     */
    constructor(
        source: string,
        target: string, 
        type: string,
        weight = 1.0,
        url = ''
    ) {
        if (!source || !target) {
            throw new Error('Source and target IDs are required');
        }

        this.source = source;
        this.target = target;
        this.type = type;
        this.weight = weight;
        this.url = url;
    }

    /**
     * Get the source document ID
     */
    fromId(fromId: string): string {
        if (fromId === this.source) {
            return this.target;
        }
        if (fromId === this.target && this.isBidirectional()) {
            return this.source;
        }
        throw new Error(`Invalid fromId: ${fromId}`);
    }

    /**
     * Get the target document ID
     */
    toId(toId: string): string {
        if (toId === this.target) {
            return this.source;
        }
        if (toId === this.source && this.isBidirectional()) {
            return this.target;
        }
        throw new Error(`Invalid toId: ${toId}`);
    }

    /**
     * Check if link is bidirectional based on type
     */
    isBidirectional(): boolean {
        return ['reference', 'related'].includes(this.type.toLowerCase());
    }

    /**
     * Update the weight of the link
     */
    setWeight(weight: number): void {
        if (weight < 0) {
            throw new Error('Weight must be non-negative');
        }
        this.weight = weight;
    }

    /**
     * Update the URL reference
     */
    setUrl(url: string): void {
        this.url = url;
    }

    /**
     * Check if this link connects two specific documents
     */
    connects(docId1: string, docId2: string): boolean {
        return (
            (this.source === docId1 && this.target === docId2) ||
            (this.isBidirectional() && this.source === docId2 && this.target === docId1)
        );
    }

    /**
     * Check if this link involves a specific document
     */
    involves(docId: string): boolean {
        return this.source === docId || this.target === docId;
    }

    /**
     * Get the other document ID in the relationship given one ID
     */
    getOtherId(docId: string): string {
        if (this.source === docId) {
            return this.target;
        }
        if (this.target === docId && this.isBidirectional()) {
            return this.source;
        }
        throw new Error(`Document ${docId} is not part of this link`);
    }

    /**
     * Create a reversed version of this link
     */
    reverse(): DocumentLink {
        if (!this.isBidirectional()) {
            throw new Error('Cannot reverse a directional link');
        }
        return new DocumentLink(
            this.target,
            this.source,
            this.type,
            this.weight,
            this.url
        );
    }

    /**
     * Clone this link
     */
    clone(): DocumentLink {
        return new DocumentLink(
            this.source,
            this.target,
            this.type,
            this.weight,
            this.url
        );
    }

    /**
     * Convert to a human-readable string
     */
    toString(): string {
        return `${this.source} -[${this.type}/${this.weight}]-> ${this.target}`;
    }

    /**
     * Convert to a JSON object
     */
    toJSON(): object {
        return {
            source: this.source,
            target: this.target,
            type: this.type,
            weight: this.weight,
            url: this.url
        };
    }
}