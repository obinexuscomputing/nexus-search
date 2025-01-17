import { IndexNode, DocumentLink } from "@/types";
import { AlgoUtils } from "@/utils";


describe('AlgoUtils', () => {
  let mockRoot: IndexNode;

  beforeEach(() => {
    // Create a simple trie structure for testing
    mockRoot = {
      children: new Map(),
      score: 0,
    };
  });

  describe('bfsTraversal', () => {
    test('should find exact matches', () => {
      // Build test trie: "cat" -> doc1, "car" -> doc2
      const doc1Node: IndexNode = { id: 'doc1', score: 1.0, children: new Map() };
      const doc2Node: IndexNode = { id: 'doc2', score: 0.8, children: new Map() };
      
      mockRoot.children.set('c', {
        children: new Map([
          ['a', {
            children: new Map([
              ['t', doc1Node],
              ['r', doc2Node]
            ]),
            score: 0
          }]
        ]),
        score: 0
      });

      const results = AlgoUtils.bfsTraversal(mockRoot, 'cat');
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ id: 'doc1', score: 1.0 });
    });

    test('should respect maxResults parameter', () => {
      // Build test trie with multiple matches
      const node1: IndexNode = { id: 'doc1', score: 1.0, children: new Map() };
      const node2: IndexNode = { id: 'doc2', score: 0.9, children: new Map() };
      
      mockRoot.children.set('t', {
        children: new Map([
          ['e', {
            children: new Map([
              ['s', {
                children: new Map([
                  ['t', node1]
                ]),
                score: 0
              }]
            ]),
            score: 0
          }]
        ]),
        score: 0
      });
      mockRoot.children.set('b', {
        children: new Map([
          ['e', {
            children: new Map([
              ['s', {
                children: new Map([
                  ['t', node2]
                ]),
                score: 0
              }]
            ]),
            score: 0
          }]
        ]),
        score: 0
      });

      const results = AlgoUtils.bfsTraversal(mockRoot, 'test', 1);
      expect(results).toHaveLength(1);
    });

    test('should handle empty trie', () => {
      const results = AlgoUtils.bfsTraversal(mockRoot, 'test');
      expect(results).toHaveLength(0);
    });
  });

  describe('dfsTraversal', () => {
    test('should find exact matches', () => {
      // Build test trie: "dog" -> doc3
      const doc3Node: IndexNode = { id: 'doc3', score: 0.9, children: new Map() };
      
      mockRoot.children.set('d', {
        children: new Map([
          ['o', {
            children: new Map([
              ['g', doc3Node]
            ]),
            score: 0
          }]
        ]),
        score: 0
      });

      const results = AlgoUtils.dfsTraversal(mockRoot, 'dog');
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ id: 'doc3', score: 0.9 });
    });

    test('should sort results by score', () => {
      // Build trie with multiple matches with different scores
      const node1: IndexNode = { id: 'doc1', score: 0.5, children: new Map() };
      const node2: IndexNode = { id: 'doc2', score: 0.8, children: new Map() };
      
      mockRoot.children.set('t', {
        children: new Map([
          ['e', {
            children: new Map([
              ['s', {
                children: new Map([
                  ['t', node1]
                ]),
                score: 0
              }]
            ]),
            score: 0
          }]
        ]),
        score: 0
      });
      mockRoot.children.set('b', {
        children: new Map([
          ['e', {
            children: new Map([
              ['s', {
                children: new Map([
                  ['t', node2]
                ]),
                score: 0
              }]
            ]),
            score: 0
          }]
        ]),
        score: 0
      });

      const results = AlgoUtils.dfsTraversal(mockRoot, 'test', 2);
      expect(results).toHaveLength(2);
      expect(results[0].score).toBeGreaterThan(results[1].score);
    });
  });

  describe('fuzzySearch', () => {
    test('should find approximate matches', () => {
      // Build trie with "hello" -> doc1
      const doc1Node: IndexNode = { id: 'doc1', score: 1.0, children: new Map() };
      
      mockRoot.children.set('h', {
        children: new Map([
          ['e', {
            children: new Map([
              ['l', {
                children: new Map([
                  ['l', {
                    children: new Map([
                      ['o', doc1Node]
                    ]),
                    score: 0
                  }]
                ]),
                score: 0
              }]
            ]),
            score: 0
          }]
        ]),
        score: 0
      });

      const results = AlgoUtils.fuzzySearch(mockRoot, 'helo', 2);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('doc1');
      expect(results[0].distance).toBe(1); // One deletion needed
    });

    test('should respect maxDistance parameter', () => {
      // Build trie with "hello" -> doc1
      const doc1Node: IndexNode = { id: 'doc1', score: 1.0, children: new Map() };
      
      mockRoot.children.set('h', {
        children: new Map([
          ['e', {
            children: new Map([
              ['l', {
                children: new Map([
                  ['l', {
                    children: new Map([
                      ['o', doc1Node]
                    ]),
                    score: 0
                  }]
                ]),
                score: 0
              }]
            ]),
            score: 0
          }]
        ]),
        score: 0
      });

      const results = AlgoUtils.fuzzySearch(mockRoot, 'help', 1);
      expect(results).toHaveLength(0); // Distance would be 2, exceeds maxDistance
    });
  });

  describe('enhancedSearch', () => {
    test('should combine multiple scoring factors', () => {
      // Setup test data
      const documents = new Map<string, IndexableDocument>();
      documents.set('doc1', {
        id: 'doc1',
        content: { text: 'test document one' }
      });
      documents.set('doc2', {
        id: 'doc2',
        content: { text: 'test document two' }
      });

      const documentLinks: DocumentLink[] = [
        { fromId: 'doc1', toId: 'doc2', weight: 1 }
      ];

      // Build trie with both documents
      const doc1Node: IndexNode = { id: 'doc1', score: 0.8, children: new Map() };
      const doc2Node: IndexNode = { id: 'doc2', score: 0.6, children: new Map() };
      
      mockRoot.children.set('t', {
        children: new Map([
          ['e', {
            children: new Map([
              ['s', {
                children: new Map([
                  ['t', doc1Node]
                ]),
                score: 0
              }]
            ]),
            score: 0
          }]
        ]),
        score: 0
      });

      const results = AlgoUtils.enhancedSearch(mockRoot, 'test', documents, documentLinks);
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('score');
      expect(results[0]).toHaveProperty('rank');
    });

    test('should handle empty document links', () => {
      const documents = new Map<string, IndexableDocument>();
      documents.set('doc1', {
        id: 'doc1',
        content: { text: 'test document' }
      });

      const results = AlgoUtils.enhancedSearch(mockRoot, 'test', documents, []);
      expect(Array.isArray(results)).toBe(true);
    });
  });
});