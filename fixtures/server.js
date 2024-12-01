import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = http.createServer((req, res) => {
  // Clean up URL to prevent directory traversal
  const safePath = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');
  
  // Handle root redirect
  if (safePath === '/') {
    res.writeHead(302, { Location: '/fixtures/vanilla/' });
    res.end();
    return;
  }

  // Determine file path
  let filePath;
  if (safePath.startsWith('/dist/')) {
    filePath = path.join(__dirname, safePath);
  } else if (safePath.startsWith('/fixtures/')) {
    filePath = path.join(__dirname, safePath);
  } else {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  // Handle directory requests by looking for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Get file extension and set content type
  const ext = path.extname(filePath);
  const contentType = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  }[ext] || 'application/octet-stream';

  // Read and serve the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      }
      return;
    }

    // Success - send the file
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

const port = 3000;
server.listen(port, () => {
  console.log(`Demo server running at http://localhost:${port}/fixtures/vanilla/`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server terminated');
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Server terminated');
  });
});