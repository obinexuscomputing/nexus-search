import { DocumentLink as IDocumentLink } from '@/types';
/**
 * Implements a link/relationship between two documents
 */
export declare class DocumentLink implements IDocumentLink {
    readonly source: string;
    readonly target: string;
    readonly type: string;
    weight: number;
    url: string;
    /**
     * Create a new document link
     * @param source The source document ID
     * @param target The target document ID
     * @param type The type of relationship
     * @param weight Optional weight of the relationship (default: 1.0)
     * @param url Optional URL reference
     */
    constructor(source: string, target: string, type: string, weight?: number, url?: string);
    /**
     * Get the source document ID
     */
    fromId(fromId: string): string;
    /**
     * Get the target document ID
     */
    toId(toId: string): string;
    /**
     * Check if link is bidirectional based on type
     */
    isBidirectional(): boolean;
    /**
     * Update the weight of the link
     */
    setWeight(weight: number): void;
    /**
     * Update the URL reference
     */
    setUrl(url: string): void;
    /**
     * Check if this link connects two specific documents
     */
    connects(docId1: string, docId2: string): boolean;
    /**
     * Check if this link involves a specific document
     */
    involves(docId: string): boolean;
    /**
     * Get the other document ID in the relationship given one ID
     */
    getOtherId(docId: string): string;
    /**
     * Create a reversed version of this link
     */
    reverse(): DocumentLink;
    /**
     * Clone this link
     */
    clone(): DocumentLink;
    /**
     * Convert to a human-readable string
     */
    toString(): string;
    /**
     * Convert to a JSON object
     */
    toJSON(): object;
}
