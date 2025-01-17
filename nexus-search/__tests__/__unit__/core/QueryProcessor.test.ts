
// QueryProcessor.test.ts
import { QueryProcessor } from "@/core";

describe('QueryProcessor', () => {
  let queryProcessor: QueryProcessor;

  beforeEach(() => {
    queryProcessor = new QueryProcessor();
  });

  describe('Query Processing', () => {
    test('should handle basic query processing', () => {
      const result = queryProcessor.process('test query');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toBe('test query');
    });

    test('should remove stop words', () => {
      const result = queryProcessor.process('the test and query');
      expect(result).not.toContain('the');
      expect(result).not.toContain('and');
      expect(result).toBe('test query');
    });

    test('should handle empty query', () => {
      const result = queryProcessor.process('');
      expect(result).toBe('');
    });

    test('should normalize query terms', () => {
      const result = queryProcessor.process('Testing QUERIES');
      expect(result).toBe('test queri');
    });

    test('should handle operators', () => {
      const result = queryProcessor.process('+required -excluded');
      expect(result).toBe('+required -excluded');
    });

    test('should process modifiers', () => {
      const result = queryProcessor.process('field:value');
      expect(result).toBe('field:value');
    });
  });

  describe('Token Classification', () => {
    test('should classify operator tokens', () => {
      const result = queryProcessor.process('+include -exclude');
      expect(result).toBe('+include -exclude');
    });

    test('should classify modifier tokens', () => {
      const result = queryProcessor.process('title:test content:example');
      expect(result).toBe('title:test content:example');
    });

    test('should classify regular terms', () => {
      const result = queryProcessor.process('regular search terms');
      expect(result).toBe('regular search term');
    });
  });

  describe('Token Processing', () => {
    test('should handle stemming', () => {
      const result = queryProcessor.process('running tests testing');
      expect(result).toBe('run test test');
    });

    test('should handle multiple spaces', () => {
      const result = queryProcessor.process('test    multiple    spaces');
      expect(result).toBe('test multiple space');
    });

    test('should preserve quotes', () => {
      const result = queryProcessor.process('"exact phrase" other terms');
      expect(result).toBe('"exact phrase" other term');
    });

    test('should handle quoted stop words', () => {
      const result = queryProcessor.process('"the quick" and "the dead"');
      expect(result).toBe('"the quick" "the dead"');
    });
  });

  describe('Error Handling', () => {
    test('should handle null input', () => {
      const result = queryProcessor.process(null);
      expect(result).toBe('');
    });

    test('should handle undefined input', () => {
      const result = queryProcessor.process(undefined);
      expect(result).toBe('');
    });

    test('should handle non-string input', () => {
      const result = queryProcessor.process(123 as any);
      expect(result).toBe('123');
    });
  });

  describe('Special Cases', () => {
    test('should handle special characters', () => {
      const result = queryProcessor.process('test@email.com');
      expect(result).toBe('test@email.com');
    });

    test('should handle numbers', () => {
      const result = queryProcessor.process('test123');
      expect(result).toBe('test123');
    });

    test('should handle mixed case with operators', () => {
      const result = queryProcessor.process('+TEST -EXCLUDE');
      expect(result).toBe('+test -exclude');
    });

    test('should handle empty quotes', () => {
      const result = queryProcessor.process('""');
      expect(result).toBe('""');
    });

    test('should handle nested quotes', () => {
      const result = queryProcessor.process('"outer "inner" text"');
      expect(result).toBe('"outer "inner" text"');
    });

    test('should maintain word boundaries', () => {
      const result = queryProcessor.process('testing tested tests');
      expect(result).toBe('test test test');
    });
  });
});