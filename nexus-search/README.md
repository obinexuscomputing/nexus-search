
# OBINexusComputing - Computing from the ![Heart](images/heart-icon.svg)

# NexusSearch
A high-performance search indexing and query system that uses a trie data structure and BFS/DFS algorithms for fast full-text search with fuzzy matching, real-time updates, and flexible configuration.

# Repo:
[https://gitlab.com/obinexuscomputing.pkg/nexus-search](Nexus Search on GitLab)

## Features

- Fast full-text search with fuzzy matching using a trie data structure
- Real-time indexing and updates
- Customizable search options and scoring
- TypeScript support
- Works in both browser and Node.js environments
- Persistent storage with IndexedDB
- Support for nested document fields
- Built-in caching system

## Search Philosophy

NexusSearch uses a trie data structure to store the indexed documents. Each node in the trie represents characters, and the path from the root to a leaf node represents a word from the indexed documents. This structure allows for efficient prefix-based searches and fuzzy matching.

The search process involves traversing the trie using either a breadth-first search (BFS) or depth-first search (DFS) algorithm. BFS is generally better for finding the most relevant results, as it explores all nodes at the current depth before moving on to the next depth level. DFS, on the other hand, is better for finding the first matching results quickly.

The choice between BFS and DFS can be made based on the specific use case and requirements of the search engine. For example, if speed is the primary concern, DFS might be the better choice. If relevance is more important, BFS could be the preferred algorithm.


Use it with a html search bar,node or your favourite library.

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

// Initialize and add documents
await searchEngine.initialize();
await searchEngine.addDocuments([
  {
    title: 'Getting Started',
    content: 'Quick start guide for NexusSearch',
    tags: ['documentation', 'guide']
  }
]);

// Perform search with options
const results = await searchEngine.search('quick start', {
  fuzzy: true,
  maxResults: 5,
  algorithm: 'bfs' // or 'dfs'
});
```

## Core Concepts

### Search Engine Configuration

```typescript
const config: IndexConfig = {
  name: 'custom-index',      // Unique identifier for the index
  version: 1,                // Version for migration support
  fields: ['title', 'tags'], // Fields to index
  options: {
    caseSensitive: false,
    stemming: true,
    stopWords: ['the', 'and', 'or'],
    fuzzyThreshold: 0.8
  }
};
```

### Search Options

```typescript
const searchOptions: SearchOptions = {
  fuzzy: true,              // Enable fuzzy matching
  maxResults: 20,           // Limit results
  threshold: 0.6,           // Minimum relevance score
  fields: ['title', 'tags'], // Fields to search in
  algorithm: 'bfs'          // or 'dfs'
};
```

## Use Cases

### Document Search

```typescript
const searchEngine = new SearchEngine({
  name: 'documents',
  version: 1,
  fields: ['title', 'content', 'author', 'tags']
});

await searchEngine.addDocuments([
  {
    title: 'TypeScript Guide',
    content: 'Introduction to TypeScript...',
    author: 'John Doe',
    tags: ['typescript', 'programming']
  }
]);

const results = await searchEngine.search('typescript');
```

### Real-time Search

```typescript
class RealTimeSearch {
  private searchEngine: SearchEngine;
  private updateQueue: any[] = [];

  constructor() {
    this.searchEngine = new SearchEngine({
      name: 'realtime-search',
      version: 1,
      fields: ['title', 'content']
    });
  }

  async addDocument(document: any) {
    await this.searchEngine.addDocuments([document]);
  }

  async search(query: string) {
    return this.searchEngine.search(query, {
      maxResults: 10,
      fuzzy: true,
      algorithm: 'bfs'
    });
  }
}
```

## API Reference

### SearchEngine

The main class for managing search operations.

#### Methods

- `initialize()`: Initialize the search engine
- `addDocuments<T>(documents: T[])`: Add documents to the index
- `search<T>(query: string, options?: SearchOptions)`: Perform a search
- `clearIndex()`: Clear all indexed data

### SearchResult

```typescript
interface SearchResult<T> {
  item: T;                    // The matched document
  score: number;              // Relevance score
  matches: string[];          // Matched terms
  highlights?: Record<string, string[]>; // Highlighted matches
}
```

## Best Practices

1. **Index Configuration**
   - Choose appropriate fields for indexing
   - Configure options based on data characteristics
   - Use meaningful index names

2. **Performance**
   - Index only necessary fields
   - Implement pagination for large result sets
   - Use appropriate fuzzy thresholds
   - Choose the appropriate search algorithm (BFS or DFS) based on requirements

3. **Search Implementation**
   - Use fuzzy search for better matches
   - Implement proper error handling
   - Cache frequent searches

## Example Projects

- [Vanilla JS Demo](./fixtures/vanilla/index.html)
- [React Integration](./fixtures/react/index.html)
- [Vue.js Implementation](./fixtures/vue/index.html)

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Run demos
npm run demo
```

## Contributing

Coming soon...

## Support and Community
- [Buy Me a Coffee](https://buymeacoffee.com/obinexuscomputing)
- [GitLab](https://gitlab.com/obinexuscomputng)
- [GitHub](https://github.com/obinexuscomputing)
