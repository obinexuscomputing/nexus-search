// basic-usage.cjs
const { SearchEngine } = require('../../dist/index.cjs');

// Initialize search engine
const searchEngine = new SearchEngine({
    name: 'my-search-index',
    version: 1,
    fields: ['title', 'content', 'tags']
});

async function main() {
    try {
        // Initialize the search engine
        await searchEngine.initialize();
        console.log('Search engine initialized.');

        // Create properly structured documents
        const documents = [
            {
                id: 'doc1',
                fields: {
                    title: 'Getting Started with Node.js',
                    content: 'Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine.',
                    tags: ['nodejs', 'javascript', 'runtime']
                },
                metadata: {
                    indexed: Date.now(),
                    lastModified: Date.now()
                }
            }
        ];

        // Add documents
        await searchEngine.addDocuments(documents);
        console.log('Documents added successfully');

        // Search with proper options
        const results = await searchEngine.search('nodejs', {
            fuzzy: true,
            maxResults: 5,
            fields: ['title', 'content']
        });

        console.log('Search results:', results);
    } catch (error) {
        console.error('Error in main:', error);
    }
}

async function additionalSearch() {
    try {
        // Create a document directly as an object
        const doc = {
            id: 'test-1',
            fields: {
                title: 'Test Document',
                content: 'Test content',
                tags: ['test']
            },
            metadata: {
                indexed: Date.now(),
                lastModified: Date.now()
            }
        };

        // Add document
        await searchEngine.addDocuments([doc]);
        console.log('Additional document added');

        // Perform search
        const results = await searchEngine.search('test', {
            fuzzy: true,
            fields: ['title', 'content']
        });

        console.log('Additional search results:', results);
    } catch (error) {
        console.error('Error in additionalSearch:', error);
    }
}

async function getAllDocuments() {
    try {
        const allDocuments = await searchEngine.getAllDocuments();
        console.log('All documents:', allDocuments);
    } catch (error) {
        console.error('Error in getAllDocuments:', error);
    }
}

// Execute functions
(async () => {
    await main();
    await additionalSearch();
    await getAllDocuments();
})().catch(console.error);