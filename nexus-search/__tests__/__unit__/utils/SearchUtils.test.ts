describe('SearchUtils', () => {
  describe('createSearchableFields', () => {
    test('should handle simple fields', () => {
      const doc = { title: 'Test', content: 'Content' };
      const result = createSearchableFields(doc, ['title', 'content']);
      expect(result.title).toBe('test');
      expect(result.content).toBe('content');
    });

    test('should handle nested fields', () => {
      const doc = { 
        metadata: { 
          title: 'Test',
          tags: ['one', 'two'] 
        }
      };
      const result = createSearchableFields(doc, ['metadata.title', 'metadata.tags']);
      expect(result['metadata.title']).toBe('test');
      expect(result['metadata.tags']).toBe('one two');
    });

    test('should handle arrays', () => {
      const doc = { tags: ['Test', 'Tags'] };
      const result = createSearchableFields(doc, ['tags']);
      expect(result.tags).toBe('test tags');
    });

    test('should handle missing fields', () => {
      const doc = { title: 'Test' };
      const result = createSearchableFields(doc, ['title', 'nonexistent']);
      expect(result.title).toBe('test');
      expect(result.nonexistent).toBeUndefined();
    });
  });

  describe('normalizeFieldValue', () => {
    test('should handle strings', () => {
      expect(normalizeFieldValue('Test')).toBe('test');
    });

    test('should handle arrays', () => {
      expect(normalizeFieldValue(['Test', 'Array'])).toBe('test array');
    });

    test('should handle objects', () => {
      expect(normalizeFieldValue({ key: 'Value' })).toBe('value');
    });

    test('should handle numbers', () => {
      expect(normalizeFieldValue(123)).toBe('123');
    });

    test('should handle null/undefined', () => {
      expect(normalizeFieldValue(null)).toBe('null');
      expect(normalizeFieldValue(undefined)).toBe('undefined');
    });
  });

  describe('optimizeIndex', () => {
    test('should remove duplicates', () => {
      const data = [
        { id: 1, value: 'test' },
        { id: 1, value: 'test' }
      ];
      const result = optimizeIndex(data);
      expect(result.length).toBe(1);
    });

    test('should sort data', () => {
      const data = [
        { id: 2, value: 'b' },
        { id: 1, value: 'a' }
      ];
      const result = optimizeIndex(data);
      expect(result[0].id).toBe(1);
    });

    test('should handle empty array', () => {
      expect(optimizeIndex([])).toEqual([]);
    });

    test('should handle complex objects', () => {
      const data = [
        { nested: { value: 2 } },
        { nested: { value: 1 } }
      ];
      const result = optimizeIndex(data);
      expect(result[0].nested.value).toBe(1);
    });
  });
});

function createSearchableFields(doc: { title: string; content: string; }, arg1: string[]) {
  throw new Error("Function not implemented.");
}
