import { IndexManager } from "@/index";
import { IndexMapper } from "@/mappers";
import { IndexConfig, SearchResult, SearchOptions } from "@/types";

jest.mock('../../algorithms/mappers/IndexMapper');

describe('IndexManager', () => {
  let indexManager: IndexManager;
  let mockIndexMapper: jest.Mocked<IndexMapper>;

  const testConfig: IndexConfig = {
    name: 'test-index',
    version: 1,
    fields: ['title', 'content'],
    options: {
      caseSensitive: false,
      stemming: true
    }
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup mock implementation
    mockIndexMapper = new IndexMapper() as jest.Mocked<IndexMapper>;
    indexManager = new IndexManager(testConfig);
  });

  describe('Document Operations', () => {
    const testDocuments = [
      { title: 'Test 1', content: 'Content 1' },
      { title: 'Test 2', content: 'Content 2' }
    ];

    test('should add documents successfully', async () => {
      await indexManager.addDocuments(testDocuments);
      expect(mockIndexMapper.indexDocument).toHaveBeenCalledTimes(testDocuments.length);
    });

    test('should handle empty document array', async () => {
      await expect(indexManager.addDocuments([])).resolves.not.toThrow();
    });

    test('should handle null or undefined documents', async () => {
      await expect(indexManager.addDocuments(null as any)).rejects.toThrow();
      await expect(indexManager.addDocuments(undefined as any)).rejects.toThrow();
    });

    test('should handle document validation failure', async () => {
      const invalidDocs = [
        { title: 'Missing Content' }
      ];

      await expect(indexManager.addDocuments(invalidDocs)).rejects.toThrow();
    });

    test('should generate unique document IDs', async () => {
      const docs = [{ title: 'Test', content: 'Content' }];
      await indexManager.addDocuments(docs);
      
      const mockCalls = (mockIndexMapper.indexDocument as jest.Mock).mock.calls;
      const generatedIds = mockCalls.map(call => call[1]);
      
      expect(generatedIds[0]).toContain(testConfig.name);
      expect(generatedIds[0]).toContain(Date.now().toString().slice(0, -3));
    });
  });

  describe('Search Operations', () => {
    beforeEach(async () => {
      await indexManager.addDocuments([
        { title: 'Test Document', content: 'Test content' }
      ]);
    });

    test('should perform basic search', async () => {
      const mockResults: SearchResult<string>[] = [
        { item: 'doc1', score: 1, matches: ['test'] }
      ];
      mockIndexMapper.search.mockReturnValue(mockResults);

      const results = await indexManager.search('test');
      expect(results).toEqual(mockResults);
      expect(mockIndexMapper.search).toHaveBeenCalled();
    });

    test('should handle search options', async () => {
      const options: SearchOptions = {
        fuzzy: true,
        maxResults: 10
      };

      await indexManager.search('test', options);
      expect(mockIndexMapper.search).toHaveBeenCalledWith('test', options);
    });

    test('should handle empty search query', async () => {
      const results = await indexManager.search('');
      expect(results).toEqual([]);
    });

    test('should handle search errors', async () => {
      mockIndexMapper.search.mockImplementation(() => {
        throw new Error('Search error');
      });

      await expect(indexManager.search('test')).rejects.toThrow();
    });
  });

  describe('Index Management', () => {
    test('should export index data', () => {
      const mockDocuments = new Map([['doc1', { title: 'Test' }]]);
      (indexManager as any).documents = mockDocuments;

      const exported = indexManager.exportIndex();
      expect(exported).toEqual({
        documents: Array.from(mockDocuments.entries()),
        config: testConfig
      });
    });

    test('should import index data', () => {
      const mockData = {
        documents: [['doc1', { title: 'Test' }]],
        config: testConfig
      };

      indexManager.importIndex(mockData);
      expect((indexManager as any).documents.get('doc1')).toEqual({ title: 'Test' });
      expect((indexManager as any).config).toEqual(testConfig);
    });

    test('should handle invalid import data', () => {
      expect(() => {
        indexManager.importIndex(null as any);
      }).toThrow();

      expect(() => {
        indexManager.importIndex({ documents: null, config: null } as any);
      }).toThrow();
    });

    test('should clear index', () => {
      // Setup initial data
      const mockDocuments = new Map([['doc1', { title: 'Test' }]]);
      (indexManager as any).documents = mockDocuments;

      indexManager.clear();
      expect((indexManager as any).documents.size).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle document ID collisions', async () => {
      // Mock Date.now to force ID collision
      const originalNow = Date.now;
      const mockNow = jest.fn().mockReturnValue(12345);
      global.Date.now = mockNow;

      const docs = [
        { title: 'Doc 1', content: 'Content 1' },
        { title: 'Doc 2', content: 'Content 2' }
      ];

      await indexManager.addDocuments(docs);
      
      const mockCalls = (mockIndexMapper.indexDocument as jest.Mock).mock.calls;
      const generatedIds = mockCalls.map(call => call[1]);
      
      expect(generatedIds[0]).not.toBe(generatedIds[1]);

      // Restore original Date.now
      global.Date.now = originalNow;
    });

    test('should handle large document batches', async () => {
      const largeBatch = Array.from({ length: 1000 }, (_, i) => ({
        title: `Document ${i}`,
        content: `Content ${i}`
      }));

      await expect(indexManager.addDocuments(largeBatch)).resolves.not.toThrow();
      expect(mockIndexMapper.indexDocument).toHaveBeenCalledTimes(1000);
    });

    test('should handle special characters in fields', async () => {
      const specialCharsDoc = {
        title: 'Test @#$%^&*()',
        content: '!@#$%^&*()_+'
      };

      await expect(indexManager.addDocuments([specialCharsDoc])).resolves.not.toThrow();
    });

    test('should handle concurrent operations', async () => {
      const addDocs = indexManager.addDocuments([{ title: 'Test', content: 'Content' }]);
      const search = indexManager.search('test');
      const clear = indexManager.clear();

      await expect(Promise.all([addDocs, search, clear])).resolves.not.toThrow();
    });
  });
});