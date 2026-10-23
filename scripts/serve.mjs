import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { receiveImage } from './image-upload.mjs';

const root = resolve('.');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif' };
export function createDevServer(workspace = root) { return createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/api/images' && req.method === 'POST') { await receiveImage(req, res, workspace); return; }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    if (pathname.startsWith('/.pure')) { res.writeHead(403).end(); return; }
    const upload = pathname.match(/^\/uploads\/([a-f0-9-]+\.(?:png|jpg|webp|gif|avif))$/);
    if (pathname.startsWith('/uploads/') && !upload) { res.writeHead(404).end(); return; }
    let file = upload ? resolve(workspace, '.pure/uploads', upload[1]) : resolve(workspace, `.${pathname === '/' ? '/examples/index.html' : pathname}`);
    if (!file.startsWith(workspace + sep)) { res.writeHead(403).end(); return; }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(404).end('Nenalezeno'); }
}); }
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) createDevServer().listen(3000, '127.0.0.1', () => console.log('Pure → http://localhost:3000'));
