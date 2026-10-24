import { loadComponent, configurePure, getPureConfig } from '../dist/js/lazy.js';
const { createTabs, initTabs } = await loadComponent('tabs');
const fixture = document.querySelector('#fixture'); let passed = 0; let failed = 0;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const key = (node, value) => node.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));
function markup() {
  const root = document.createElement('div'); root.className = 'tabs'; root.dataset.tabs = '';
  const list = document.createElement('div'); list.dataset.tabList = ''; list.className = 'tabs-list'; list.setAttribute('aria-label', 'Demo'); root.append(list);
  for (const name of ['a', 'b', 'c']) {
    const button = document.createElement('button'); button.dataset.tab = name; button.textContent = name; list.append(button);
    const panel = document.createElement('div'); panel.dataset.tabPanel = name; panel.className = 'tabs-panel'; panel.textContent = `Panel ${name}`; root.append(panel);
  }
  return root;
}
async function test(name, fn) {
  const row = document.createElement('li'); document.querySelector('#results').append(row);
  try { await fn(); row.textContent = `OK — ${name}`; passed++; } catch (error) { row.textContent = `CHYBA — ${name}: ${error.message}`; failed++; }
  finally { fixture.replaceChildren(); }
}
await test('ARIA vazby, roving tabindex, šipky a disabled záložky', () => {
  const root = markup(); fixture.append(root); const [a, b, c] = root.querySelectorAll('[data-tab]'); b.disabled = true;
  const tabs = createTabs(root);
  try {
    assert(a.getAttribute('role') === 'tab' && a.tabIndex === 0 && c.tabIndex === -1, 'Roving tabindex');
    const panel = root.querySelector('[data-tab-panel]'); assert(a.getAttribute('aria-controls') === panel.id && panel.getAttribute('aria-labelledby') === a.id, 'Vazby');
    a.focus(); key(a, 'ArrowRight'); assert(tabs.getActive() === 'c' && document.activeElement === c, 'Přeskočení disabled');
    key(c, 'ArrowRight'); assert(tabs.getActive() === 'a', 'Cyklická navigace');
    key(a, 'End'); assert(tabs.getActive() === 'c', 'End'); key(c, 'Home'); assert(tabs.getActive() === 'a', 'Home');
    assert(!tabs.select('b') && !tabs.select('missing'), 'Neplatná aktivace');
    assert(root.querySelectorAll('[data-tab-panel]:not([hidden])').length === 1, 'Právě jeden panel');
  } finally { tabs.destroy(); }
});
await test('Ruční aktivace, globální konfigurace, vertical a RTL', () => {
  const original = getPureConfig(); const root = markup(); fixture.append(root); let tabs;
  try {
    configurePure({ tabs: { activation: 'manual', orientation: 'vertical' } }); tabs = createTabs(root);
    const [a, b] = root.querySelectorAll('[data-tab]'); key(a, 'ArrowDown'); assert(tabs.getActive() === 'a' && document.activeElement === b, 'Manual přesune jen focus');
    key(b, 'Enter'); assert(tabs.getActive() === 'b', 'Enter aktivuje'); tabs.destroy();
    root.dir = 'rtl'; tabs = createTabs(root, { activation: 'auto', orientation: 'horizontal' });
    key(a, 'ArrowLeft'); assert(tabs.getActive() === 'b', 'RTL směr');
  } finally { tabs?.destroy(); configurePure(original); }
});
await test('Obsah a inputy zůstávají zachované, událost nese klíče, skrytý focus se přesune', () => {
  const root = markup(); fixture.append(root); const input = document.createElement('input'); input.value = 'zachovat'; root.querySelector('[data-tab-panel]').append(input);
  let event; let changes = 0; root.addEventListener('pure:tab-change', value => { event = value; });
  const tabs = createTabs(root, { onChange: () => changes++ });
  try {
    input.focus(); tabs.select('b'); assert(document.activeElement.dataset.tab === 'b', 'Focus nesmí zůstat ve skrytém panelu');
    assert(event.detail.previous === 'a' && event.detail.key === 'b', 'Detail události');
    tabs.select('b'); assert(changes === 1, 'Bez duplicitní události'); tabs.select('a'); assert(input.value === 'zachovat', 'Hodnota inputu');
    root.querySelector('[data-tab="a"]').disabled = true; tabs.refresh(); assert(tabs.getActive() === 'b', 'Refresh po disabled');
    const current = root.querySelector('[data-tab-panel="b"]'); current.focus();
    root.querySelectorAll('[data-tab]').forEach(tab => { tab.disabled = true; });
    assert(tabs.refresh() === false && tabs.getActive() === null && document.activeElement === root.querySelector('[data-tab-list]'), 'Bez dostupných záložek se focus neschová');
    root.querySelector('[data-tab="c"]').disabled = false; tabs.refresh(); assert(tabs.getActive() === 'c', 'Opětovné povolení');
  } finally { tabs.destroy(); }
});
await test('Vnořené záložky jsou nezávislé a destroy přesně obnoví původní atributy', () => {
  const root = markup(); const nested = markup(); root.querySelector('[data-tab-panel]').append(nested); fixture.append(root);
  const before = root.outerHTML; const outer = createTabs(root); const inner = createTabs(nested);
  try { inner.select('c'); assert(outer.getActive() === 'a', 'Oddělený scope'); outer.select('b'); outer.select('a'); assert(inner.getActive() === 'c', 'Vnořený stav'); }
  finally { inner.destroy(); outer.destroy(); }
  assert(root.outerHTML === before, 'Přesný cleanup');
  const cleanup = initTabs(root); cleanup(); assert(root.outerHTML === before, 'initTabs včetně samotného rootu');
});
await test('Chybný markup neprovede částečnou inicializaci, duplicitní init se odmítne', () => {
  const root = markup(); fixture.append(root); root.querySelector('[data-tab-panel="c"]').remove(); const before = root.outerHTML;
  let threw = false; try { createTabs(root); } catch { threw = true; } assert(threw && root.outerHTML === before, 'Atomická validace');
  fixture.replaceChildren(); const valid = markup(); fixture.append(valid); const tabs = createTabs(valid);
  try { threw = false; try { createTabs(valid); } catch { threw = true; } assert(threw, 'Duplicitní inicializace'); } finally { tabs.destroy(); }
});
await test('Záložky fungují v top-layer modalu a zavření vrátí focus na spouštěč', async () => {
  const { createModal } = await loadComponent('modal'); const button = document.createElement('button'); button.textContent = 'Otevřít';
  const dialog = document.createElement('dialog'); const root = markup(); dialog.append(root); fixture.append(button, dialog);
  const tabs = createTabs(root); const modal = createModal(dialog);
  try { button.focus(); modal.open(button); tabs.select('b', { focus: true }); assert(dialog.open && tabs.getActive() === 'b', 'Modal aktivace'); modal.close(); await new Promise(resolve => setTimeout(resolve, 30)); assert(document.activeElement === button, 'Obnovení focusu'); }
  finally { tabs.destroy(); modal.destroy(); }
});
document.querySelector('#summary').textContent = `${passed} prošlo, ${failed} selhalo.`;
