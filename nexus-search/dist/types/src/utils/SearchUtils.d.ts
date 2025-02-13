import { IndexedDocument } from "@/storage";
import { IndexNode, OptimizationResult, SearchableDocument, DocumentValue, RegexSearchResult, RegexSearchConfig } from "@/types";
/**
 * Performs an optimized Breadth-First Search traversal with regex matching
 */
export declare function bfsRegexTraversal(root: IndexNode, pattern: string | RegExp, maxResults?: number, config?: RegexSearchConfig): RegexSearchResult[];
/**
 * Performs an optimized Depth-First Search traversal with regex matching
 */
export declare function dfsRegexTraversal(root: IndexNode, pattern: string | RegExp, maxResults?: number, config?: RegexSearchConfig): RegexSearchResult[];
/**
 * Optimizes an array of indexable documents
 */
export declare function optimizeIndex<T extends IndexedDocument>(data: T[]): OptimizationResult<T>;
/**
 * Helper function to sort object keys recursively
 */
export declare function sortObjectKeys<T extends object>(obj: T): T;
/**
 * Helper function to generate consistent sort keys for documents
 */
export declare function generateSortKey(doc: IndexedDocument): string;
export declare function createSearchableFields(document: SearchableDocument, fields: string[]): Record<string, string>;
export declare function normalizeFieldValue(value: DocumentValue): string;
export declare function getNestedValue(obj: unknown, path: string): unknown;
export declare function calculateScore(document: IndexedDocument, query: string, field: string, options?: {
    fuzzy?: boolean;
    caseSensitive?: boolean;
    exactMatch?: boolean;
    fieldWeight?: number;
}): number;
export declare function calculateLevenshteinDistance(str1: string, str2: string): number;
export declare function extractMatches(document: IndexedDocument, query: string, fields: string[], options?: {
    fuzzy?: boolean;
    caseSensitive?: boolean;
}): string[];
