import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';

export const imageLimit = 10 * 1024 * 1024;
export function imageType(bytes) {
  if (bytes.length < 12) return null;
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return ['png', 'image/png'];
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return ['jpg', 'image/jpeg'];
  if (['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6))) return ['gif', 'image/gif'];
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return ['webp', 'image/webp'];
  if (bytes.toString('ascii', 4, 8) === 'ftyp' && ['avif', 'avis'].includes(bytes.toString('ascii', 8, 12))) return ['avif', 'image/avif'];
  return null;
}
export async function receiveImage(req, res, root) {
  const reply = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body)); };
  const host = new URL(`http://${req.headers.host}`);
  if (!['localhost', '127.0.0.1'].includes(host.hostname) || (req.headers.origin && req.headers.origin !== host.origin)) { req.resume(); reply(403, { error: 'Nepovolený původ požadavku.' }); return; }
  if (Number(req.headers['content-length']) > imageLimit) { req.resume(); reply(413, { error: 'Obrázek překračuje 10 MiB.' }); return; }
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > imageLimit) { reply(413, { error: 'Obrázek překračuje 10 MiB.' }); return; }
    chunks.push(chunk);
  }
  const data = Buffer.concat(chunks); const type = imageType(data);
  if (!type || req.headers['content-type']?.split(';')[0] !== type[1]) { reply(415, { error: 'Vyber podporovaný obrázek PNG, JPEG, WebP, GIF nebo AVIF.' }); return; }
  const name = `${randomUUID()}.${type[0]}`; const folder = resolve(root, '.pure/uploads');
  await mkdir(folder, { recursive: true }); await writeFile(resolve(folder, name), data, { flag: 'wx' });
  reply(201, { id: name, url: `/uploads/${name}` });
}
