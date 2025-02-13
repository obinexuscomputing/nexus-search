import { SearchOptions } from "./search";
export type PrimitiveValue = string | number | boolean | null;
export type ArrayValue = PrimitiveValue[];
export type DocumentValue = PrimitiveValue | ArrayValue | Record<string, unknown>;
export type DocumentContent = {
    [key: string]: DocumentValue | DocumentContent;
};
export interface DocumentMetadata {
    indexed?: number;
    lastModified?: number;
    [key: string]: unknown;
}
export interface NexusDocumentMetadata extends DocumentMetadata {
    indexed: number;
    lastModified: number;
    checksum?: string;
    permissions?: string[];
    workflow?: DocumentWorkflow;
}
export interface BaseFields {
    title: string;
    content: DocumentContent;
    author: string;
    tags: string[];
    version: string;
    modified?: string;
    [key: string]: DocumentValue | undefined;
}
export interface IndexableFields extends BaseFields {
    content: DocumentContent;
}
export interface NexusFields extends IndexableFields {
    type: string;
    category?: string;
    created: string;
    status: DocumentStatus;
    locale?: string;
}
export interface IndexConfig {
    name: string;
    fields: string[];
    searchFields: string[];
    metadataFields: string[];
    searchOptions: SearchOptions;
}
export interface DocumentBase {
    id: string;
    metadata?: DocumentMetadata;
    versions: DocumentVersion[];
    relations: DocumentRelation[];
    title: string;
    author: string;
    tags: string[];
    version: string;
}
export interface IndexedDocument extends DocumentBase {
    fields: IndexableFields;
    metadata?: DocumentMetadata;
    links?: DocumentLink[];
    ranks?: DocumentRank[];
    versions: DocumentVersion[];
    relations: DocumentRelation[];
    document(): IndexedDocument;
    base(): DocumentBase;
}
export interface SearchableDocument extends DocumentBase {
    content: Record<string, DocumentValue>;
}
export interface IndexedDocumentData extends DocumentBase {
    fields: BaseFields;
    metadata?: DocumentMetadata;
    versions: Array<DocumentVersion>;
    relations: Array<DocumentRelation>;
}
export interface DocumentLink {
    weight: number;
    url: string;
    source: string;
    target: string;
    fromId(fromId: string): string;
    toId(toId: string): string;
    type: string;
}
export interface DocumentRelation {
    sourceId: string;
    targetId: string;
    type: RelationType;
    metadata?: Record<string, unknown>;
}
export interface DocumentVersion {
    version: number;
    content: DocumentContent;
    modified: Date;
    author: string;
    changelog?: string;
}
export interface DocumentRank {
    id: string;
    rank: number;
    incomingLinks: number;
    outgoingLinks: number;
    content: Record<string, unknown>;
    metadata?: DocumentMetadata;
}
export interface DocumentWorkflow {
    status: string;
    assignee?: string;
    dueDate?: string;
}
export interface DocumentConfig {
    fields?: string[];
    storage?: StorageConfig;
    versioning?: VersioningConfig;
    validation?: ValidationConfig;
}
export interface StorageConfig {
    type: 'memory' | 'indexeddb';
    options?: Record<string, unknown>;
}
export interface VersioningConfig {
    enabled: boolean;
    maxVersions?: number;
}
export interface ValidationConfig {
    required?: string[];
    customValidators?: Record<string, (value: unknown) => boolean>;
}
export interface CreateDocumentOptions {
    title: string;
    content: DocumentContent;
    type: string;
    tags?: string[];
    category?: string;
    author: string;
    status?: DocumentStatus;
    locale?: string;
    metadata?: Partial<NexusDocumentMetadata>;
}
export interface AdvancedSearchOptions extends SearchOptions {
    filters?: SearchFilters;
    sort?: SortConfig;
}
export type DocumentStatus = 'draft' | 'published' | 'archived';
export type RelationType = 'reference' | 'parent' | 'child' | 'related';
interface SearchFilters {
    status?: DocumentStatus[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    categories?: string[];
    types?: string[];
    authors?: string[];
}
interface SortConfig {
    field: keyof NexusFields;
    order: 'asc' | 'desc';
}
export interface NexusDocument extends IndexedDocument {
    fields: NexusFields;
    metadata?: NexusDocumentMetadata;
    links?: DocumentLink[];
    ranks?: DocumentRank[];
    document(): NexusDocument;
}
export interface NexusDocumentInput extends Partial<NexusDocument> {
    id?: string;
    content?: DocumentContent;
}
/**
 * Plugin configuration for NexusDocument
 */
export interface NexusDocumentPluginConfig {
    name?: string;
    version?: number;
    fields?: string[];
    storage?: {
        type: 'memory' | 'indexeddb';
        options?: Record<string, unknown>;
    };
    versioning?: {
        enabled?: boolean;
        maxVersions?: number;
    };
    validation?: {
        required?: string[];
        customValidators?: Record<string, (value: unknown) => boolean>;
    };
}
export {};
