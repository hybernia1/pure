import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { configurePure, getPureConfig, componentOptions, resolveLocale } from '../src/js/config.js';
import { editorI18n } from '../src/js/editor-i18n.js';
import { uiI18n } from '../src/js/i18n.js';
import { initTheme, setTheme } from '../src/js/theme.js';
import { loadComponent, ensureStyles } from '../src/js/lazy.js';
const initial = getPureConfig();
afterEach(() => configurePure(initial));

test('konfigurace slučuje vnořené volby a izoluje vstup, výstup i existující snapshot', () => {
  const patch = { editor: { features: { images: true } }, search: { delay: 50 } };
  configurePure(patch); patch.editor.features.images = false;
  const old = componentOptions('editor', { features: { headings: true } });
  assert.deepEqual(old.features, { images: true, headings: true, fullscreen: true, lists: true });
  configurePure({ editor: { features: { images: false } } });
  assert.equal(old.features.images, true);
  const result = getPureConfig(); result.search.delay = 900;
  assert.equal(getPureConfig().search.delay, 50);
  assert.equal(componentOptions('search', { delay: undefined }).delay, 50);
  assert.equal(componentOptions('search', { delay: 0 }).delay, 0);
});
test('chybná konfigurace se odmítne atomicky včetně neznámých a nebezpečných klíčů', () => {
  for (const patch of [{ theme: { scheme: 'bad name' } }, { theme: { schemeStorageKey: 'pure-theme' } }, { navigation: { match: 'invalid' } }, { tabs: { activation: 'invalid' } }, { tabs: { orientation: 'diagonal' } }, { foo: 1 }, { styles: false }, { search: { delay: -1 } }, { search: { limit: 0 } }, { upload: { maxFiles: 1.5 } }, { theme: { default: 'blue' } }, { locale: 'bad_locale' }, { messages: { close: 1 } }, JSON.parse('{"__proto__":{"polluted":true}}')]) {
    assert.throws(() => configurePure(patch));
    assert.deepEqual(getPureConfig(), initial);
  }
  assert.equal({}.polluted, undefined);
});
test('jazyk dokumentu, globální překlady a lokální překlady mají jednotnou prioritu', () => {
  const doc = { documentElement: { lang: 'cs-CZ' } };
  assert.equal(resolveLocale(doc), 'cs-CZ');
  configurePure({ locale: 'en', messages: { apply: 'Save', words: 'Total: {count}' } });
  assert.equal(uiI18n(doc).t('apply'), 'Save');
  assert.equal(editorI18n(doc).t('words', { count: 3 }), 'Total: 3');
  assert.equal(uiI18n(doc, { locale: 'cs', messages: { apply: 'Uložit' } }).t('apply'), 'Uložit');
  assert.equal(editorI18n(doc, { locale: 'auto' }).locale, 'cs-CZ');
});
test('globální adaptéry se zachovají a instance je může vypnout', () => {
  const uploadImage = () => {}; const load = () => [];
  configurePure({ editor: { uploadImage, mediaLibrary: { load } } });
  assert.equal(componentOptions('editor').uploadImage, uploadImage);
  assert.equal(componentOptions('editor').mediaLibrary.load, load);
  assert.equal(componentOptions('editor', { mediaLibrary: null }).mediaLibrary, null);
});
test('téma respektuje vlastní klíč, vypnutí persistence a lokální override', () => {
  const attrs = new Map(); const saved = new Map(); let writes = 0;
  const root = { setAttribute: (k, v) => attrs.set(k, v), removeAttribute: k => attrs.delete(k) };
  const scope = { addEventListener() {}, removeEventListener() {} };
  const storage = { getItem: key => saved.get(key), setItem: (key, value) => { writes++; saved.set(key, value); } };
  configurePure({ theme: { default: 'dark', storageKey: 'app-theme', persist: false } });
  initTheme({ root, scope, storage })();
  assert.equal(attrs.get('data-theme'), 'dark'); assert.equal(writes, 0);
  setTheme('light', { root, storage, persist: true });
  assert.equal(saved.get('app-theme'), 'light');
});
test('globální CSS nastavení řídí lazy loader, lokální přepsání a explicitní styly', async () => {
  const requests = [];
  class Link extends EventTarget { dataset = {}; remove() {} }
  const doc = {
    head: { append(link) { requests.push(link.href); queueMicrotask(() => link.dispatchEvent(new Event('load'))); } },
    createElement: () => new Link(), querySelectorAll: () => [],
  };
  configurePure({ styles: { auto: false, baseUrl: 'https://assets.example.test/pure/css' } });
  await loadComponent('search', { document: doc }); assert.equal(requests.length, 0);
  await loadComponent('search', { document: doc, styles: true });
  assert.ok(requests.length > 0);
  assert.ok(requests.every(url => url.startsWith('https://assets.example.test/pure/css/')));
  const count = requests.length;
  await ensureStyles('editor', { document: doc });
  assert.ok(requests.length > count, 'Explicitní ensureStyles funguje i při auto:false');
});
