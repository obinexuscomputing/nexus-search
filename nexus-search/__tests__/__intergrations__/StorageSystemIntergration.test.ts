import { SearchStorage, CacheManager } from "@/storage";

describe('Storage System Integration', () => {
    let storage: SearchStorage;
    let cache: CacheManager;
    
    beforeEach(async () => {
      storage = new SearchStorage();
      cache = new CacheManager();
      await storage.initialize();
    });
  
    afterEach(async () => {
      await storage.clearIndices();
      cache.clear();
    });
  
    test('should handle concurrent storage operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => ({
        key: `key-${i}`,
        data: { content: `content-${i}` }
      }));
  
      await Promise.all(
        operations.map(op => storage.storeIndex(op.key, op.data))
      );
  
      const results = await Promise.all(
        operations.map(op => storage.getIndex(op.key))
      );
  
      results.forEach((result, i) => {
        expect(result).toEqual({ content: `content-${i}` });
      });
    });
  
    test('should handle storage and cache synchronization', async () => {
      const testData = { key: 'test', content: 'content' };
      
      // Store in both systems
      await storage.storeIndex('test-key', testData);
      cache.set('test-key', [testData]);
  
      // Verify synchronization
      const storedData = await storage.getIndex('test-key');
      const cachedData = cache.get('test-key');
  
      expect(storedData).toEqual(testData);
      expect(cachedData).toEqual([testData]);
    });
  
    test('should handle large data transfers between storage and cache', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        content: `content-${i}`.repeat(100)
      }));
  
      await storage.storeIndex('large-data', largeData);
      cache.set('large-data', largeData);
  
      const storedData = await storage.getIndex('large-data');
      const cachedData = cache.get('large-data');
  
      expect(storedData).toEqual(largeData);
      expect(cachedData).toEqual(largeData);
    });
  });
  
  