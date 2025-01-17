import express from 'express';
import { SearchEngine } from '@obinexuscomputing/nexus-search';
import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import matter from 'gray-matter';
import glob from 'glob-promise';

class FileSearchServer {
    constructor(config = {}) {
        this.searchEngine = new SearchEngine({
            name: 'file-search',
            version: 1,
            fields: ['title', 'content', 'path', 'type'],
            storage: { type: 'memory' },
            indexing: {
                enabled: true,
                fields: ['title', 'content'],
                options: {
                    tokenization: true,
                    caseSensitive: false,
                    stemming: true
                }
            },
            search: {
                defaultOptions: {
                    fuzzy: true,
                    maxDistance: 2,
                    includeMatches: true
                }
            },
            ...config
        });

        this.app = express();
        this.setupRoutes();
    }

    setupRoutes() {
        this.app.use(express.json());

        // Search endpoint
        this.app.get('/search', async (req, res) => {
            try {
                const { query, fuzzy = true, maxResults = 10 } = req.query;
                
                const results = await this.searchEngine.search(query, {
                    fuzzy: fuzzy === 'true',
                    maxResults: parseInt(maxResults),
                    includeMatches: true
                });

                res.json({ results });
            } catch (error) {
                console.error('Search error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Index status endpoint
        this.app.get('/status', async (req, res) => {
            try {
                const stats = await this.searchEngine.getStats();
                res.json(stats);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Reindex endpoint
        this.app.post('/reindex', async (req, res) => {
            try {
                const { directory } = req.body;
                await this.indexDirectory(directory);
                res.json({ message: 'Reindexing complete' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    async start(port = 3000) {
        await this.searchEngine.initialize();
        this.app.listen(port, () => {
            console.log(`Search server running on port ${port}`);
        });
    }

    async indexDirectory(directory) {
        const files = await glob('**/*.*', { cwd: directory });
        const documents = [];

        for (const file of files) {
            const fullPath = path.join(directory, file);
            const extension = path.extname(file).toLowerCase();
            
            try {
                const content = await fs.readFile(fullPath, 'utf-8');
                let processedContent;
                let title = path.basename(file, extension);

                switch (extension) {
                    case '.md':
                        processedContent = await this.processMarkdown(content);
                        break;
                    case '.html':
                        processedContent = await this.processHtml(content);
                        break;
                    case '.txt':
                        processedContent = content;
                        break;
                    default:
                        continue; // Skip unsupported file types
                }

                documents.push({
                    id: fullPath,
                    fields: {
                        title,
                        content: processedContent,
                        path: fullPath,
                        type: extension.slice(1)
                    }
                });
            } catch (error) {
                console.error(`Error processing file ${fullPath}:`, error);
            }
        }

        await this.searchEngine.addDocuments(documents);
        return documents.length;
    }

    async processMarkdown(content) {
        // Parse front matter if present
        const { data, content: markdownContent } = matter(content);
        
        // Convert markdown to plain text
        const html = marked(markdownContent);
        const text = this.htmlToText(html);

        // Combine front matter with content if present
        let processedContent = text;
        if (Object.keys(data).length > 0) {
            processedContent = Object.entries(data)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n') + '\n\n' + text;
        }

        return processedContent;
    }

    async processHtml(content) {
        const dom = new JSDOM(content);
        const document = dom.window.document;

        // Remove script and style elements
        const scripts = document.getElementsByTagName('script');
        const styles = document.getElementsByTagName('style');
        [...scripts, ...styles].forEach(element => element.remove());

        // Extract text content
        return document.body.textContent.trim();
    }

    htmlToText(html) {
        const dom = new JSDOM(html);
        return dom.window.document.body.textContent.trim();
    }

    async close() {
        await this.searchEngine.close();
    }
}

// Example usage
async function main() {
    const server = new FileSearchServer();
    
    // Start the server
    await server.start(3000);
    
    // Index a directory
    const documentsIndexed = await server.indexDirectory('./documents');
    console.log(`Indexed ${documentsIndexed} documents`);
}

main().catch(console.error);