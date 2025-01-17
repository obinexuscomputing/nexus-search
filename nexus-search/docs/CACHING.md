# NexusSearch Caching System Documentation

## Overview
NexusSearch implements a flexible caching system that supports both LRU (Least Recently Used) and MRU (Most Recently Used) caching strategies. The cache helps reduce computation load and improve search response times by storing frequently accessed search results.

## Features
- Configurable cache size and TTL (Time To Live)
- Support for LRU and MRU eviction strategies
- Cache statistics and performance monitoring
- Automatic cache pruning of expired entries
- Thread-safe operations

## Basic Usage

### Initialization
```typescript
import { CacheManager } from '@obinexuscomputing/nexus-search';

// Create cache with default settings (LRU, 1000 entries, 5 minutes TTL)
const cache = new CacheManager();

// Or with custom settings
const cache = new CacheManager(
    2000,    // maxSize
    10,      // TTL in minutes
    'LRU'    // strategy
);
```

### Basic Operations
```typescript
// Store search results
cache.set('query-key', searchResults);

// Retrieve results
const results = cache.get('query-key');
if (results) {
    // Use cached results
} else {
    // Cache miss - perform search
}

// Clear the cache
cache.clear();
```

## Cache Strategies

### LRU (Least Recently Used)
The default strategy evicts the least recently accessed items when the cache is full.
```typescript
const cache = new CacheManager(1000, 5, 'LRU');
```

### MRU (Most Recently Used)
Evicts the most recently used items, useful for certain access patterns.
```typescript
const cache = new CacheManager(1000, 5, 'MRU');

// Switch strategy at runtime
cache.setStrategy('MRU');
```

## Monitoring and Analysis

### Cache Statistics
```typescript
const stats = cache.getStats();
console.log(stats);
// Output:
// {
//   hits: 150,
//   misses: 30,
//   evictions: 10,
//   size: 850,
//   maxSize: 1000,
//   hitRate: 0.833,
//   strategy: 'LRU'
// }
```

### Performance Analysis
```typescript
const analysis = cache.analyze();
console.log(analysis);
// Output:
// {
//   hitRate: 0.833,
//   averageAccessCount: 2.5,
//   mostAccessedKeys: [
//     { key: 'popular-query', count: 15 },
//     { key: 'common-search', count: 12 }
//   ]
// }
```

## Advanced Features

### Manual Cache Pruning
Remove expired entries manually:
```typescript
const prunedCount = cache.prune();
console.log(`Pruned ${prunedCount} expired entries`);
```

### Integration with SearchEngine
The cache is automatically integrated with NexusSearch's SearchEngine:
```typescript
const engine = new SearchEngine({
    name: 'search-engine',
    version: 1,
    fields: ['content'],
    // Cache configuration
    cache: {
        maxSize: 1000,
        ttlMinutes: 5,
        strategy: 'LRU'
    }
});

// Cache is automatically used for search results
const results = await engine.search('query');
```

## Best Practices

1. **Cache Size**: Set the cache size based on your application's memory constraints and typical query patterns.
   ```typescript
   const cache = new CacheManager(
       Math.floor(availableMemory * 0.1),  // Use 10% of available memory
       5
   );
   ```

2. **TTL Configuration**: Choose TTL based on how frequently your data changes.
   ```typescript
   // For frequently changing data
   const cache = new CacheManager(1000, 1);  // 1 minute TTL

   // For stable data
   const cache = new CacheManager(1000, 60); // 1 hour TTL
   ```

3. **Strategy Selection**:
   - Use LRU for general-purpose caching
   - Use MRU when older entries are more likely to be accessed again

4. **Regular Monitoring**:
   ```typescript
   setInterval(() => {
       const stats = cache.getStats();
       if (stats.hitRate < 0.5) {
           // Consider adjusting cache size or TTL
       }
   }, 300000); // Monitor every 5 minutes
   ```

## Performance Considerations

- The cache uses a Map for O(1) access time
- Access order is maintained for efficient eviction
- Automatic pruning prevents memory leaks
- Statistics collection has minimal overhead

## Error Handling

```typescript
try {
    cache.set('key', data);
} catch (error) {
    console.error('Cache operation failed:', error);
    // Fall back to non-cached operation
}
```

## Memory Management

The cache automatically manages memory through:
- Size-based eviction
- TTL expiration
- Manual pruning capability
- Efficient data structures

For more information, refer to the [API Reference](./API.md) or [Configuration Guide](./CONFIGURATION.md).