import { distRoot } from './distribution.js';
const { loadComponent, ensureStyles } = await import(`${distRoot}js/lazy.js`);

const results = document.querySelector('#results'); const fixture = document.querySelector('#fixture');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const resource = filename => performance.getEntriesByType('resource').filter(entry => new URL(entry.name).pathname.endsWith(`/${filename}`));
const waitFor = async selector => {
  const end = performance.now() + 5000;
  const find = typeof selector === 'function' ? selector : () => document.querySelector(selector);
  while (!find()) { if (performance.now() > end) throw new Error(`Timeout: ${selector}`); await new Promise(resolve => setTimeout(resolve, 5)); }
  return find();
};
let failed = 0; let passed = 0; let editor; let createEditor;
async function test(name, fn) {
  const row = document.createElement('li'); results.append(row);
  try { await fn(); row.textContent = `OK — ${name}`; passed++; }
  catch (error) { row.textContent = `CHYBA — ${name}: ${error.message}`; failed++; }
}
await test('Lehký vstup nestahuje komponenty ani CSS před použitím', () => {
  assert(!resource('editor.js').length && !resource('media-library.js').length && !document.querySelector('link[rel="stylesheet"]'), 'Předčasně načtené komponenty');
});
await test('Současné požadavky sdílejí JS i CSS a search nestáhne editor', async () => {
  const [first, second] = await Promise.all([loadComponent('search'), loadComponent('search')]);
  assert(first === second && typeof first.createSearch === 'function', 'Duplicitní modul');
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
  assert(links.every(link => link.sheet) && new Set(links.map(link => link.href)).size === links.length, 'CSS není hotové nebo je duplicitní');
  assert(resource('search.js').length === 1 && !resource('editor.js').length && !resource('media-library.js').length, 'Search načetl cizí komponentu');
  assert(!resource('html.js').length, 'JSON/search načetl HTML sanitizer');
});
await test('Základ editoru nenačítá obrázkové doplňky, modaly ani knihovnu', async () => {
  ({ createEditor } = await loadComponent('editor'));
  const source = document.createElement('textarea'); fixture.append(source);
  editor = createEditor(source, { features: { images: true }, mediaLibrary: { load: async () => [{ id: 'asset', src: '/examples/editor-image.svg', name: 'Krajina' }] } }); await editor.ready;
  for (const file of ['editor-dialog.js', 'upload.js', 'select.js', 'resize.js', 'modal.js', 'media-library.js', 'image.js', 'tag-picker.js']) assert(!resource(file).length, `Předčasné načtení ${file}`);
  assert(!document.querySelector('.editor-dialog, .editor-fullscreen, [data-media-library]'), 'Předčasná inicializace');
});
await test('Modal odkazu se načte při otevření bez upload modulu', async () => {
  const openings = await Promise.all([editor.openDialog('link'), editor.openDialog('link')]);
  assert(openings[0] === false && openings[1] === true && document.querySelectorAll('[data-editor-dialog="link"]').length === 1, 'Souběžné otevření');
  assert(document.querySelector('[data-editor-dialog="link"]').matches(':modal') && resource('editor-dialog.js').length === 1, 'Odkaz není načtený');
  assert(!resource('upload.js').length && !resource('media-library.js').length, 'Odkaz načetl upload nebo média');
  document.querySelector('[data-editor-dialog="link"] [data-modal-close]').click();
});
await test('Obrázkový modal a knihovna mají oddělené okamžiky načtení', async () => {
  await editor.openDialog('image');
  assert(resource('upload.js').length === 1 && resource('select.js').length === 1 && !resource('media-library.js').length && !resource('media-library.css').length, 'Závislosti obrázku');
  const browse = document.querySelector('[data-editor-media-library]'); browse.click();
  document.querySelector('[data-editor-dialog="image"] [data-modal-close]').click(); await waitFor(() => !browse.disabled);
  assert(!document.querySelector('[data-media-library]'), 'Knihovna se otevřela po zavření rodiče');
  await editor.openDialog('image'); browse.click();
  const item = await waitFor('[data-media-library][open] [data-media-id="asset"]');
  assert(resource('media-library.js').length === 1 && resource('media-library.css').length === 1, 'Chybí knihovna nebo CSS');
  item.click(); await new Promise(resolve => setTimeout(resolve, 0));
  document.querySelector('[data-editor-dialog="image"] [type="submit"]').click();
  await waitFor('[data-editor-image]'); await editor.ready;
  assert(editor.getJSON().blocks[1].mediaId === 'asset' && resource('resize.js').length === 1 && resource('resize.css').length === 1, 'Resize nebo mediaId');
  const count = document.querySelectorAll('link[rel="stylesheet"]').length;
  await ensureStyles(['editor', 'upload', 'media-library', 'resize']);
  assert(document.querySelectorAll('link[rel="stylesheet"]').length === count, 'Duplicitní CSS po opakovaném použití');
  editor.destroy();
});
await test('Destroy a změna JSON během načítání neotevřou opožděný modal', async () => {
  const source = document.createElement('textarea'); fixture.append(source);
  const instance = createEditor(source, { styles: false, features: { images: true } });
  const pending = instance.openDialog('image'); instance.destroy();
  assert(await pending === false && !document.querySelector('.editor-dialog'), 'Destroy obnovil modal');
  const next = createEditor(source, { styles: false }); const opening = next.openDialog('link'); next.setJSON({ version: 1, blocks: [{ type: 'paragraph', children: [{ text: 'Changed' }] }] });
  assert(await opening === false && !document.querySelector('.editor-dialog[open]'), 'Stará operace přepsala nový stav'); next.destroy();
});
await test('Chybná jména se odmítnou bez nových požadavků', async () => {
  let rejected = 0; try { await loadComponent('unknown'); } catch { rejected++; } try { await ensureStyles('constructor'); } catch { rejected++; }
  assert(rejected === 2, 'Neplatný modul nebo styl prošel');
});
await test('JS, dynamické doplňky, CSS i sprite zůstávají ve zvolené distribuci', () => {
  const assets = performance.getEntriesByType('resource').filter(entry => new URL(entry.name).pathname.startsWith('/dist/'));
  assert(assets.length && assets.every(entry => entry.name.startsWith(distRoot)), 'Smíchané distribuční grafy');
  assert([...document.querySelectorAll('link[rel="stylesheet"]')].every(link => link.href.startsWith(distRoot)), 'CSS mimo distribuci');
});
document.querySelector('#summary').textContent = `${passed} prošlo, ${failed} selhalo.`;
document.documentElement.dataset.testResult = failed ? 'fail' : 'pass';
