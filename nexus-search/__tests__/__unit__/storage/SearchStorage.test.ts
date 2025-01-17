import { SearchStorage } from "@/storage";

describe('SearchStorage', () => {
  let storage: SearchStorage;

  beforeEach(async () => {
    storage = new SearchStorage();
    await storage.initialize();
  });

  afterEach(async () => {
    await storage.clearIndices();
  });

  test('should store and retrieve index data', async () => {
    const testData = { test: 'data' };
    await storage.storeIndex('test-key', testData);
    
    const retrieved = await storage.getIndex('test-key');
    expect(retrieved).toEqual(testData);
  });
});

