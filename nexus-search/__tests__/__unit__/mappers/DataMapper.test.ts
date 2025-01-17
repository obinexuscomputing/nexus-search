import { DataMapper } from "@/mappers";


describe('DataMapper', () => {
  let mapper: DataMapper;

  beforeEach(() => {
    mapper = new DataMapper();
  });

  describe('Basic Operations', () => {
    test('should map single data point', () => {
      mapper.mapData('key1', 'doc1');
      const docs = mapper.getDocuments('key1');
      expect(docs.has('doc1')).toBe(true);
    });

    test('should handle multiple documents for same key', () => {
      mapper.mapData('key1', 'doc1');
      mapper.mapData('key1', 'doc2');
      const docs = mapper.getDocuments('key1');
      expect(docs.size).toBe(2);
      expect(docs.has('doc1')).toBe(true);
      expect(docs.has('doc2')).toBe(true);
    });

    test('should handle multiple keys for same document', () => {
      mapper.mapData('key1', 'doc1');
      mapper.mapData('key2', 'doc1');
      expect(mapper.getDocuments('key1').has('doc1')).toBe(true);
      expect(mapper.getDocuments('key2').has('doc1')).toBe(true);
    });

    test('should return empty set for non-existent key', () => {
      expect(mapper.getDocuments('nonexistent').size).toBe(0);
    });

    test('should get all mapped keys', () => {
      mapper.mapData('key1', 'doc1');
      mapper.mapData('key2', 'doc2');
      const keys = mapper.getAllKeys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    test('should clear all mappings', () => {
      mapper.mapData('key1', 'doc1');
      mapper.mapData('key2', 'doc2');
      mapper.clear();
      expect(mapper.getAllKeys().length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty key', () => {
      mapper.mapData('', 'doc1');
      expect(mapper.getDocuments('').has('doc1')).toBe(true);
    });

    test('should handle empty document id', () => {
      mapper.mapData('key1', '');
      expect(mapper.getDocuments('key1').has('')).toBe(true);
    });

    test('should handle special characters in keys', () => {
      const specialKey = '@#$%^&*()';
      mapper.mapData(specialKey, 'doc1');
      expect(mapper.getDocuments(specialKey).has('doc1')).toBe(true);
    });
  });
});

