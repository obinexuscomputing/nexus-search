import { SearchStorage } from "@/storage";

describe('SearchStorage', () => {
  let storage: SearchStorage;

  beforeEach(() => {
    storage = new SearchStorage();
  });

  test('should initialize database', async () => {
    await expect(storage.initialize()).resolves.not.toThrow();
  });

  test('should store and retrieve index', async () => {
    await storage.initialize();
    const testData = { test: 'data' };
    
    await storage.storeIndex('test-key', testData);
    const retrieved = await storage.getIndex('test-key');
    
    expect(retrieved).toEqual(testData);
  });
});
