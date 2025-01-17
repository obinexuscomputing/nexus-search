import { SearchEngine, IndexManager } from "@/index";
import { SearchStorage, CacheManager } from "@/storage";
import { IndexConfig, SearchOptions } from "@/types";


describe('Search System Integration', () => {
  let searchEngine: SearchEngine;
  let indexManager: IndexManager;
  let storage: SearchStorage;
  let cache: CacheManager;

  const testConfig: IndexConfig = {
    name: 'integration-test',
    version: 1,
    fields: ['title', 'content', 'tags'],
    options: {
      caseSensitive: false,
      stemming: true,
      stopWords: ['the', 'a', 'an']
    }
  };

  const sampleDocuments = [
    {
      title: 'JavaScript Basics',
      content: 'Learn JavaScript programming fundamentals',
      tags: ['programming', 'javascript', 'web']
    },
    {
      title: 'Advanced TypeScript',
      content: 'Deep dive into TypeScript features',
      tags: ['programming', 'typescript', 'advanced']
    },
    {
      title: 'React Hooks',
      content: 'Understanding React Hooks and State Management',
      tags: ['react', 'javascript', 'frontend']
    }
  ];

  beforeEach(async () => {
    storage = new SearchStorage();
    cache = new CacheManager(100, 5);
    indexManager = new IndexManager(testConfig);
    searchEngine = new SearchEngine(testConfig);
    
    await storage.initialize();
    await searchEngine.initialize();
  });

  afterEach(async () => {
    await storage.clearIndices();
    cache.clear();
  });

  describe('Document Processing Flow', () => {
    test('should process and index documents end-to-end', async () => {
      await searchEngine.addDocuments(sampleDocuments);
      
      const results = await searchEngine.search('javascript');
      expect(results).toHaveLength(2);
      expect(results.map(r => r.item.title)).toContain('JavaScript Basics');
      expect(results.map(r => r.item.title)).toContain('React Hooks');
    });

    test('should persist indexed documents across sessions', async () => {
      // First session
      await searchEngine.addDocuments(sampleDocuments);
      await storage.storeIndex('test-index', await indexManager.exportIndex());

      // Simulate new session
      const newSearchEngine = new SearchEngine(testConfig);
      await newSearchEngine.initialize();

      const results = await newSearchEngine.search('typescript');
      expect(results).toHaveLength(1);
      expect(results[0].item.title).toBe('Advanced TypeScript');
    });
  });

  describe('Search and Cache Integration', () => {
    beforeEach(async () => {
      await searchEngine.addDocuments(sampleDocuments);
    });

    test('should utilize cache for repeated searches', async () => {
      const query = 'programming';
      const options: SearchOptions = { fuzzy: true };

      // First search
      const firstResults = await searchEngine.search(query, options);
      
      // Second search should hit cache
      const startTime = performance.now();
      const secondResults = await searchEngine.search(query, options);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5); // Cache hit should be very fast
      expect(secondResults).toEqual(firstResults);
    });

    test('should update cache when index changes', async () => {
      // Initial search
      const initialResults = await searchEngine.search('react');
      expect(initialResults).toHaveLength(1);

      // Add new document
      await searchEngine.addDocuments([{
        title: 'React Native',
        content: 'Mobile development with React Native',
        tags: ['react', 'mobile']
      }]);

      // Search again
      const updatedResults = await searchEngine.search('react');
      expect(updatedResults).toHaveLength(2);
    });
  });

  describe('Complex Search Scenarios', () => {
    beforeEach(async () => {
      await searchEngine.addDocuments(sampleDocuments);
    });

    test('should handle multi-term searches', async () => {
      const results = await searchEngine.search('javascript programming');
      expect(results).toHaveLength(1);
      expect(results[0].item.title).toBe('JavaScript Basics');
    });

    test('should perform fuzzy searches across fields', async () => {
      const results = await searchEngine.search('javascrpt', { fuzzy: true });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.tags).toContain('javascript');
    });

    test('should respect field weights in scoring', async () => {
      const results = await searchEngine.search('typescript');
      expect(results[0].item.title).toBe('Advanced TypeScript');
      expect(results[0].score).toBeGreaterThan(0);
    });
  });
});
