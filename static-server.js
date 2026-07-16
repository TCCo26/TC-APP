// Minimal static file server for one app directory. Each dashboard is served
// from its own localhost port so they get separate origins — matching how
// they already behave in a browser (separate localStorage, separate service
// worker scope), so nothing about either dashboard's own code has to change.
//
// If apiBase is set (a deployed Vercel URL for that dashboard's own repo),
// requests under /api/* are proxied there instead of served from disk — the
// dashboards already call their own /api/... endpoints with relative paths,
// so this lets cloud sync / TMDb / Pulse headlines work unmodified against a
// real deployment. Without apiBase, /api/* just 404s, same as today's
// local-only behavior.
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.css': 'text/css; charset=utf-8',
};

function proxyApiRequest(req, res, apiBase) {
  const target = new URL(req.url, apiBase);
  const client = target.protocol === 'http:' ? http : https;

  const upstreamReq = client.request(target, {
    method: req.method,
    headers: { ...req.headers, host: target.host },
  }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
    upstreamRes.pipe(res);
  });

  upstreamReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'proxy_upstream_unreachable' }));
  });

  req.pipe(upstreamReq);
}

function serveDir(rootDir, apiBase) {
  return http.createServer((req, res) => {
    if (apiBase && req.url.startsWith('/api/')) {
      proxyApiRequest(req, res, apiBase);
      return;
    }

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
// apiBase (optional): a deployed origin like "https://your-app.vercel.app" —
// /api/* requests get proxied there instead of 404ing locally.
function startStaticServer(rootDir, apiBase) {
  return new Promise((resolve, reject) => {
    const server = serveDir(rootDir, apiBase);
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

module.exports = { startStaticServer };
