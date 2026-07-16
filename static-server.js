// Minimal static file server for one app directory. Each dashboard is served
// from its own localhost port so they get separate origins — matching how
// they already behave in a browser (separate localStorage, separate service
// worker scope), so nothing about either dashboard's own code has to change.
const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.css': 'text/css; charset=utf-8',
};

function serveDir(rootDir) {
  return http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.normalize(path.join(rootDir, reqPath));

    // Refuse to serve anything outside rootDir.
    if (!filePath.startsWith(path.normalize(rootDir))) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

// Starts a server on an OS-assigned free port and resolves with that port.
function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = serveDir(rootDir);
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

module.exports = { startStaticServer };
