import { DocumentLink } from '@/types/document';
import { IndexNode } from '@/types/core';
import { IndexedDocument } from '@/storage';
export declare class AlgoUtils {
    /**
     * Performs Breadth-First Search traversal on a trie structure
     * @param root Starting node of the trie
     * @param searchText Text to search for
     * @param maxResults Maximum number of results to return
     * @returns Array of matching document IDs with their scores
     */
    static bfsTraversal(root: IndexNode, searchText: string, maxResults?: number): Array<{
        id: string;
        score: number;
    }>;
    /**
     * Performs Depth-First Search traversal on a trie structure
     * @param root Starting node of the trie
     * @param searchText Text to search for
     * @param maxResults Maximum number of results to return
     * @returns Array of matching document IDs with their scores
     */
    static dfsTraversal(root: IndexNode, searchText: string, maxResults?: number): Array<{
        id: string;
        score: number;
    }>;
    /**
     * Performs fuzzy matching using Levenshtein distance
     * @param root Starting node of the trie
     * @param searchText Text to search for
     * @param maxDistance Maximum edit distance allowed
     * @param maxResults Maximum number of results to return
     * @returns Array of matching document IDs with their scores and distances
     */
    static fuzzySearch(root: IndexNode, searchText: string, maxDistance?: number, maxResults?: number): Array<{
        id: string;
        score: number;
        distance: number;
    }>;
    static enhancedSearch(root: IndexNode, searchText: string, documents: Map<string, IndexedDocument>, documentLinks: DocumentLink[]): Array<{
        id: string;
        score: number;
        rank: number;
    }>;
}
