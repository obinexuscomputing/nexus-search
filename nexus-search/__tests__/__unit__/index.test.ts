import {
    SearchEngine,
    IndexManager,
    QueryProcessor,
    createSearchableFields,
    optimizeIndex,
    validateSearchOptions,
    validateIndexConfig,
    validateDocument,
    SearchOptions,
    IndexConfig
  } from '../../src';
  
  describe('Package Entry Point', () => {
    describe('Exports', () => {
      test('should export all required components and utilities', () => {
        expect(SearchEngine).toBeDefined();
        expect(IndexManager).toBeDefined();
        expect(QueryProcessor).toBeDefined();
        expect(createSearchableFields).toBeDefined();
        expect(optimizeIndex).toBeDefined();
        expect(validateSearchOptions).toBeDefined();
        expect(validateIndexConfig).toBeDefined();
        expect(validateDocument).toBeDefined();
      });
    });
  
    describe('Integration', () => {
      let searchEngine: SearchEngine;
  
      beforeEach(() => {
        const config: IndexConfig = {
          name: 'test-index',
          version: 1,
          fields: ['title', 'content']
        };
        searchEngine = new SearchEngine(config);
      });
  
      test('should perform full text search workflow', async () => {
        // Initialize
        await searchEngine.initialize();
  
        // Add documents
        const documents = [
          { title: 'Test Document', content: 'Sample content for testing' },
          { title: 'Another Test', content: 'More test content here' }
        ];
        await searchEngine.addDocuments(documents);
  
        // Search
        const options: SearchOptions = {
          fuzzy: true,
          maxResults: 10
        };
        const results = await searchEngine.search('test', options);
  
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].item).toBeDefined();
        expect(results[0].score).toBeGreaterThan(0);
      });
  
      test('should handle search with various options', async () => {
        await searchEngine.initialize();
        
        const documents = [
          { title: 'Programming Basics', content: 'Learn programming fundamentals' },
          { title: 'Advanced Programming', content: 'Deep dive into programming' }
        ];
        await searchEngine.addDocuments(documents);
  
        // Test different search options
        const testCases = [
          {
            query: 'program',
            options: { maxResults: 1 }
          },
          {
            query: 'programing', // Intentional typo
            options: { fuzzy: true }
          },
          {
            query: 'fundamentals',
            options: { fields: ['content'] }
          }
        ];
  
        for (const testCase of testCases) {
          const results = await searchEngine.search(
            testCase.query,
            testCase.options
          );
          expect(results).toBeDefined();
          expect(Array.isArray(results)).toBeTruthy();
        }
      });
    });
  
    describe('Error Handling', () => {
      test('should validate search options correctly', () => {
        const validOptions: SearchOptions = {
          fuzzy: true,
          maxResults: 10,
          threshold: 0.5
        };
        expect(() => validateSearchOptions(validOptions)).not.toThrow();
  
        const invalidOptions = {
          maxResults: -1,
          threshold: 2
        };
        expect(() => validateSearchOptions(invalidOptions as SearchOptions)).toThrow();
      });
  
      test('should validate index configuration', () => {
        const validConfig: IndexConfig = {
          name: 'test',
          version: 1,
          fields: ['title']
        };
        expect(() => validateIndexConfig(validConfig)).not.toThrow();
  
        const invalidConfig = {
          name: '',
          version: -1,
          fields: []
        };
        expect(() => validateIndexConfig(invalidConfig as IndexConfig)).toThrow();
      });
    });
  
    describe('Performance', () => {
      test('should handle large datasets efficiently', async () => {
        const searchEngine = new SearchEngine({
          name: 'performance-test',
          version: 1,
          fields: ['title', 'content']
        });
  
        await searchEngine.initialize();
  
        // Generate large dataset
        const documents = Array.from({ length: 1000 }, (_, i) => ({
          title: `Document ${i}`,
          content: `Content for document ${i} with some random words test sample data`
        }));
  
        const startIndex = performance.now();
        await searchEngine.addDocuments(documents);
        const indexTime = performance.now() - startIndex;
  
        const startSearch = performance.now();
        const results = await searchEngine.search('test');
        const searchTime = performance.now() - startSearch;
  
        expect(indexTime).toBeLessThan(5000); // 5 seconds max for indexing
        expect(searchTime).toBeLessThan(100); // 100ms max for search
        expect(results.length).toBeGreaterThan(0);
      });
    });
  });