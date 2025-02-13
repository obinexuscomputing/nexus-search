import { SearchEngine } from '@obinexuscomputing/nexus-search';

const config = {
    name: 'nexus-search-demo',
    storage: { 
        type: 'memory'
    },
    fields: ['title', 'content', 'author'],
    indexing: {
        enabled: true,
        fields: ['title', 'content', 'author'],
        options: {
            caseSensitive: false,     // Make search case-insensitive
            tokenization: true,       // Enable word tokenization
            normalization: true       // Enable text normalization
        }
    },
    search: {
        defaultOptions: {
            caseSensitive: false,
            fuzzy: true,              // Enable fuzzy matching
            maxDistance: 1,           // Allow 1 character difference
            tokenize: true            // Split search terms
        }
    },
    documentSupport: {
        enabled: true,
        validation: {
            required: ['title', 'content']
        }
    }
};

async function main() {
    const searchEngine = new SearchEngine(config);
    
    try {
        console.log('Initializing search engine...');
        await searchEngine.initialize();
        console.log('Search engine initialized');

        const documents = [
            {
                id: 'doc1',
                fields: {
                    title: 'Test Document One',
                    content: 'This is a test document number one.',
                    author: 'Author One'
                },
                index: {                    // Explicitly specify indexing
                    title: true,
                    content: true,
                    author: true
                }
            },
            {
                id: 'doc2',
                fields: {
                    title: 'Another Test Document',
                    content: 'This is another test document for searching.',
                    author: 'Author Two'
                },
                index: {
                    title: true,
                    content: true,
                    author: true
                }
            }
        ];

        // Add documents one by one
        console.log('\nAdding documents...');
        for (const doc of documents) {
            await searchEngine.addDocument(doc);
            const stored = await searchEngine.getDocument(doc.id);
            console.log(`Document ${doc.id} added and verified:`, stored ? 'Success' : 'Failed');
        }

        // Test different search patterns
        const searchTests = [
            {
                name: 'Case-insensitive word',
                query: 'test',
                options: {
                    fields: ['title', 'content'],
                    caseSensitive: false
                }
            },
            {
                name: 'Multiple words',
                query: 'test document',
                options: {
                    fields: ['title'],
                    tokenize: true,
                    caseSensitive: false
                }
            },
            {
                name: 'Fuzzy search',
                query: 'testt',
                options: {
                    fields: ['title', 'content'],
                    fuzzy: true,
                    maxDistance: 1
                }
            },
            {
                name: 'Field-specific',
                query: 'author:One',
                options: {
                    fields: ['author'],
                    exact: true
                }
            }
        ];

        console.log('\nPerforming search tests:');
        for (const test of searchTests) {
            console.log(`\nTest: ${test.name}`);
            console.log(`Query: "${test.query}"`);
            try {
                const results = await searchEngine.search(test.query, {
                    ...test.options,
                    maxResults: 10,
                    includeMatches: true,
                });
                
                console.log('Results:', JSON.stringify(results, null, 2));
                
                // Parse and display matched documents
                if (results && results.length > 0) {
                    console.log('\nMatched documents:');
                    for (const result of results) {
                        const doc = typeof result.document === 'string' 
                            ? JSON.parse(result.document) 
                            : result.document;
                        console.log(`- ${doc.fields.title} (Score: ${result.score})`);
                    }
                }
            } catch (error) {
                console.error(`Error in search "${test.query}":`, error);
            }
        }

        // Get index statistics
        const stats = await searchEngine.getStats();
        console.log('\nEngine statistics:', JSON.stringify(stats, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await 
        searchEngine.close();
    }

    return 0;
}

main().catch(console.error);