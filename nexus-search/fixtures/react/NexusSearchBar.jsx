import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchEngine } from '@obinexuscomputing/nexus-search';
import type { SearchResult } from '@obinexuscomputing/nexus-search';

const NexusSearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult<any>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchEngineRef = useRef<SearchEngine | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize search engine
  useEffect(() => {
    const initializeSearch = async () => {
      try {
        setIsLoading(true);
        searchEngineRef.current = new SearchEngine({
          name: 'nexus-search-bar',
          version: 1,
          fields: ['title', 'content', 'tags']
        });
        await searchEngineRef.current.initialize();
        
        await searchEngineRef.current.addDocuments([
          {
            title: 'Getting Started',
            content: 'Quick start guide for NexusSearch',
            tags: ['guide', 'documentation']
          },
          {
            title: 'Advanced Features',
            content: 'Explore advanced search capabilities',
            tags: ['advanced', 'features']
          },
          {
            title: 'Search Optimization',
            content: 'Learn about fuzzy search and performance tuning',
            tags: ['performance', 'optimization']
          }
        ]);
        setError(null);
      } catch (err) {
        setError('Failed to initialize search engine');
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSearch();
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchEngineRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const searchResults = await searchEngineRef.current.search(searchQuery, {
        fuzzy: true,
        maxResults: 5
      });
      setResults(searchResults);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setQuery(newQuery);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (newQuery.trim()) {
        handleSearch(newQuery);
      } else {
        setResults([]);
      }
    }, 300);
  }, [handleSearch]);

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search..."
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            data-testid="nexus-search-input"
            disabled={isLoading && !query}
          />
          {isLoading && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200" role="alert">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4 border rounded-lg shadow-lg bg-white divide-y divide-gray-100" data-testid="search-results">
            {results.map((result, index) => (
              <div
                key={index}
                className="p-4 hover:bg-gray-50 transition-colors"
                data-testid={`search-result-${index}`}
              >
                <h3 className="font-semibold text-lg text-gray-900">{result.item.title}</h3>
                <p className="text-gray-600 mt-1">{result.item.content}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.item.tags.map((tag: string, tagIndex: number) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Score: {(result.score * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        )}

        {query && !isLoading && results.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No results found for "{query}"
          </div>
        )}
      </div>
    </div>
  );
};

export default NexusSearchBar;