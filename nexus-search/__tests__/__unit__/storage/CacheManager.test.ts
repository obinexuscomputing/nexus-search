import { CacheManager } from "@/storage";
import { SearchResult, IndexedDocument } from "@/types";

describe('CacheManager', () => {
  let cache: CacheManager;
  const maxSize = 3;
  const ttlMinutes = 1;

  beforeEach(() => {
    cache = new CacheManager(maxSize, ttlMinutes);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Helper function to create mock search results
  const createMockSearchResult = (id: string): SearchResult<any> => ({
    id,
    item: { id, content: `test content ${id}` },
    document: {
      id,
      fields: { content: `test content ${id}` },
      metadata: { timestamp: Date.now() }
    } as unknown as IndexedDocument,
    score: 1,
    matches: ['test']
  });

  // Helper function to create mock result array
  const createMockResults = (id: string): SearchResult<any>[] => [createMockSearchResult(id)];

  describe('Basic Operations', () => {
    test('should store and retrieve values', () => {
      const key = 'test-key';
      const value = createMockResults('test-1');
      cache.set(key, value);
      expect(cache.get(key)).toEqual(value);
    });

    test('should return null for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeNull();
    });

    test('should clear all entries', () => {
      cache.set('key1', createMockResults('test-1'));
      cache.set('key2', createMockResults('test-2'));
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('Capacity Management', () => {
    test('should respect maximum size', () => {
      // Fill cache to capacity
      for (let i = 0; i < maxSize + 1; i++) {
        cache.set(`key${i}`, createMockResults(`test-${i}`));
      }
      // Oldest entry should be evicted
      expect(cache.get('key0')).toBeNull();
      expect(cache.get(`key${maxSize}`)).not.toBeNull();
    });

    test('should evict oldest entries first', () => {
      // Add entries with different timestamps
      cache.set('old', createMockResults('old'));
      jest.advanceTimersByTime(1000);
      cache.set('newer', createMockResults('newer'));
      jest.advanceTimersByTime(1000);
      cache.set('newest', createMockResults('newest'));
      // Add one more to trigger eviction
      cache.set('extra', createMockResults('extra'));

      expect(cache.get('old')).toBeNull();
      expect(cache.get('newer')).not.toBeNull();
    });
  });

  describe('TTL Handling', () => {
    test('should expire entries after TTL', () => {
      cache.set('test', createMockResults('test-1'));
      
      // Advance time beyond TTL
      jest.advanceTimersByTime((ttlMinutes * 60 * 1000) + 1);
      
      expect(cache.get('test')).toBeNull();
    });

    test('should not expire entries before TTL', () => {
      const value = createMockResults('test-1');
      cache.set('test', value);
      
      // Advance time but not beyond TTL
      jest.advanceTimersByTime((ttlMinutes * 60 * 1000) - 1);
      
      expect(cache.get('test')).toEqual(value);
    });

    test('should handle expired item cleanup', () => {
      cache.set('expire1', createMockResults('test-1'));
      jest.advanceTimersByTime(ttlMinutes * 60 * 1000 / 2);
      cache.set('expire2', createMockResults('test-2'));
      
      jest.advanceTimersByTime(ttlMinutes * 60 * 1000);
      
      expect(cache.get('expire1')).toBeNull();
      expect(cache.get('expire2')).not.toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined values', () => {
      expect(() => cache.set('test', undefined as any)).toThrow();
    });

    test('should handle empty arrays', () => {
      cache.set('test', []);
      expect(cache.get('test')).toEqual([]);
    });

    test('should handle concurrent operations', () => {
      const operations = Array.from({ length: 100 }, (_, i) => ({
        key: `key${i}`,
        value: createMockResults(`test-${i}`)
      }));

      operations.forEach(({ key, value }) => {
        cache.set(key, value);
        cache.get(key);
      });

      expect(cache.get(`key${operations.length - 1}`)).not.toBeNull();
    });
  });

  describe('Cache Strategy', () => {
    test('should handle LRU strategy correctly', () => {
      const cache = new CacheManager(2, ttlMinutes, 'LRU');
      
      cache.set('first', createMockResults('first'));
      cache.set('second', createMockResults('second'));
      
      // Access first item to make it most recently used
      cache.get('first');
      
      // Add new item - should evict second (least recently used)
      cache.set('third', createMockResults('third'));
      
      expect(cache.get('first')).not.toBeNull();
      expect(cache.get('second')).toBeNull();
      expect(cache.get('third')).not.toBeNull();
    });

    test('should handle MRU strategy correctly', () => {
      const cache = new CacheManager(2, ttlMinutes, 'MRU');
      
      cache.set('first', createMockResults('first'));
      cache.set('second', createMockResults('second'));
      
      // Access second item to make it most recently used
      cache.get('second');
      
      // Add new item - should evict second (most recently used)
      cache.set('third', createMockResults('third'));
      
      expect(cache.get('first')).not.toBeNull();
      expect(cache.get('second')).toBeNull();
      expect(cache.get('third')).not.toBeNull();
    });
  });

  describe('Cache Analysis', () => {
    test('should track hits and misses correctly', () => {
      const value = createMockResults('test-1');
      cache.set('test', value);
      
      cache.get('test'); // Hit
      cache.get('nonexistent'); // Miss
      cache.get('test'); // Hit
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    test('should analyze cache usage patterns', () => {
      cache.set('key1', createMockResults('test-1'));
      cache.set('key2', createMockResults('test-2'));
      
      cache.get('key1');
      cache.get('key1');
      cache.get('key2');
      
      const analysis = cache.analyze();
      expect(analysis.hitRate).toBeGreaterThan(0);
      expect(analysis.averageAccessCount).toBeGreaterThan(1);
      expect(analysis.mostAccessedKeys[0].key).toBe('key1');
    });
  });

  describe('Memory Management', () => {
    test('should estimate memory usage', () => {
      const largeResults = Array.from({ length: 5 }, (_, i) => 
        createMockSearchResult(`test-${i}`)
      );
      cache.set('large', largeResults);
      
      const status = cache.getStatus();
      expect(status.memoryUsage.bytes).toBeGreaterThan(0);
      expect(status.memoryUsage.formatted).toContain('B');
    });
  });
});