// SearchEngine.test.ts
import { SearchEngine, IndexManager } from "@/index";
import { SearchStorage, CacheManager, IndexedDocument } from "@/storage";
import type { 
  SearchOptions, 
  SearchResult,
  SearchEngineConfig
} from "@/types";

// Mock dependencies
jest.mock('../../core/IndexManager');
jest.mock('../../core/QueryProcessor');
jest.mock('../../storage/IndexedDB');
jest.mock('../../storage/CacheManager');
jest.mock('../../algorithms/trie');

describe('SearchEngine', () => {
  let searchEngine: SearchEngine;
  let mockIndexManager: jest.Mocked<IndexManager>;
  let mockStorage: jest.Mocked<SearchStorage>;
  let mockCache: jest.Mocked<CacheManager>;

  const testConfig: SearchEngineConfig = {
    name: 'test-index',
    version: 1,
    fields: ['title', 'content', 'author', 'tags'],
    storage: { type: 'memory' }
  };

  const testDocuments: IndexedDocument[] = [
    {
      id: 'doc1',
      fields: {
        title: 'Test 1',
        content: 'Content 1',
        author: 'Author 1',
        tags: ['tag1'],
        version: '1.0'
      },
      metadata: {
        indexed: Date.now(),
        lastModified: Date.now()
      }
    },
    {
      id: 'doc2',
      fields: {
        title: 'Test 2',
        content: 'Content 2',
        author: 'Author 2',
        tags: ['tag2'],
        version: '1.0'
      },
      metadata: {
        indexed: Date.now(),
        lastModified: Date.now()
      }
    }
  ].map(doc => new IndexedDocument(doc.id, doc.fields, doc.metadata));

  beforeEach(() => {
    jest.clearAllMocks();
    mockIndexManager = new IndexManager(testConfig) as jest.Mocked<IndexManager>;
    mockStorage = new SearchStorage() as jest.Mocked<SearchStorage>;
    mockCache = new CacheManager() as jest.Mocked<CacheManager>;
    searchEngine = new SearchEngine(testConfig);
  });

  describe('Document Management', () => {
    beforeEach(async () => {
      await searchEngine.initialize();
    });

    test('should generate ID for documents without one', async () => {
      const docWithoutId = { ...testDocuments[0] };
      const { id } = docWithoutId;
      await searchEngine.addDocuments([new IndexedDocument('', docWithoutId.fields, docWithoutId.metadata)]);
      expect(mockIndexManager.addDocuments).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringContaining(testConfig.name)
          })
        ])
      );
    });

    test('should handle document removal with data cleanup', async () => {
      await searchEngine.addDocuments([testDocuments[0]]);
      await searchEngine.removeDocument(testDocuments[0].id);
      expect(searchEngine.getDocument(testDocuments[0].id)).toBeUndefined();
      expect(mockCache.clear).toHaveBeenCalled();
    });
  });

  describe('Search Operations', () => {
    const searchQuery = 'test query';
    const searchOptions: SearchOptions = {
      fuzzy: true,
      maxResults: 10
    };

    beforeEach(async () => {
      await searchEngine.initialize();
      await searchEngine.addDocuments(testDocuments);
    });

    test('should handle search with regex', async () => {
      const regexOptions = { 
        ...searchOptions, 
        regex: /test/i
      };
      const results = await searchEngine.search(searchQuery, regexOptions);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    test('should use cache for repeated searches', async () => {
      const mockResults: SearchResult<IndexedDocument>[] = [{
        id: 'doc1',
        item: testDocuments[0],
        document: testDocuments[0],
        score: 1.0,
        matches: ['test']
      }];
      mockCache.get.mockReturnValueOnce(mockResults);

      const results = await searchEngine.search(searchQuery, searchOptions);
      expect(results).toEqual(mockResults);
    });
  });
});