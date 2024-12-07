import { DocumentLink, DocumentRank, IndexNode } from '../types';
import {AlgoUtils} from './AlgoUtils';



export class ScoringUtils {
  private static readonly DAMPING_FACTOR = 0.85;
  private static readonly MAX_ITERATIONS = 100;
  private static readonly CONVERGENCE_THRESHOLD = 0.0001;

  /**
   * Calculates document ranks using a PageRank-inspired algorithm
   * @param documents Map of document IDs to their content
   * @param links Array of document links representing relationships
   * @returns Map of document IDs to their calculated ranks
   */
  static calculateDocumentRanks(
    documents: Map<string, any>,
    links: DocumentLink[]
  ): Map<string, DocumentRank> {
    const documentRanks = new Map<string, DocumentRank>();
    const adjacencyMap = new Map<string, Set<string>>();
    
    // Initialize document ranks and adjacency map
    for (const docId of documents.keys()) {
      documentRanks.set(docId, {
        id: docId,
        rank: 1 / documents.size,
        incomingLinks: 0,
        outgoingLinks: 0
      });
      adjacencyMap.set(docId, new Set());
    }

    // Build adjacency map and count links
    for (const link of links) {
      if (adjacencyMap.has(link.fromId) && adjacencyMap.has(link.toId)) {
        adjacencyMap.get(link.fromId)!.add(link.toId);
        const fromDoc = documentRanks.get(link.fromId)!;
        const toDoc = documentRanks.get(link.toId)!;
        fromDoc.outgoingLinks++;
        toDoc.incomingLinks++;
      }
    }

    // Iteratively calculate ranks
    let iteration = 0;
    let maxDiff = 1;

    while (iteration < this.MAX_ITERATIONS && maxDiff > this.CONVERGENCE_THRESHOLD) {
      maxDiff = 0;
      const newRanks = new Map<string, number>();

      for (const [docId, docRank] of documentRanks) {
        let newRank = (1 - this.DAMPING_FACTOR) / documents.size;
        
        // Calculate contribution from incoming links
        for (const [fromId, toIds] of adjacencyMap.entries()) {
          if (toIds.has(docId)) {
            const fromRank = documentRanks.get(fromId)!.rank;
            const outgoingCount = documentRanks.get(fromId)!.outgoingLinks;
            newRank += this.DAMPING_FACTOR * (fromRank / outgoingCount);
          }
        }

        newRanks.set(docId, newRank);
        maxDiff = Math.max(maxDiff, Math.abs(newRank - docRank.rank));
      }

      // Update ranks
      for (const [docId, newRank] of newRanks) {
        const docRank = documentRanks.get(docId)!;
        docRank.rank = newRank;
      }

      iteration++;
    }

    return documentRanks;
  }

  /**
   * Combines multiple scoring factors to create a final relevance score
   * @param textScore Base text matching score
   * @param documentRank PageRank-like score for the document
   * @param termFrequency Term frequency in the document
   * @param inverseDocFreq Inverse document frequency
   * @returns Combined relevance score
   */
  static calculateCombinedScore(
    textScore: number,
    documentRank: number,
    termFrequency: number,
    inverseDocFreq: number
  ): number {
    const weights = {
      textMatch: 0.3,
      documentRank: 0.2,
      tfIdf: 0.5
    };

    const tfIdfScore = termFrequency * inverseDocFreq;
    
    return (
      weights.textMatch * textScore +
      weights.documentRank * documentRank +
      weights.tfIdf * tfIdfScore
    );
  }

  /**
   * Calculates Term Frequency-Inverse Document Frequency (TF-IDF)
   * @param term Search term
   * @param document Current document content
   * @param documents All documents map
   * @returns TF-IDF score
   */
  static calculateTfIdf(
    term: string,
    document: any,
    documents: Map<string, any>
  ): number {
    const tf = this.calculateTermFrequency(term, document);
    const idf = this.calculateInverseDocumentFrequency(term, documents);
    return tf * idf;
  }

  private static calculateTermFrequency(term: string, document: any): number {
    const text = JSON.stringify(document).toLowerCase();
    const termCount = (text.match(new RegExp(term.toLowerCase(), 'g')) || []).length;
    const totalWords = text.split(/\s+/).length;
    return termCount / totalWords;
  }

  private static calculateInverseDocumentFrequency(
    term: string,
    documents: Map<string, any>
  ): number {
    let documentCount = 0;
    const termLower = term.toLowerCase();

    for (const doc of documents.values()) {
      const text = JSON.stringify(doc).toLowerCase();
      if (text.includes(termLower)) {
        documentCount++;
      }
    }

    return Math.log(documents.size / (1 + documentCount));
  }

  /**
   * Adjusts scores based on document freshness
   * @param baseScore Original relevance score
   * @param documentDate Document creation/update date
   * @param maxAge Maximum age in days for full score
   * @returns Adjusted score based on freshness
   */
  static adjustScoreByFreshness(
    baseScore: number,
    documentDate: Date,
    maxAge: number = 365
  ): number {
    const ageInDays = (Date.now() - documentDate.getTime()) / (1000 * 60 * 60 * 24);
    const freshnessMultiplier = Math.max(0, 1 - (ageInDays / maxAge));
    return baseScore * (0.7 + 0.3 * freshnessMultiplier);
  }

  
}
