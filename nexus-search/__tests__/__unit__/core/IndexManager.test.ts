import { IndexManager } from '@/index';
import { DocumentData, IndexConfig, IndexedDocument } from '@/types';
import { jest } from '@jest/globals';
import { IndexMapper } from '@/mappers';

// Mock the IndexMapper
jest.mock('@/mappers');

describe('IndexManager', () => {
  let indexManager: IndexManager;
  let mockIndexMapper: jest.Mocked<IndexMapper>;
  
  const testConfig: IndexConfig = {
    name: 'test-index',
    version: 1,
    fields: ['title', 'content', 'author', 'tags'],
  };

  const createTestDocument = (id: string): IndexedDocument => ({
    id,
    fields: {
      title: `Test ${id}`,
      content: `Content for ${id}`,
      author: 'Test Author',
      tags: ['test'],
      version: '1.0'
    },
    metadata: {
      indexed: Date.now(),
      lastModified: Date.now()
    },
    versions: [],
    relations: [],
    clone: () => createTestDocument(id),
    update: (updates) => ({ ...createTestDocument(id), ...updates }),
    toObject: () => createTestDocument(id),
    document: function() { return this; },
    content: {} as DocumentData
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup mock IndexMapper
    mockIndexMapper = {
      indexDocument: jest.fn(),
      search: jest.fn(),
      removeDocument: jest.fn(),
      updateDocument: jest.fn(),
      exportState: jest.fn(),
      importState: jest.fn(),
    } as unknown as jest.Mocked<IndexMapper>;
    
    // Replace the real IndexMapper with our mock
    (IndexMapper as jest.Mock).mockImplementation(() => mockIndexMapper);
    
    indexManager = new IndexManager(testConfig);
  });

  describe('Document Operations', () => {
    test('should add documents to index', async () => {
      const docs = [
        createTestDocument('doc1'),
        createTestDocument('doc2')
      ];
      
      await expect(indexManager.addDocuments(docs)).resolves.not.toThrow();
      expect(indexManager.getSize()).toBe(2);
    });

    test('should handle empty document array', async () => {
      await expect(indexManager.addDocuments([])).resolves.not.toThrow();
      expect(indexManager.getSize()).toBe(0);
    });

    test('should update existing document', async () => {
      const doc = createTestDocument('doc1');
      await indexManager.addDocuments([doc]);

      const updatedDoc = {
        ...doc,
        fields: {
          ...doc.fields,
          title: 'Updated Title'
        }
      };

      await expect(indexManager.updateDocument(updatedDoc)).resolves.not.toThrow();
      
      const allDocs = indexManager.getAllDocuments();
      const retrieved = allDocs.get(doc.id);
      expect(retrieved?.fields.title).toBe('Updated Title');
    });

    test('should remove document', async () => {
      const doc = createTestDocument('doc1');
      await indexManager.addDocuments([doc]);
      await indexManager.removeDocument(doc.id);
      
      expect(indexManager.getSize()).toBe(0);
      const allDocs = indexManager.getAllDocuments();
      expect(allDocs.has(doc.id)).toBeFalsy();
    });
  });

  describe('Search Operations', () => {
    beforeEach(async () => {
      const docs = [
        createTestDocument('doc1'),
        createTestDocument('doc2')
      ];
      await indexManager.addDocuments(docs);

      // Mock the search response
      mockIndexMapper.search.mockResolvedValue([
        { 
          item: 'doc1', 
          score: 1.0, 
          matches: ['test']
        }
      ]);
    });

    test('should search documents', async () => {
      const results = await indexManager.search('Test');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item).toBeDefined();
      expect(results[0].score).toBeDefined();
    });

    test('should handle empty search query', async () => {
      const results = await indexManager.search('');
      expect(results).toHaveLength(0);
    });

    test('should apply search options', async () => {
      await indexManager.search('Test', {
        fuzzy: true,
        maxResults: 1,
        threshold: 0.5
      });
      
      expect(mockIndexMapper.search).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({
          fuzzy: true,
          maxResults: 1
        })
      );
    });
  });

  describe('Index Management', () => {
    test('should export and import index', async () => {
      const docs = [createTestDocument('doc1')];
      await indexManager.addDocuments(docs);
      
      const exported = indexManager.exportIndex();
      const newIndexManager = new IndexManager(testConfig);
      
      expect(() => newIndexManager.importIndex(exported)).not.toThrow();
      expect(newIndexManager.getSize()).toBe(1);
    });

    test('should handle invalid import data', () => {
      const invalidData = { 
        documents: [], 
        // Missing required fields
      };
      
      expect(() => indexManager.importIndex(invalidData)).toThrow();
    });

    test('should clear index', async () => {
      const docs = [createTestDocument('doc1')];
      await indexManager.addDocuments(docs);
      
      indexManager.clear();
      expect(indexManager.getSize()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle document indexing errors gracefully', async () => {
      const invalidDoc = createTestDocument('invalid');
      // Mock indexDocument to throw an error

      mockIndexMapper.search.mockImplementation((): never => {

        throw new Error('Search error');
      
      });
      await indexManager.addDocuments([invalidDoc]);
      expect(indexManager.hasDocument('invalid')).toBeFalsy();
    });

    test('should handle search errors gracefully', async () => {
      // Mock search to throw an error

      mockIndexMapper.search.mockImplementation((): never => {

        throw new Error('Search error');
      
      });      
      const results = await indexManager.search('test');
      expect(results).toHaveLength(0);
    });

    test('should handle update errors gracefully', async () => {
      const doc = createTestDocument('doc1');
      await indexManager.addDocuments([doc]);

      // Mock update to throw an error
      mockIndexMapper = jest.fn() as unknown as jest.Mocked<IndexMapper>;

      await expect(indexManager.updateDocument({
        ...doc,
        fields: { ...doc.fields, title: 'Updated' }
      })).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    test('should handle large number of documents', async () => {
      const docs = Array.from({ length: 100 }, (_, i) => 
        createTestDocument(`doc${i}`)
      );

      await expect(indexManager.addDocuments(docs)).resolves.not.toThrow();
      expect(indexManager.getSize()).toBe(100);
    });

    test('should handle concurrent operations', async () => {
      const docs = Array.from({ length: 10 }, (_, i) => 
        createTestDocument(`doc${i}`)
      );

      const operations = [
        indexManager.addDocuments(docs.slice(0, 5)),
        indexManager.addDocuments(docs.slice(5)),
        indexManager.search('Test'),
        indexManager.removeDocument('doc1')
      ];

      await expect(Promise.all(operations)).resolves.not.toThrow();
    });
  });
});