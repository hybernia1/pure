import { test } from 'node:test';
import assert from 'node:assert/strict';
import { utilities, breakpoint } from '../scripts/utilities.mjs';
import { setTheme, setScheme, initTheme } from '../src/js/theme.js';
import { initDisclosures } from '../src/js/disclosure.js';

function element() {
  const attrs = new Map();
  const listeners = new Map();
  return {
    hidden: false, focused: false, listeners,
    setAttribute: (key, value) => attrs.set(key, value),
    getAttribute: (key) => attrs.get(key) ?? null,
    hasAttribute: (key) => attrs.has(key),
    removeAttribute: (key) => attrs.delete(key),
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: (type, listener) => { if (listeners.get(type) === listener) listeners.delete(type); },
    focus() { this.focused = true; },
    contains: () => true,
  };
}

test('utility API má pouze jeden desktop breakpoint a správně escapované varianty', () => {
  const css = utilities();
  assert.equal(breakpoint, 960);
  assert.equal((css.match(/@media/g) || []).length, 1);
  assert.match(css, /\.dt\\:grid-cols-3 \{ grid-template-columns:repeat\(3,minmax\(0,1fr\)\); \}/);
  assert.match(css, /\.px-4 \{ padding-inline:var\(--p-space-4\); \}/);
  const base = [...css.matchAll(/^  \.([^\\\s]+) \{/gm)].map(match => match[1]);
  for (const name of base) assert.ok(css.includes(`.dt\\:${name} {`), name);
});

test('téma přepíná root, ukládá volbu a snese selhání úložiště', () => {
  const root = element();
  const values = new Map();
  const storage = { setItem: (key, value) => values.set(key, value) };
  setTheme('dark', { root, storage });
  assert.equal(root.getAttribute('data-theme'), 'dark');
  assert.equal(values.get('pure-theme'), 'dark');
  setTheme('system', { root, storage });
  assert.equal(root.hasAttribute('data-theme'), false);
  assert.doesNotThrow(() => setTheme('light', { root, storage: { setItem() { throw Error(); } } }));
  assert.throws(() => setTheme('unknown', { root, storage }), TypeError);
});

test('inicializace tématu obnoví volbu, přepíná a odpojí listener', () => {
  const root = element();
  const scope = element();
  const storage = { getItem: () => 'dark', setItem() {} };
  const cleanup = initTheme({ root, scope, storage });
  assert.equal(root.getAttribute('data-theme'), 'dark');
  scope.listeners.get('click')({ target: { closest: () => ({}) } });
  assert.equal(root.getAttribute('data-theme'), 'light');
  cleanup();
  assert.equal(scope.listeners.size, 0);
});

test('schéma a režim jsou nezávislé, ukládají se zvlášť a default obnoví CSS paletu', () => {
  const root = element(); const values = new Map(); const storage = { setItem: (key, value) => values.set(key, value) };
  setTheme('dark', { root, storage }); setScheme('stone', { root, storage });
  assert.equal(root.getAttribute('data-theme'), 'dark'); assert.equal(root.getAttribute('data-scheme'), 'stone');
  assert.equal(values.get('pure-scheme'), 'stone'); assert.equal(values.get('pure-theme'), 'dark');
  setTheme('system', { root, storage }); assert.equal(root.getAttribute('data-scheme'), 'stone');
  setScheme('default', { root, storage }); assert.equal(root.hasAttribute('data-scheme'), false);
  for (const value of ['', 'bad name', 'Bad', 'x";}', null, 1]) assert.throws(() => setScheme(value, { root, storage }));
  assert.doesNotThrow(() => setScheme('stone', { root, storage: { setItem() { throw Error(); } } }));
});

test('inicializace obnoví režim i schéma a persistence false nečte ani nezapisuje', () => {
  const root = element(); const scope = element();
  const storage = { getItem: key => key === 'pure-theme' ? 'light' : 'stone', setItem() {} };
  const cleanup = initTheme({ root, scope, storage });
  assert.equal(root.getAttribute('data-theme'), 'light'); assert.equal(root.getAttribute('data-scheme'), 'stone'); cleanup();
  const blocked = { getItem() { assert.fail('Storage read'); }, setItem() { assert.fail('Storage write'); } };
  const stop = initTheme({ root, scope, storage: blocked, persist: false, default: 'dark', scheme: 'slate' });
  assert.equal(root.getAttribute('data-theme'), 'dark'); assert.equal(root.getAttribute('data-scheme'), 'slate'); stop();
});

test('disclosure synchronizuje ARIA, Escape vrací focus a cleanup odpojí události', () => {
  const button = element();
  const panel = element();
  button.setAttribute('aria-controls', 'panel');
  button.ownerDocument = { getElementById: (id) => id === 'panel' ? panel : null };
  const cleanup = initDisclosures({ querySelectorAll: () => [button] });
  assert.equal(panel.hidden, true);
  button.listeners.get('click')();
  assert.equal(panel.hidden, false);
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  panel.listeners.get('keydown')({ key: 'Escape' });
  assert.equal(panel.hidden, true);
  assert.equal(button.focused, true);
  cleanup();
  assert.equal(button.listeners.size + panel.listeners.size, 0);
});
