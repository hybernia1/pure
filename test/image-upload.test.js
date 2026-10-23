import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';
import { createDevServer } from '../scripts/serve.mjs';

test('vývojový upload uloží soubor, vrátí adresu a odmítne falešný typ i cizí origin', async t => {
  const directory = await mkdtemp(resolve(tmpdir(), 'pure-upload-test-'));
  const server = createDevServer(directory); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    if (!directory.startsWith(resolve(tmpdir()) + sep + 'pure-upload-test-')) throw new Error('Neplatná cesta testu.');
    await rm(directory, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=', 'base64');
  const response = await fetch(`${base}/api/images`, { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: bytes });
  assert.equal(response.status, 201); const { id, url } = await response.json(); assert.match(url, /^\/uploads\/[a-f0-9-]+\.png$/); assert.equal(id, url.split('/').at(-1));
  const stored = await fetch(base + url); assert.equal(stored.headers.get('content-type'), 'image/png'); assert.deepEqual(Buffer.from(await stored.arrayBuffer()), bytes);
  assert.equal((await fetch(`${base}/api/images`, { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: '<svg><script>bad()</script></svg>' })).status, 415);
  assert.equal((await fetch(`${base}/api/images`, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: bytes })).status, 415);
  assert.equal((await fetch(`${base}/api/images`, { method: 'POST', headers: { Origin: 'https://outside.test', 'Content-Type': 'image/png' }, body: bytes })).status, 403);
});
