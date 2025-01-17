# @obinexuscomputing/nexus-search Documentation

## Table of Contents
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Configuration](#configuration)
- [Best Practices](#best-practices)

## Installation

```bash
npm install @obinexuscomputing/nexus-search
# or
yarn add @obinexuscomputing/nexus-search
```

## Quick Start

```typescript
import { SearchEngine } from '@obinexuscomputing/nexus-search';

// Initialize search engine
const searchEngine = new SearchEngine({
  name: 'my-search-index',
  version: 1,
  fields: ['title', 'content', 'tags']
});

// Add documents
await searchEngine.addDocuments([
  {
    title: 'Getting Started',
    content: 'Quick start guide for NexusSearch',
    tags: ['documentation', 'guide']
  }
]);

// Perform search
const results = await searchEngine.search('quick start');
```

## API Reference

### SearchEngine

The main class for managing search operations.

#### Constructor
```typescript
constructor(config: IndexConfig)
```

Parameters:
- `config`: IndexConfig object with the following properties:
  - `name`: string - Unique identifier for the index
  - `version`: number - Index version for migration support
  - `fields`: string[] - Document fields to index
  - `options?`: IndexOptions - Optional configuration settings

#### Methods

##### `initialize()`
```typescript
async initialize(): Promise<void>
```
Initializes the search engine and underlying storage.

##### `addDocuments()`
```typescript
async addDocuments<T>(documents: T[]): Promise<void>
```
Adds documents to the search index.

##### `search()`
```typescript
async search<T>(
  query: string, 
  options?: SearchOptions
): Promise<SearchResult<T>[]>
```
Performs a search operation.

Parameters:
- `query`: Search query string
- `options`: Optional search configuration
  - `fuzzy`: boolean - Enable fuzzy matching
  - `maxResults`: number - Maximum results to return
  - `threshold`: number - Minimum relevance score
  - `fields`: string[] - Fields to search in

Returns:
- Array of SearchResult objects containing matches

##### `clearIndex()`
```typescript
async clearIndex(): Promise<void>
```
Clears all indexed data.

### Types

#### SearchOptions
```typescript
interface SearchOptions {
  fuzzy?: boolean;
  maxResults?: number;
  threshold?: number;
  fields?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
```

#### SearchResult
```typescript
interface SearchResult<T> {
  item: T;
  score: number;
  matches: string[];
  highlights?: Record<string, string[]>;
}
```

#### IndexConfig
```typescript
interface IndexConfig {
  name: string;
  version: number;
  fields: string[];
  options?: IndexOptions;
}
```

## Examples

### Basic Search Implementation
```typescript
import { SearchEngine, SearchOptions } from '@obinexuscomputing/nexus-search';

// Initialize engine
const searchEngine = new SearchEngine({
  name: 'products',
  version: 1,
  fields: ['name', 'description', 'categories']
});

// Add documents
await searchEngine.addDocuments([
  {
    name: 'Smartphone X',
    description: 'Latest smartphone with advanced features',
    categories: ['electronics', 'phones']
  },
  {
    name: 'Laptop Pro',
    description: 'Professional laptop for developers',
    categories: ['electronics', 'computers']
  }
]);

// Search with options
const searchOptions: SearchOptions = {
  fuzzy: true,
  maxResults: 10,
  threshold: 0.5
};

const results = await searchEngine.search('smartphone', searchOptions);
```

### Advanced Usage with Custom Configuration
```typescript
const config: IndexConfig = {
  name: 'advanced-search',
  version: 1,
  fields: ['title', 'content', 'metadata.tags'],
  options: {
    caseSensitive: false,
    stemming: true,
    stopWords: ['the', 'and', 'or'],
    minWordLength: 2,
    maxWordLength: 50,
    fuzzyThreshold: 0.8
  }
};

const searchEngine = new SearchEngine(config);

// Add nested documents
await searchEngine.addDocuments([
  {
    title: 'Advanced Search Techniques',
    content: 'Learn about advanced search algorithms',
    metadata: {
      tags: ['search', 'algorithms', 'advanced'],
      author: 'John Doe'
    }
  }
]);

// Search with field-specific options
const results = await searchEngine.search('advanced algorithms', {
  fields: ['title', 'metadata.tags'],
  fuzzy: true,
  maxResults: 5
});
```

## Configuration

### Index Configuration
Configure the search index based on your needs:

```typescript
const config: IndexConfig = {
  name: 'custom-index',
  version: 1,
  fields: ['field1', 'field2'],
  options: {
    // Index-level options
    caseSensitive: false,
    stemming: true,
    stopWords: ['custom', 'stop', 'words'],
    
    // Performance options
    minWordLength: 2,
    maxWordLength: 50,
    fuzzyThreshold: 0.8
  }
};
```

### Search Options
Customize search behavior:

```typescript
const searchOptions: SearchOptions = {
  // Search options
  fuzzy: true,
  maxResults: 20,
  threshold: 0.6,
  
  // Field options
  fields: ['specific', 'fields'],
  
  // Sorting options
  sortBy: 'score',
  sortOrder: 'desc',
  
  // Pagination
  page: 1,
  pageSize: 10
};
```

## Best Practices

1. **Index Configuration**
   - Choose appropriate fields for indexing
   - Use meaningful index names
   - Configure options based on data characteristics

2. **Performance Optimization**
   - Index only necessary fields
   - Use appropriate fuzzy thresholds
   - Implement pagination for large result sets

3. **Search Implementation**
   - Use fuzzy search for better matches
   - Implement proper error handling
   - Cache frequent searches

4. **Storage Management**
   - Regularly clear unused indices
   - Monitor storage usage
   - Implement data cleanup strategies