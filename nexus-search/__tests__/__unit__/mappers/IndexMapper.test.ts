import { IndexMapper } from "@/index";

describe('IndexMapper', () => {
  let indexMapper: IndexMapper;

  beforeEach(() => {
    indexMapper = new IndexMapper();
  });

  describe('Document Indexing', () => {
    test('should index simple document', () => {
      const doc = { title: 'Test', content: 'Content' };
      indexMapper.indexDocument(doc, 'doc1', ['title', 'content']);
      
      const results = indexMapper.search('test');
      expect(results.length).toBe(1);
      expect(results[0].item).toBe('doc1');
    });

    test('should index multiple fields', () => {
      const doc = {
        title: 'Test Title',
        content: 'Test Content',
        tags: ['test', 'tags']
      };
      
      indexMapper.indexDocument(doc, 'doc1', ['title', 'content', 'tags']);
      const results = indexMapper.search('test');
      
      expect(results.length).toBe(1);
      expect(results[0].score).toBeGreaterThan(0);
    });

    test('should handle missing fields gracefully', () => {
      const doc = { title: 'Test' };
      expect(() => {
        indexMapper.indexDocument(doc, 'doc1', ['title', 'content']);
      }).not.toThrow();
    });
  });

  describe('Search Operations', () => {
    beforeEach(() => {
      // Add test documents
      const docs = [
        { title: 'Test One', content: 'First document' },
        { title: 'Test Two', content: 'Second document' },
        { title: 'Another Doc', content: 'Third document' }
      ];
      
      docs.forEach((doc, index) => {
        indexMapper.indexDocument(doc, `doc${index + 1}`, ['title', 'content']);
      });
    });

    test('should perform basic search', () => {
      const results = indexMapper.search('test');
      expect(results.length).toBe(2);
      results.forEach(result => {
        expect(result.score).toBeGreaterThan(0);
      });
    });

    test('should handle fuzzy search', () => {
      const results = indexMapper.search('tets', { fuzzy: true });
      expect(results.length).toBeGreaterThan(0);
    });

    test('should respect maxResults option', () => {
      const results = indexMapper.search('document', { maxResults: 2 });
      expect(results.length).toBe(2);
    });

    test('should sort by relevance', () => {
      const results = indexMapper.search('test');
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });
  });
});

