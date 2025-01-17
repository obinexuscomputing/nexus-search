import { SearchEngine } from "@/index";
import { IndexConfig, SearchOptions } from "@/types";


describe('Search Flow Integration', () => {
  let searchEngine: SearchEngine;
  const testConfig: IndexConfig = {
    name: 'integration-test',
    version: 1,
    fields: ['title', 'content', 'tags'],
    options: {
      stemming: true,
      stopWords: ['the', 'a', 'an'],
    },
  };

  beforeEach(async () => {
    searchEngine = new SearchEngine(testConfig);
    await searchEngine.initialize();
  });

  test('full search flow', async () => {
    // Test data
    const documents = [
      {
        title: 'JavaScript Programming',
        content: 'Learn JavaScript programming',
        tags: ['programming', 'web'],
      },
      {
        title: 'Python Basics',
        content: 'Introduction to Python',
        tags: ['programming', 'python'],
      },
    ];

    // Index documents
    await searchEngine.addDocuments(documents);

    // Test different search scenarios
    const searchScenarios: Array<{
      query: string;
      options?: SearchOptions;
      expectedCount: number;
      expectedTitle: string;
    }> = [
      {
        query: 'javascript',
        expectedCount: 1,
        expectedTitle: 'JavaScript Programming',
      },
      {
        query: 'programming',
        expectedCount: 2,
        expectedTitle: expect.stringMatching(/JavaScript|Python/),
      },
      {
        query: 'python',
        options: { fuzzy: true },
        expectedCount: 1,
        expectedTitle: 'Python Basics',
      },
    ];

    for (const scenario of searchScenarios) {
      const results = await searchEngine.search(
        scenario.query,
        scenario.options
      );

      expect(results).toHaveLength(scenario.expectedCount);
      if (results.length > 0) {
        expect(results[0].item.title).toEqual(scenario.expectedTitle);
      }
    }
  });
});