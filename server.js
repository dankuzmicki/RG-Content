const http = require('http');
const { readFile, stat } = require('fs/promises');
const path = require('path');
const { URL } = require('url');

const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 3000);
const apiSecret = process.env.VDOCIPHER_API_SECRET;
const videoId = process.env.VDOCIPHER_VIDEO_ID || 'e19a1e1c5d37cc89dfe44e4badee1ff2';
const apiBaseUrl = (process.env.VDOCIPHER_API_BASE_URL || 'https://dev.vdocipher.com/api/videos').replace(/\/$/, '');

const publicDir = path.join(__dirname, 'public');

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
]);

async function serveStaticFile(filePath, res) {
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath);
    const mimeType = mimeTypes.get(ext) || 'application/octet-stream';
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
    } else {
      console.error('Failed to serve static file:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
    }
  }
}

async function fetchOtp() {
  if (!apiSecret) {
    throw new Error('VDOCIPHER_API_SECRET is not set');
  }

  const endpoint = `${apiBaseUrl}/${videoId}/otp`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Apisecret ${apiSecret}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Failed to fetch OTP: ${response.status} ${response.statusText}`);
    error.details = body;
    throw error;
  }

  return response.json();
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = requestUrl.pathname;

  if (req.method === 'GET' && pathname === '/api/otp') {
    try {
      const otp = await fetchOtp();
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(JSON.stringify(otp));
    } catch (error) {
      console.error('OTP fetch failed:', error);
      const status = error.message.includes('not set') ? 500 : 502;
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Unable to retrieve OTP. Check server logs for details.' }));
    }
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  let filePath = pathname;
  if (filePath === '/') {
    filePath = '/index.html';
  }

  const resolvedPath = path.normalize(path.join(publicDir, filePath));
  if (!resolvedPath.startsWith(publicDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  await serveStaticFile(resolvedPath, res);
});

server.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
  if (!apiSecret) {
    console.warn('VDOCIPHER_API_SECRET environment variable is not set. OTP requests will fail until it is configured.');
  }
});
