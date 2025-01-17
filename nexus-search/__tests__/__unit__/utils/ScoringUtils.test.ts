import { ScoringUtils } from '@/utils/ScoringUtils';
import { DocumentLink, DocumentRank } from '@/types/document';

describe('ScoringUtils', () => {
  describe('calculateDocumentRanks', () => {
    test('should calculate basic document ranks', () => {
      const documents = new Map([
        ['doc1', { content: 'test' }],
        ['doc2', { content: 'test' }]
      ]);

      const links: DocumentLink[] = [
        { fromId: 'doc1', toId: 'doc2', weight: 1 }
      ];

      const ranks = ScoringUtils.calculateDocumentRanks(documents, links);
      
      expect(ranks.size).toBe(2);
      expect(ranks.get('doc1')).toBeDefined();
      expect(ranks.get('doc2')).toBeDefined();
      expect(ranks.get('doc1')!.outgoingLinks).toBe(1);
      expect(ranks.get('doc2')!.incomingLinks).toBe(1);
    });

    test('should handle documents with no links', () => {
      const documents = new Map([
        ['doc1', { content: 'test' }],
        ['doc2', { content: 'test' }]
      ]);

      const ranks = ScoringUtils.calculateDocumentRanks(documents, []);
      
      expect(ranks.size).toBe(2);
      ranks.forEach(rank => {
        expect(rank.incomingLinks).toBe(0);
        expect(rank.outgoingLinks).toBe(0);
        expect(rank.rank).toBeCloseTo(1 / documents.size);
      });
    });

    test('should converge ranks with cyclic links', () => {
      const documents = new Map([
        ['doc1', { content: 'test' }],
        ['doc2', { content: 'test' }]
      ]);

      const links: DocumentLink[] = [
        { fromId: 'doc1', toId: 'doc2', weight: 1 },
        { fromId: 'doc2', toId: 'doc1', weight: 1 }
      ];

      const ranks = ScoringUtils.calculateDocumentRanks(documents, links);
      
      const rank1 = ranks.get('doc1')!.rank;
      const rank2 = ranks.get('doc2')!.rank;
      expect(Math.abs(rank1 - rank2)).toBeLessThan(0.0001);
    });
  });

  describe('calculateTfIdf', () => {
    test('should calculate TF-IDF score', () => {
      const documents = new Map([
        ['doc1', { content: 'test document one' }],
        ['doc2', { content: 'test document two' }],
        ['doc3', { content: 'another document' }]
      ]);

      const term = 'test';
      const document = documents.get('doc1');

      const score = ScoringUtils.calculateTfIdf(term, document, documents);
      
      expect(score).toBeGreaterThan(0);
      expect(typeof score).toBe('number');
    });

    test('should handle term not present in documents', () => {
      const documents = new Map([
        ['doc1', { content: 'test document' }]
      ]);

      const term = 'nonexistent';
      const document = documents.get('doc1');

      const score = ScoringUtils.calculateTfIdf(term, document, documents);
      
      expect(score).toBe(0);
    });

    test('should handle term present in all documents', () => {
      const documents = new Map([
        ['doc1', { content: 'common common' }],
        ['doc2', { content: 'common word' }]
      ]);

      const term = 'common';
      const document = documents.get('doc1');

      const score = ScoringUtils.calculateTfIdf(term, document, documents);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });

  describe('calculateCombinedScore', () => {
    test('should combine multiple scoring factors', () => {
      const textScore = 0.8;
      const documentRank = 0.6;
      const termFrequency = 0.5;
      const inverseDocFreq = 0.7;

      const score = ScoringUtils.calculateCombinedScore(
        textScore,
        documentRank,
        termFrequency,
        inverseDocFreq
      );

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });

    test('should handle extreme values', () => {
      const maxScore = ScoringUtils.calculateCombinedScore(1, 1, 1, 1);
      const minScore = ScoringUtils.calculateCombinedScore(0, 0, 0, 0);

      expect(maxScore).toBeLessThanOrEqual(1);
      expect(minScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('adjustScoreByFreshness', () => {
    test('should adjust score based on document age', () => {
      const baseScore = 0.8;
      const recentDate = new Date();
      const oldDate = new Date(Date