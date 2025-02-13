import { SearchEngine } from '@obinexuscomputing/nexus-search';

// Enable debug logging if available
const DEBUG = true;

const config = {
    name: 'nexus-search-demo',
    version: 1,
    fields: ['title', 'content', 'author'],
    storage: { 
        type: 'memory',
        debug: DEBUG
    },
    indexing: {
        enabled: true,
        fields: ['title', 'content', 'author'],
        options: {
            tokenization: true,
            caseSensitive: false,
            stemming: false,  // Disable stemming to keep exact terms
            debug: DEBUG
        }
    },
    search: {
        defaultOptions: {
            fuzzy: false,
            maxResults: 10,
            includeMatches: true,
            debug: DEBUG
        }
    }
};

async function main() {
    const searchEngine = new SearchEngine(config);
    await searchEngine.initialize();

    try {
        // Create test documents
        const documents = [
            {
                id: 'test1',
                fields: {
                    title: 'Test Document One',
                    content: 'This is test document number one.',
                    author: 'Test Author'
                }
            },
            {
                id: 'test2',
                fields: {
                    title: 'Test Document Two',
                    content: 'This is test document number two.',
                    author: 'Test Author'
                }
            }
        ];

        console.log('\nAdding documents...');
        await searchEngine.addDocuments(documents);
        console.log('Documents added successfully');

        // Try different search approaches
        const searchTests = [
            {
                name: 'Basic word search',
                query: 'test',
                options: {
                    fields: ['title', 'content'],
                    fuzzy: false,
                    caseSensitive: false
                }
            },
            {
                name: 'Exact phrase search',
                query: 'Test Document',
                options: {
                    fields: ['title'],
                    exact: true,
                    caseSensitive: false
                }
            },
            {
                name: 'Single field search',
                query: 'one',
                options: {
                    fields: ['content'],
                    fuzzy: false,
                    caseSensitive: false
                }
            },
            {
                name: 'Author field search',
                query: 'Test Author',
                options: {
                    fields: ['author'],
                    exact: true,
                    caseSensitive: false
                }
            }
        ];

        // Run search tests
        for (const test of searchTests) {
            console.log(`\nPerforming ${test.name}:`);
            console.log(`Query: "${test.query}"`);
            console.log('Options:', JSON.stringify(test.options, null, 2));
            
            const results = await searchEngine.search(test.query, {
                ...test.options,
                maxResults: 10,
                includeMatches: true
            });
            
            console.log('Results:', JSON.stringify(results, null, 2));
        }

        // Verify documents are stored
        console.log('\nVerifying stored documents:');
        for (const doc of documents) {
            const storedDoc = await searchEngine.getDocument(doc.id);
            console.log(`\nDocument ${doc.id}:`, JSON.stringify(storedDoc, null, 2));
        }

        // Get index stats
        const stats = await searchEngine.getStats();
        console.log('\nSearch engine stats:', JSON.stringify(stats, null, 2));

    } catch (error) {
        console.error('Error in search demo:', error);
        console.error('Error details:', error.stack);
    } finally {
        await searchEngine.close();
    }
}

main().catch(console.error);