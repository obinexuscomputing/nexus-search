import { TrieSearch } from "@/algorithms/trie";
import { IndexedDocument } from "@/index";

describe('TrieSearch', () => {
    let trieSearch: TrieSearch;

    beforeEach(() => {
        trieSearch = new TrieSearch();
    });

    const createMockDocument = (id: string, fields: Record<string, any>): IndexedDocument => ({
        id,
        fields,
        metadata: {
            indexed: Date.now(),
            lastModified: Date.now()
        }
    });

    describe('Document Management', () => {
        it('should add document correctly', () => {
            const doc = createMockDocument('doc1', {
                title: 'Test Document',
                content: 'This is a test document',
                tags: ['test', 'document']
            });

            trieSearch.addDocument(doc);
            const results = trieSearch.search('test');
            
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].docId).toBe('doc1');
        });

        it('should handle documents with array fields', () => {
            const doc = createMockDocument('doc1', {
                title: 'Test',
                tags: ['tag1', 'tag2']
            });

            trieSearch.addDocument(doc);
            
            const results1 = trieSearch.search('tag1');
            const results2 = trieSearch.search('tag2');

            expect(results1.length).toBeGreaterThan(0);
            expect(results2.length).toBeGreaterThan(0);
        });

        it('should remove document correctly', () => {
            const doc = createMockDocument('doc1', {
                title: 'Test',
                content: 'Content'
            });

            trieSearch.addDocument(doc);
            trieSearch.removeDocument('doc1');

            const results = trieSearch.search('test');
            expect(results.length).toBe(0);
        });
    });

    describe('Search Functionality', () => {
        beforeEach(() => {
            const docs = [
                createMockDocument('doc1', {
                    title: 'JavaScript Tutorial',
                    content: 'Learn JavaScript programming'
                }),
                createMockDocument('doc2', {
                    title: 'Python Guide',
                    content: 'Introduction to Python'
                }),
                createMockDocument('doc3', {
                    title: 'JavaScript Advanced',
                    content: 'Advanced JavaScript concepts'
                })
            ];

            docs.forEach(doc => trieSearch.addDocument(doc));
        });

        it('should perform exact search correctly', () => {
            const results = trieSearch.search('javascript');
            expect(results.length).toBe(2);
            expect(results.map(r => r.docId)).toContain('doc1');
            expect(results.map(r => r.docId)).toContain('doc3');
        });

        it('should perform fuzzy search correctly', () => {
            const results = trieSearch.search('javascrpt', { fuzzy: true, maxDistance: 2 });
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].distance).toBeLessThanOrEqual(2);
        });

        it('should perform prefix search correctly', () => {
            const results = trieSearch.search('java', { prefixMatch: true });
            expect(results.length).toBe(2);
        });

        it('should respect maxResults option', () => {
            const results = trieSearch.search('javascript', { maxResults: 1 });
            expect(results.length).toBe(1);
        });

        it('should respect minScore option', () => {
            const results = trieSearch.search('javascript', { minScore: 0.9 });
            expect(results.every(r => r.score >= 0.9)).toBeTruthy();
        });

        it('should handle case sensitivity correctly', () => {
            const results1 = trieSearch.search('JAVASCRIPT', { caseSensitive: false });
            const results2 = trieSearch.search('JAVASCRIPT', { caseSensitive: true });

            expect(results1.length).toBeGreaterThan(0);
            expect(results2.length).toBe(0);
        });
    });

    describe('Suggestions', () => {
        beforeEach(() => {
            const docs = [
                createMockDocument('doc1', { title: 'JavaScript' }),
                createMockDocument('doc2', { title: 'Java' }),
                createMockDocument('doc3', { title: 'TypeScript' }),
                createMockDocument('doc4', { title: 'Python' })
            ];

            docs.forEach(doc => trieSearch.addDocument(doc));
        });

        it('should return correct suggestions', () => {
            const suggestions = trieSearch.getSuggestions('ja');
            expect(suggestions).toContain('javascript');
            expect(suggestions).toContain('java');
            expect(suggestions).not.toContain('python');
        });

        it('should respect maxResults in suggestions', () => {
            const suggestions = trieSearch.getSuggestions('ja', 1);
            expect(suggestions.length).toBe(1);
        });

        it('should return empty array for non-matching prefix', () => {
            const suggestions = trieSearch.getSuggestions('xyz');
            expect(suggestions.length).toBe(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty documents', () => {
            const doc = createMockDocument('doc1', {});
            trieSearch.addDocument(doc);
            expect(() => trieSearch.search('test')).not.toThrow();
        });

        it('should handle document without ID', () => {
            const doc = createMockDocument('', { title: 'Test' });
            trieSearch.addDocument(doc);
            const results = trieSearch.search('test');
            expect(results.length).toBe(0);
        });

        it('should handle very long words', () => {
            const longWord = 'a'.repeat(100);
            const doc = createMockDocument('doc1', { title: longWord });
            trieSearch.addDocument(doc);
            const results = trieSearch.search(longWord);
            expect(results.length).toBe(0); // Should not index words longer than maxWordLength
        });

        it('should handle special characters', () => {
            const doc = createMockDocument('doc1', { 
                title: 'Test!@#$%^&*()',
                content: 'Content with spaces   and   tabs'
            });
            trieSearch.addDocument(doc);
            const results = trieSearch.search('test');
            expect(results.length).toBe(1);
        });
    });

    describe('Performance', () => {
        it('should handle large number of documents', () => {
            const docs = Array.from({ length: 1000 }, (_, i) => 
                createMockDocument(`doc${i}`, {
                    title: `Document ${i}`,
                    content: `Content ${i} with some random words test sample data`
                })
            );

            const startIndex = performance.now();
            docs.forEach(doc => trieSearch.addDocument(doc));
            const indexTime = performance.now() - startIndex;

            const startSearch = performance.now();
            const results = trieSearch.search('test');
            const searchTime = performance.now() - startSearch;

            expect(indexTime).toBeLessThan(1000); // 1 second max for indexing
            expect(searchTime).toBeLessThan(100);  // 100ms max for search
            expect(results.length).toBeGreaterThan(0);
        });
    });
});