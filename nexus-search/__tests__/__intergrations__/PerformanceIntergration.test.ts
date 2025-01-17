import { SearchEngine } from "@/index";


describe('Performance Integration', () => {
    let searchEngine: SearchEngine;
    
    beforeEach(async () => {
      searchEngine = new SearchEngine(testConfig);
      await searchEngine.initialize();
    });
  
    test('should handle rapid successive searches', async () => {
      await searchEngine.addDocuments(sampleDocuments);
  
      const searches = Array.from({ length: 100 }, () => 
        searchEngine.search('javascript')
      );
  
      const startTime = performance.now();
      await Promise.all(searches);
      const duration = performance.now() - startTime;
  
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  
    test('should maintain performance with growing index', async () => {
      const batchSize = 100;
      const batches = 10;
      const searchTimes: number[] = [];
  
      for (let i = 0; i < batches; i++) {
        const documents = Array.from({ length: batchSize }, (_, j) => ({
          title: `Document ${i * batchSize + j}`,
          content: `Content for document ${i * batchSize + j}`,
          tags: ['test', `tag-${i}`]
        }));
  
        await searchEngine.addDocuments(documents);
  
        const startTime = performance.now();
        await searchEngine.search('document');
        searchTimes.push(performance.now() - startTime);
      }
  
      // Verify search time doesn't grow linearly with index size
      const averageEarly = searchTimes.slice(0, 3).reduce((a, b) => a + b) / 3;
      const averageLate = searchTimes.slice(-3).reduce((a, b) => a + b) / 3;
      
      expect(averageLate / averageEarly).toBeLessThan(3); // Should not slow down more than 3x
    });
  
    test('should handle concurrent operations', async () => {
      const operations = [];
      
      // Add documents
      operations.push(searchEngine.addDocuments(sampleDocuments));
      
      // Perform searches
      operations.push(searchEngine.search('javascript'));
      operations.push(searchEngine.search('typescript'));
      
      // Update index
      operations.push(searchEngine.addDocuments([{
        title: 'New Document',
        content: 'Fresh content',
        tags: ['new']
      }]));
  
      await expect(Promise.all(operations)).resolves.not.toThrow();
    });
  });