
import { DocumentLink } from '@/types/document';
import { IndexNode } from '@/types/core';
import { ScoringUtils } from './ScoringUtils'
import { IndexedDocument } from '@/storage';
export class AlgoUtils {
  /**
   * Performs Breadth-First Search traversal on a trie structure
   * @param root Starting node of the trie
   * @param searchText Text to search for
   * @param maxResults Maximum number of results to return
   * @returns Array of matching document IDs with their scores
   */
  static bfsTraversal(
    root: IndexNode,
    searchText: string,
    maxResults = 10
  ): Array<{ id: string; score: number }> {
    const results: Array<{ id: string; score: number }> = [];
    const queue: Array<{ node: IndexNode; depth: number; matched: string }> = [];
    const visited = new Set<string>();
    
    // Initialize queue with root node
    queue.push({ node: root, depth: 0, matched: '' });
    
    while (queue.length > 0 && results.length < maxResults) {
      const item = queue.shift();
      if (!item) break;
      const { node, depth, matched } = item;
      
      // Check if we've found a complete match
      if (matched === searchText && node.id && !visited.has(node.id)) {
        results.push({ id: node.id, score: node.score });
        visited.add(node.id);
      }
      
      // Add children to queue
      for (const [char, childNode] of node.children.entries()) {
        const nextMatched = matched + char;
        // Only continue if the matched string is a prefix of searchText
        if (searchText.startsWith(nextMatched)) {
          queue.push({
            node: childNode,
            depth: depth + 1,
            matched: nextMatched
          });
        }
      }
    }
    
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Performs Depth-First Search traversal on a trie structure
   * @param root Starting node of the trie
   * @param searchText Text to search for
   * @param maxResults Maximum number of results to return
   * @returns Array of matching document IDs with their scores
   */
  static dfsTraversal(
    root: IndexNode,
    searchText: string,
    maxResults = 10
  ): Array<{ id: string; score: number }> {
    const results: Array<{ id: string; score: number }> = [];
    const visited = new Set<string>();

    function dfs(
      node: IndexNode,
      depth: number,
      matched: string
    ): void {
      // Stop if we've found enough results
      if (results.length >= maxResults) return;

      // Check if we've found a complete match
      if (matched === searchText && node.id && !visited.has(node.id)) {
        results.push({ id: node.id, score: node.score });
        visited.add(node.id);
        return;
      }

      // Explore children
      for (const [char, childNode] of node.children.entries()) {
        const nextMatched = matched + char;
        // Only continue if the matched string is a prefix of searchText
        if (searchText.startsWith(nextMatched)) {
          dfs(childNode, depth + 1, nextMatched);
        }
      }
    }

    dfs(root, 0, '');
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Performs fuzzy matching using Levenshtein distance
   * @param root Starting node of the trie
   * @param searchText Text to search for
   * @param maxDistance Maximum edit distance allowed
   * @param maxResults Maximum number of results to return
   * @returns Array of matching document IDs with their scores and distances
   */
  static fuzzySearch(
    root: IndexNode,
    searchText: string,
    maxDistance = 2,
    maxResults = 10
  ): Array<{ id: string; score: number; distance: number }> {
    const results: Array<{ id: string; score: number; distance: number }> = [];
    const visited = new Set<string>();

    function calculateLevenshteinDistance(s1: string, s2: string): number {
      const dp: number[][] = Array(s1.length + 1)
        .fill(null)
        .map(() => Array(s2.length + 1).fill(0));

      for (let i = 0; i <= s1.length; i++) dp[i][0] = i;
      for (let j = 0; j <= s2.length; j++) dp[0][j] = j;

      for (let i = 1; i <= s1.length; i++) {
        for (let j = 1; j <= s2.length; j++) {
          const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + cost
          );
        }
      }

      return dp[s1.length][s2.length];
    }

    function fuzzyDfs(node: IndexNode, currentWord: string): void {
      if (results.length >= maxResults) return;

      if (node.id && !visited.has(node.id)) {
        const distance = calculateLevenshteinDistance(currentWord, searchText);
        if (distance <= maxDistance) {
          results.push({
            id: node.id,
            score: node.score * (1 - distance / maxDistance),
            distance
          });
          visited.add(node.id);
        }
      }

      for (const [char, childNode] of node.children.entries()) {
        fuzzyDfs(childNode, currentWord + char);
      }
    }

    fuzzyDfs(root, '');
    return results.sort((a, b) => b.score - a.score);
  }

  static enhancedSearch(
    root: IndexNode,
    searchText: string,
    documents: Map<string, IndexedDocument>,
    documentLinks: DocumentLink[]
  ): Array<{ id: string; score: number; rank: number }> {
    // Get base results from trie search
    const baseResults = this.bfsTraversal(root, searchText);
    
    // Calculate document ranks
    const documentRanks = ScoringUtils.calculateDocumentRanks(documents, documentLinks);
    
    // Enhanced scoring for each result
    return baseResults.map(result => {
      const document = documents.get(result.id);
      const documentRank = documentRanks.get(result.id);
      if (!documentRank) {
        throw new Error(`Document rank not found for id: ${result.id}`);
      }
      
      // Calculate TF-IDF score
      const tfIdf = ScoringUtils.calculateTfIdf(searchText, document, documents);
      
      // Combine scores
      const finalScore = ScoringUtils.calculateCombinedScore(
        result.score,
        documentRank.rank,
        tfIdf,
        1.0 // Base IDF weight
      );

      return {
        id: result.id,
        score: finalScore,
        rank: documentRank.rank
      };
    }).sort((a, b) => b.score - a.score);
  }
  
}