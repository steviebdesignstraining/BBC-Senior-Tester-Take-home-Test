const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // If file not found and it's not a direct file request, try index.html
      if (err.code === 'ENOENT' && !filePath.includes('.')) {
        filePath = path.join(ROOT_DIR, 'index.html');
        fs.readFile(filePath, (indexErr, indexData) => {
          if (indexErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(indexData);
        });
        return;
      }
      
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ Test Dashboard Server Running\n`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`\n📝 Available npm scripts:`);
  console.log(`   npm test              - Run all tests`);
  console.log(`   npm run test:api      - Run API tests (Playwright)`);
  console.log(`   npm run test:load     - Run load tests (k6)`);
  console.log(`   npm run test:stress   - Run stress tests (k6)`);
  console.log(`   npm run test:security - Run security tests (k6)`);
  console.log(`\n`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});
