import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request, createLoader, HttpError } from '../src/js/ajax.js';
import { safeHref } from '../src/js/html.js';

function target() {
  const attrs = new Map();
  return { textContent: 'Původní obsah', getAttribute: key => attrs.get(key) ?? null, setAttribute: (key, value) => attrs.set(key, value), removeAttribute: key => attrs.delete(key) };
}

test('request zpracuje JSON, HTTP chybu a neplatný JSON', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('{"ok":true}'));
  assert.deepEqual(await request('/api', { type: 'json' }), { ok: true });
  globalThis.fetch = async () => new Response('Chyba', { status: 422 });
  await assert.rejects(request('/api'), error => error instanceof HttpError && error.status === 422);
  globalThis.fetch = async () => new Response('není json');
  await assert.rejects(request('/api', { type: 'json' }), SyntaxError);
});

test('novější požadavek vyhrává i když transport ignoruje abort', async t => {
  const pending = [];
  t.mock.method(globalThis, 'fetch', () => new Promise(resolve => pending.push(resolve)));
  const node = target(); const loader = createLoader(node);
  const old = loader.load('/old'); const latest = loader.load('/latest');
  assert.equal(node.getAttribute('aria-busy'), 'true');
  pending[1](new Response('Nové')); assert.equal(await latest, 'Nové');
  pending[0](new Response('Staré')); assert.equal(await old, null);
  assert.equal(node.textContent, 'Nové');
  assert.equal(node.getAttribute('aria-busy'), null);
});

test('chyba, externí abort a destroy zachovají obsah a obnoví busy', async t => {
  const node = target(); node.setAttribute('aria-busy', 'false');
  const loader = createLoader(node);
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('offline'); });
  await assert.rejects(loader.load('/offline'), /offline/);
  assert.equal(node.textContent, 'Původní obsah');
  assert.equal(node.getAttribute('aria-busy'), 'false');
  globalThis.fetch = async () => new Response('Pozdní výsledek');
  const controller = new AbortController(); controller.abort();
  assert.equal(await loader.load('/cancel', { signal: controller.signal }), null);
  assert.equal(node.textContent, 'Původní obsah');
  loader.destroy(); await assert.rejects(loader.load('/after-destroy'), /odpojen/);
});

test('odkazy nepovolí spustitelné protokoly ani obfuskované adresy', () => {
  for (const href of ['javascript:alert(1)', 'java\nscript:alert(1)', 'data:text/html,hello', '//example.com', '\\evil.test', 'vbscript:test', 'https://a.test/\u0000']) assert.equal(safeHref(href), null, href);
  for (const href of ['https://example.com', '/docs', '../page', '#section', 'mailto:a@b.cz']) assert.equal(safeHref(href), href);
});
