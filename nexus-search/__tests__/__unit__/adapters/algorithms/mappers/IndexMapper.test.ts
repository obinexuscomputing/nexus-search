import { IndexMapper } from "@/mappers";

describe('IndexMapper', () => {
  let indexMapper: IndexMapper;

  beforeEach(() => {
    indexMapper = new IndexMapper();
  });

  describe('Document Indexing', () => {
    test('should index single document correctly', () => {
      const document = {
        title: 'Test Document',
        content: 'This is test content',
        tags: ['test', 'document']
      };

      indexMapper.indexDocument(document, 'doc1', ['title', 'content', 'tags']);
      const results = indexMapper.search('test');

      expect(results).toHaveLength(1);
      expect(results[0].item).toBe('doc1');
      expect(results[0].score).toBeGreaterThan(0);
    });

    test('should handle multiple documents with same terms', () => {
      const documents = [
        {
          title: 'First Test',
          content: 'Test content one'
        },
        {
          title: 'Second Test',
          content: 'Test content two'
        }
      ];

      documents.forEach((doc, index) => {
        indexMapper.indexDocument(doc, `doc${index + 1}`, ['title', 'content']);
      });

      const results = indexMapper.search('test');
      expect(results).toHaveLength(2);
      expect(results.map(r => r.item)).toContain('doc1');
      expect(results.map(r => r.item)).toContain('doc2');
    });

    test('should handle missing fields gracefully', () => {
      const document = {
        title: 'Test Document'
        // content field missing
      };

      expect(() => {
        indexMapper.indexDocument(document, 'doc1', ['title', 'content']);
      }).not.toThrow();

      const results = indexMapper.search('test');
      expect(results).toHaveLength(1);
    });

    test('should handle empty field values', () => {
      const document = {
        title: '',
        content: 'Test content'
      };

      indexMapper.indexDocument(document, 'doc1', ['title', 'content']);
      const results = indexMapper.search('test');
      expect(results).toHaveLength(1);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      // Add test documents
      const documents = [
        {
          title: 'JavaScript Guide',
          content: 'Learn JavaScript programming',
          tags: ['javascript', 'programming']
        },
        {
          title: 'TypeScript Tutorial',
          content: 'Advanced TypeScript concepts',
          tags: ['typescript', 'programming']
        },
        {
          title: 'Programming Basics',
          content: 'Introduction to programming',
          tags: ['basics', 'programming']
        }
      ];

      documents.forEach((doc, index) => {
        indexMapper.indexDocument(doc, `doc${index + 1}`, ['title', 'content', 'tags']);
      });
    });

    test('should find exact matches', () => {
      const results = indexMapper.search('javascript');
      expect(results).toHaveLength(1);
      expect(results[0].item).toBe('doc1');
    });

    test('should handle fuzzy search', () => {
      const results = indexMapper.search('javascrpt', { fuzzy: true });
      expect(results).toHaveLength(1);
      expect(results[0].item).toBe('doc1');
    });

    test('should respect maxResults option', () => {
      const results = indexMapper.search('programming', { maxResults: 2 });
      expect(results).toHaveLength(2);
    });

    test('should return empty array for no matches', () => {
      const results = indexMapper.search('nonexistent');
      expect(results).toHaveLength(0);
    });

    test('should handle case-insensitive search', () => {
      const results = indexMapper.search('JAVASCRIPT');
      expect(results).toHaveLength(1);
      expect(results[0].item).toBe('doc1');
    });

    test('should assign relevance scores', () => {
      const results = indexMapper.search('programming');
      expect(results.every(r => typeof r.score === 'number')).toBe(true);
      expect(results.every(r => r.score > 0)).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should handle large number of documents', () => {
      const documents = Array.from({ length: 1000 }, (_, i) => ({
        title: `Document ${i}`,
        content: `Content for document ${i} with some common words`,
        tags: [`tag${i}`, 'common']
      }));

      const startIndex = performance.now();
      documents.forEach((doc, index) => {
        indexMapper.indexDocument(doc, `doc${index}`, ['title', 'content', 'tags']);
      });
      const indexTime = performance.now() - startIndex;

      const startSearch = performance.now();
      const results = indexMapper.search('common');
      const searchTime = performance.now() - startSearch;

      expect(indexTime).toBeLessThan(1000); // Indexing should take less than 1 second
      expect(searchTime).toBeLessThan(100); // Search should take less than 100ms
      expect(results.length).toBeGreaterThan(0);
    });

    test('should handle concurrent searches efficiently', async () => {
      // Index some documents first
      Array.from({ length: 100 }, (_, i) => ({
        title: `Document ${i}`,
        content: `Content ${i}`,
        tags: [`tag${i}`]
      })).forEach((doc, index) => {
        indexMapper.indexDocument(doc, `doc${index}`, ['title', 'content', 'tags']);
      });

      // Perform multiple concurrent searches
      const searches = Array.from({ length: 10 }, () =>
        Promise.resolve(indexMapper.search('Document'))
      );

      const startTime = performance.now();
      const results = await Promise.all(searches);
      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(500); // All searches should complete within 500ms
      results.forEach(result => {
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters', () => {
      const document = {
        title: 'Special @#$%^&* Characters',
        content: 'Content with !@#$%^&* special chars'
      };

      indexMapper.indexDocument(document, 'doc1', ['title', 'content']);
      const results = indexMapper.search('special');
      expect(results).toHaveLength(1);
    });

    test('should handle very long terms', () => {
      const longTerm = 'a'.repeat(100);
      const document = {
        title: `Title with ${longTerm}`,
        content: 'Normal content'
      };

      indexMapper.indexDocument(document, 'doc1', ['title', 'content']);
      const results = indexMapper.search(longTerm);
      expect(results).toHaveLength(1);
    });

    test('should handle empty search query', () => {
      const results = indexMapper.search('');
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(0);
    });

    test('should handle undefined document fields', () => {
      const document: any = {
        title: undefined,
        content: 'Some content'
      };

      expect(() => {
        indexMapper.indexDocument(document, 'doc1', ['title', 'content']);
      }).not.toThrow();
    });
  });
});