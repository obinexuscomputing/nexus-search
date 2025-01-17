# @obinexuscomputing/nexus-search usage

## Common Use Cases

### 1. Document Search System

```typescript
import { SearchEngine, SearchOptions } from '@obinexuscomputing/nexus-search';

interface Document {
  title: string;
  content: string;
  author: string;
  tags: string[];
  createdAt: Date;
}

async function setupDocumentSearch() {
  // Initialize search engine
  const searchEngine = new SearchEngine({
    name: 'documents',
    version: 1,
    fields: ['title', 'content', 'author', 'tags']
  });

  // Add sample documents
  const documents: Document[] = [
    {
      title: 'Getting Started with TypeScript',
      content: 'TypeScript is a typed superset of JavaScript...',
      author: 'John Doe',
      tags: ['typescript', 'javascript', 'programming'],
      createdAt: new Date()
    },
    {
      title: 'Advanced TypeScript Patterns',
      content: 'Explore advanced TypeScript design patterns...',
      author: 'Jane Smith',
      tags: ['typescript', 'patterns', 'advanced'],
      createdAt: new Date()
    }
  ];

  await searchEngine.addDocuments(documents);

  // Perform searches
  const basicResults = await searchEngine.search('typescript');
  
  const advancedResults = await searchEngine.search('typescript patterns', {
    fuzzy: true,
    maxResults: 5,
    threshold: 0.7,
    fields: ['title', 'tags']
  });

  return { basicResults, advancedResults };
}
```

### 2. E-commerce Product Search

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  tags: string[];
}

class ProductSearch {
  private searchEngine: SearchEngine;

  constructor() {
    this.searchEngine = new SearchEngine({
      name: 'products',
      version: 1,
      fields: ['name', 'description', 'category', 'tags'],
      options: {
        stemming: true,
        stopWords: ['the', 'and', 'with'],
        fuzzyThreshold: 0.8
      }
    });
  }

  async initialize(products: Product[]) {
    await this.searchEngine.initialize();
    await this.searchEngine.addDocuments(products);
  }

  async searchProducts(query: string, options?: SearchOptions) {
    return this.searchEngine.search<Product>(query, {
      fuzzy: true,
      maxResults: 20,
      ...options
    });
  }

  async searchByCategory(category: string) {
    return this.searchEngine.search<Product>(category, {
      fields: ['category'],
      threshold: 1.0 // Exact match
    });
  }
}

// Usage
const productSearch = new ProductSearch();
await productSearch.initialize([
  {
    id: '1',
    name: 'Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    category: 'Electronics',
    price: 199.99,
    tags: ['audio', 'wireless', 'headphones']
  }
]);

const results = await productSearch.searchProducts('wireless headphone');
```

### 3. Real-time Search with Caching

```typescript
class RealTimeSearch {
  private searchEngine: SearchEngine;
  private updateQueue: any[] = [];
  private isProcessing = false;

  constructor() {
    this.searchEngine = new SearchEngine({
      name: 'realtime-search',
      version: 1,
      fields: ['title', 'content'],
      options: {
        caseSensitive: false
      }
    });
  }

  async initialize() {
    await this.searchEngine.initialize();
    this.startProcessingQueue();
  }

  async addDocument(document: any) {
    this.updateQueue.push(document);
  }

  private async startProcessingQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.updateQueue.length > 0) {
      const batch = this.updateQueue.splice(0, 100);
      await this.searchEngine.addDocuments(batch);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  async search(query: string) {
    return this.searchEngine.search(query, {
      maxResults: 10,
      fuzzy: true
    });
  }
}
```

### 4. Advanced Search Features

```typescript
class AdvancedSearch {
  private searchEngine: SearchEngine;

  constructor() {
    this.searchEngine = new SearchEngine({
      name: 'advanced-search',
      version: 1,
      fields: ['title', 'content', 'metadata.tags', 'metadata.author'],
      options: {
        stemming: true,
        stopWords: ['the', 'and', 'or'],
        fuzzyThreshold: 0.8
      }
    });
  }

  async searchWithHighlighting(query: string) {
    const results = await this.searchEngine.search(query, {
      highlight: true,
      highlightTag: 'mark',
      maxResults: 10
    });

    return results.map(result => ({
      ...result,
      highlightedContent: this.formatHighlights(result.highlights)
    }));
  }

  private formatHighlights(highlights: Record<string, string[]>) {
    return Object.entries(highlights).reduce((acc, [field, matches]) => {
      acc[field] = matches.join('... ');
      return acc;
    }, {} as Record<string, string>);
  }

  async fuzzySearch(query: string) {
    return this.searchEngine.search(query, {
      fuzzy: true,
      maxResults: 10,
      threshold: 0.6
    });
  }

  async facetedSearch(query: string, facets: string[]) {
    return this.searchEngine.search(query, {
      facets,
      maxResults: 20
    });
  }
}


