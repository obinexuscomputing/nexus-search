import { DocumentLink, DocumentRank } from '../types/document';
export declare class ScoringUtils {
    private static readonly DAMPING_FACTOR;
    private static readonly MAX_ITERATIONS;
    private static readonly CONVERGENCE_THRESHOLD;
    /**
     * Calculates document ranks using a PageRank-inspired algorithm
     * @param documents Map of document IDs to their content
     * @param links Array of document links representing relationships
     * @returns Map of document IDs to their calculated ranks
     */
    static calculateDocumentRanks(documents: Map<string, unknown>, links: DocumentLink[]): Map<string, DocumentRank>;
    /**
     * Calculates Term Frequency-Inverse Document Frequency (TF-IDF)
     * @param term Search term
     * @param document Current document content
     * @param documents All documents map
     * @returns TF-IDF score
     */
    static calculateTfIdf(term: string, document: unknown, documents: Map<string, unknown>): number;
    /**
     * Calculates term frequency in a document
     */
    private static calculateTermFrequency;
    /**
     * Calculates inverse document frequency
     */
    private static calculateInverseDocumentFrequency;
    /**
     * Combines multiple scoring factors to create a final relevance score
     * @param textScore Base text matching score
     * @param documentRank PageRank-like score for the document
     * @param termFrequency Term frequency in the document
     * @param inverseDocFreq Inverse document frequency
     * @returns Combined relevance score
     */
    static calculateCombinedScore(textScore: number, documentRank: number, termFrequency: number, inverseDocFreq: number): number;
    /**
     * Adjusts scores based on document freshness
     * @param baseScore Original relevance score
     * @param documentDate Document creation/update date
     * @param maxAge Maximum age in days for full score
     * @returns Adjusted score based on freshness
     */
    static adjustScoreByFreshness(baseScore: number, documentDate: Date, maxAge?: number): number;
}
