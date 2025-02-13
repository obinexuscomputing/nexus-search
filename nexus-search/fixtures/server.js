import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

// Configuration
const CONFIG = {
    port: process.env.PORT || 3000,
    defaultDemo: 'vanilla',
    mimeTypes: {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.jsx': 'text/javascript',
        '.ts': 'text/javascript',
        '.tsx': 'text/javascript',
        '.vue': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'font/eot'
    },
    cacheableExtensions: ['.js', '.css', '.png', '.jpg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot']
};

// Utility functions
const logger = {
    info: (...args) => console.log(new Date().toISOString(), '[INFO]', ...args),
    error: (...args) => console.error(new Date().toISOString(), '[ERROR]', ...args),
    warn: (...args) => console.warn(new Date().toISOString(), '[WARN]', ...args)
};

function shouldCache(ext) {
    return CONFIG.cacheableExtensions.includes(ext);
}

function getContentType(ext) {
    return CONFIG.mimeTypes[ext] || 'application/octet-stream';
}

function setCacheHeaders(res, ext) {
    if (shouldCache(ext)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
        res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
    } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}

export class FileSearchServer {// Use later
    constructor() {
        this.app = express();
        this.upload = multer({ 
            dest: 'uploads/',
            fileFilter: this.fileFilter
        });
        this.searchIndex = [];
    }

    // File type validation
    fileFilter(req, file, cb) {
        const allowedTypes = ['.md', '.html', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type'), false);
        }
    }

    // Index file contents
    async indexFile(filePath) {
        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            const fileInfo = {
                id: `file-${Date.now()}-${path.basename(filePath)}`,
                filename: path.basename(filePath),
                type: path.extname(filePath).substring(1),
                content: content,
                indexedAt: new Date()
            };

            this.searchIndex.push(fileInfo);
            return fileInfo;
        } catch (error) {
            console.error('Indexing error:', error);
            throw error;
        }
    }

    // Search method
    searchFiles(query) {
        return this.searchIndex.filter(file => 
            file.content.toLowerCase().includes(query.toLowerCase()) ||
            file.filename.toLowerCase().includes(query.toLowerCase())
        );
    }

    // Setup routes
    setupRoutes() {
        // File upload endpoint
        this.app.post('/upload', this.upload.array('files'), async (req, res) => {
            try {
                const indexedFiles = [];
                
                for (const file of req.files) {
                    const indexedFile = await this.indexFile(file.path);
                    indexedFiles.push(indexedFile);
                }

                res.json({
                    message: 'Files uploaded and indexed successfully',
                    files: indexedFiles
                });
            } catch (error) {
                res.status(500).json({ 
                    error: 'Failed to upload or index files',
                    details: error.message 
                });
            }
        });

        // Search endpoint
        this.app.get('/search', (req, res) => {
            const query = req.query.q;
            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }

            const results = this.searchFiles(query);
            res.json(results);
        });

        // List indexed files
        this.app.get('/indexed-files', (req, res) => {
            res.json(this.searchIndex);
        });

        // Clear index
        this.app.delete('/clear-index', (req, res) => {
            this.searchIndex = [];
            res.json({ message: 'Search index cleared' });
        });
    }

    // Start server
    start(port = 3000) {
        this.setupRoutes();
        this.app.listen(port, () => {
            console.log(`File search server running on port ${port}`);
        });
    }
}

// // Usage
// const fileSearchServer = new FileSearchServer();

fileSearchServer.start();

const server = http.createServer(async (req, res) => {
    try {
        // Set security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // Clean up URL and prevent directory traversal
        const safePath = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');
        
        // Log request
        logger.info(`${req.method} ${safePath}`);

        // Handle root redirect
        if (safePath === '/') {
            res.writeHead(302, { Location: `/${CONFIG.defaultDemo}/` });
            res.end();
            return;
        }

        // Special handling for node_modules resources
        if (safePath.includes('node_modules')) {
            res.writeHead(404);
            res.end('Access to node_modules is not allowed');
            return;
        }

        // Determine file path
        let filePath;
        if (safePath.startsWith('/dist/')) {
            filePath = path.join(PROJECT_ROOT, safePath);
        } else if (safePath.includes('@obinexuscomputing/nexus-search')) {
            // Handle package imports
            filePath = path.join(PROJECT_ROOT, 'dist/index.umd.js');
        } else {
            // All other paths are relative to fixtures directory
            filePath = path.join(__dirname, safePath);
        }

        // Handle directory requests
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }

        // Get file extension and set headers
        const ext = path.extname(filePath);
        const contentType = getContentType(ext);
        setCacheHeaders(res, ext);

        // Check if file exists before reading
        if (!fs.existsSync(filePath)) {
            logger.error(`File not found: ${filePath}`);
            res.writeHead(404);
            res.end(`File not found: ${safePath}`);
            return;
        }

        // Read and serve the file
        const content = await fs.promises.readFile(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);

    } catch (err) {
        logger.error('Server error:', err);
        res.writeHead(500);
        res.end(`Server Error: ${err.message}`);
    }
});

// Start server
server.listen(CONFIG.port, () => {
    logger.info(`Demo server running at http://localhost:${CONFIG.port}/`);
    logger.info('Available demos:');
    logger.info(`  - Vanilla: http://localhost:${CONFIG.port}/vanilla/`);
    logger.info(`  - React:   http://localhost:${CONFIG.port}/react/`);
    logger.info(`  - Vue:     http://localhost:${CONFIG.port}/vue/`);
});

// Error handling
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${CONFIG.port} is already in use`);
    } else {
        logger.error('Server error:', err);
    }
    process.exit(1);
});

// Graceful shutdown
const shutdown = () => {
    logger.info('Shutting down server...');
    server.close(() => {
        logger.info('Server terminated');
        process.exit(0);
    });

    // Force exit if server hasn't closed in 10 seconds
    setTimeout(() => {
        logger.error('Server forced to terminate');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    shutdown();
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection:', reason);
    shutdown();
});