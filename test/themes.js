import { initTheme, setTheme, setScheme } from '../dist/js/theme.js';
const fixture = document.querySelector('#fixture'); let passed = 0; let failed = 0;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function test(name, fn) {
  const row = document.createElement('li'); document.querySelector('#results').append(row);
  try { await fn(); row.textContent = `OK — ${name}`; passed++; } catch (error) { row.textContent = `CHYBA — ${name}: ${error.message}`; failed++; }
  finally { fixture.replaceChildren(); }
}
async function frameFixture() {
  const frame = document.createElement('iframe'); frame.title = 'Isolated theme'; fixture.append(frame);
  const doc = frame.contentDocument;
  await Promise.all(['../dist/pure.css', '../examples/themes.css'].map(path => new Promise((resolve, reject) => { const link = doc.createElement('link'); link.rel = 'stylesheet'; link.href = new URL(path, location.href).href; link.onload = resolve; link.onerror = reject; doc.head.append(link); })));
  const root = doc.documentElement; const options = { root, persist: false };
  const color = name => frame.contentWindow.getComputedStyle(root).getPropertyValue(`--p-${name}`).trim();
  return { frame, doc, root, options, color };
}
await test('Vlastní palety light/dark mění sémantické tokeny i skutečné komponenty', async () => {
  const { frame, doc, root, options, color } = await frameFixture();
  const button = doc.createElement('button'); button.className = 'button'; button.textContent = 'Action'; doc.body.append(button);
  setTheme('light', options); assert(color('bg') === '#f6f6f5', 'Výchozí light');
  setScheme('stone', options); assert(color('bg') === '#f4f1eb', 'Stone light');
  setTheme('dark', options); assert(color('bg') === '#201d18' && root.dataset.scheme === 'stone', 'Stone dark bez ztráty schématu');
  // Background iframes may defer descendant style updates until their next paint.
  button.getBoundingClientRect();
  const deadline = performance.now() + 3000;
  while (frame.contentWindow.getComputedStyle(button).backgroundColor !== 'rgb(231, 215, 191)' && performance.now() < deadline) await new Promise(resolve => setTimeout(resolve, 25));
  const action = frame.contentWindow.getComputedStyle(button).backgroundColor;
  assert(action === 'rgb(231, 215, 191)', `Komponenta čte sémantický action (${action}; root ${color('action')}; body ${frame.contentWindow.getComputedStyle(doc.body).getPropertyValue('--p-action')}; button ${frame.contentWindow.getComputedStyle(button).getPropertyValue('--p-action')})`);
  assert(frame.contentWindow.getComputedStyle(root).colorScheme === 'dark', 'Nativní ovládání má tmavý režim');
  setScheme('slate', options); assert(color('bg') === '#192128' && root.dataset.theme === 'dark', 'Změna jen schématu');
  setScheme('default', options); assert(color('bg') === '#171716' && !root.hasAttribute('data-scheme'), 'Návrat k Pure dark');
});
await test('Přepsání výchozí palety, stavů a systémový režim fungují bez JS registru palet', async () => {
  const { frame, doc, root, options, color } = await frameFixture();
  const style = doc.createElement('style'); style.textContent = ':root { --p-light-bg:#faf9f7; --p-dark-bg:#121619; --p-dark-error:#efabab; } :root[data-scheme="custom"] { --p-light-bg:#f5f4f2; --p-dark-bg:#242321; }'; doc.head.append(style);
  setTheme('light', options); assert(color('bg') === '#faf9f7', 'Přepsaný light');
  setTheme('dark', options); assert(color('bg') === '#121619' && color('error') === '#efabab', 'Přepsaný dark a error');
  setScheme('custom', options); setTheme('system', options);
  const dark = frame.contentWindow.matchMedia('(prefers-color-scheme: dark)').matches;
  assert(!root.hasAttribute('data-theme') && color('bg') === (dark ? '#242321' : '#f5f4f2'), 'Systém vybírá paletu uvnitř schématu');
  setScheme('unregistered', options); assert(color('bg') === (dark ? '#121619' : '#faf9f7'), 'Neexistující CSS schéma bezpečně dědí základ');
});
await test('Delegovaná tlačítka, obnova voleb a cleanup', async () => {
  const { doc, root } = await frameFixture(); const values = new Map([['mode', 'dark'], ['scheme', 'stone']]);
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const make = (name, value) => { const button = doc.createElement('button'); button.type = 'button'; button.setAttribute(name, value); doc.body.append(button); return button; };
  const scheme = make('data-scheme-set', 'slate'); const mode = make('data-theme-set', 'light'); const toggle = make('data-theme-toggle', '');
  const cleanup = initTheme({ root, scope: doc, storage, storageKey: 'mode', schemeStorageKey: 'scheme' });
  assert(root.dataset.theme === 'dark' && root.dataset.scheme === 'stone', 'Obě volby obnovené');
  scheme.click(); mode.click(); assert(root.dataset.scheme === 'slate' && root.dataset.theme === 'light', 'Delegované volby');
  toggle.click(); assert(root.dataset.theme === 'dark' && values.get('scheme') === 'slate', 'Toggle zachová schéma');
  cleanup(); mode.click(); assert(root.dataset.theme === 'dark', 'Cleanup odpojil listenery');
});
document.querySelector('#summary').textContent = `${passed} prošlo, ${failed} selhalo.`;
