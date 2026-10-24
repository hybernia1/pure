import { loadComponent, getPureConfig, configurePure } from '../dist/js/lazy.js';
const { createNavigation, initNavigations } = await loadComponent('navigation');
const fixture = document.querySelector('#fixture'); let passed = 0; let failed = 0; let nextId = 0;
const assert = (condition, text) => { if (!condition) throw new Error(text); };
const settle = () => new Promise(resolve => setTimeout(resolve, 30));
async function waitFor(predicate) { const deadline = performance.now() + 4000; while (!predicate()) { if (performance.now() > deadline) throw new Error('Timed out'); await settle(); } }
function markup(doc = document) {
  const root = doc.createElement('nav'); root.className = 'navigation'; root.dataset.navigation = ''; root.setAttribute('aria-label', 'Demo');
  const button = doc.createElement('button'); button.className = 'button navigation-toggle'; button.dataset.navToggle = ''; button.hidden = true;
  const panel = doc.createElement('div'); panel.className = 'navigation-panel'; panel.dataset.navPanel = ''; panel.id = `test-navigation-${++nextId}`; button.setAttribute('aria-controls', panel.id);
  const list = doc.createElement('ul'); list.className = 'navigation-list'; panel.append(list); root.append(button, panel);
  const link = (name, href, parent = list) => { const item = doc.createElement('li'); const a = doc.createElement('a'); a.href = href; a.textContent = name; item.append(a); parent.append(item); return a; };
  link('Home', '/home'); link('Section', '/home#section');
  for (const name of ['Components', 'Docs']) {
    const item = doc.createElement('li'); const details = doc.createElement('details'); details.dataset.navDropdown = '';
    const summary = doc.createElement('summary'); summary.textContent = name; const submenu = doc.createElement('ul'); submenu.className = 'navigation-submenu'; details.append(summary, submenu); item.append(details); list.append(item);
    link(name, `/${name.toLowerCase()}`, submenu);
  }
  return root;
}
async function test(name, fn) {
  const row = document.createElement('li'); document.querySelector('#results').append(row);
  try { await fn(); row.textContent = `OK — ${name}`; passed++; } catch (error) { row.textContent = `CHYBA — ${name}: ${error.message}`; failed++; }
  finally { fixture.replaceChildren(); }
}
await test('Aktivní URL, sekce, rodič podnabídky a globální přesná shoda', () => {
  const root = markup(); fixture.append(root); const original = getPureConfig(); let nav;
  try {
    nav = createNavigation(root, { active: '/home?filter=1' }); assert(root.querySelector('[aria-current]').textContent === 'Home', 'Path ignoruje query');
    nav.setActive('/home#section'); assert(root.querySelector('[aria-current]').textContent === 'Section', 'Sekce má přednost');
    nav.setActive('/docs'); assert(root.querySelector('[data-nav-active]').querySelector('summary').textContent === 'Docs', 'Aktivní rodič');
    nav.setActive(null); assert(!root.querySelector('[aria-current]'), 'Vymazání'); nav.destroy();
    configurePure({ navigation: { match: 'exact' } }); nav = createNavigation(root, { active: '/home?filter=1' }); assert(!root.querySelector('[aria-current]'), 'Globální exact');
  } finally { nav?.destroy(); configurePure(original); }
});
await test('Podnabídky se vzájemně zavřou, Escape a klik mimo vrátí správný stav', async () => {
  const root = markup(); fixture.append(root); const nav = createNavigation(root); const [first, second] = root.querySelectorAll('details');
  try {
    first.open = true; await settle(); second.open = true; await settle(); assert(!first.open && second.open, 'Jedna podnabídka');
    const summary = second.querySelector('summary'); summary.focus(); summary.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    assert(!second.open && document.activeElement === summary, 'Escape focus');
    first.open = true; await settle(); document.body.click(); assert(!first.open, 'Outside click');
  } finally { nav.destroy(); }
});
await test('Cleanup obnoví markup a duplicitní/chybná inicializace se odmítne', () => {
  const root = markup(); fixture.append(root); const before = root.outerHTML; const nav = createNavigation(root);
  let threw = false; try { createNavigation(root); } catch { threw = true; } assert(threw, 'Duplicitní init');
  nav.destroy(); assert(root.outerHTML === before, 'Přesný cleanup');
  const cleanup = initNavigations(root); cleanup(); assert(root.outerHTML === before, 'Scope init cleanup');
  root.querySelector('[data-nav-toggle]').setAttribute('aria-controls', 'missing'); const invalid = root.outerHTML;
  threw = false; try { createNavigation(root); } catch { threw = true; } assert(threw && root.outerHTML === invalid, 'Validace bez mutací');
});
await test('375px menu, focus bez pasti, resize na desktop a zpět, žádné přetékání', async () => {
  const frame = document.createElement('iframe'); frame.title = 'Mobile navigation'; frame.style.width = '375px'; frame.style.height = '600px'; frame.style.border = '0'; fixture.append(frame);
  const doc = frame.contentDocument; doc.documentElement.lang = 'cs'; const css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('../dist/pure.css', location.href).href;
  const loaded = new Promise((resolve, reject) => { css.onload = resolve; css.onerror = reject; }); doc.head.append(css); await loaded;
  const root = markup(doc); doc.body.append(root); const outside = doc.createElement('button'); outside.textContent = 'Outside'; doc.body.append(outside);
  const fallbackPanel = root.querySelector('[data-nav-panel]'); assert(!fallbackPanel.hidden, 'No-JS obsah viditelný');
  const nav = createNavigation(root, { active: '/home' }); const button = root.querySelector('[data-nav-toggle]'); const panel = root.querySelector('[data-nav-panel]');
  try {
    assert(!button.hidden && panel.hidden, 'Mobil sbalený'); button.click(); assert(nav.isOpen() && !panel.hidden && button.getAttribute('aria-expanded') === 'true', 'Mobil open');
    const link = panel.querySelector('a'); link.focus(); outside.focus(); assert(doc.activeElement === outside && !nav.isOpen(), 'Focus není uvězněný ani ukradený');
    nav.open(); link.focus(); root.dispatchEvent(new frame.contentWindow.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); assert(!nav.isOpen() && doc.activeElement === button, 'Mobil Escape');
    button.focus(); frame.style.width = '1000px'; await waitFor(() => button.hidden && !panel.hidden);
    assert(doc.activeElement === link, 'Focus po přechodu na desktop');
    const details = root.querySelector('details'); details.open = true; await settle();
    const menu = details.querySelector('ul'); const rect = menu.getBoundingClientRect(); assert(rect.left >= 0 && rect.right <= frame.contentWindow.innerWidth, 'Dropdown uvnitř viewportu');
    link.focus(); frame.style.width = '375px'; await waitFor(() => !button.hidden && panel.hidden);
    assert(doc.activeElement === button && !details.open, 'Focus po přechodu na mobile');
    assert(doc.documentElement.scrollWidth <= frame.clientWidth, 'Žádné přetékání');
    nav.open(); const local = panel.querySelector('a'); local.addEventListener('click', event => event.preventDefault()); local.click(); assert(!nav.isOpen(), 'Výběr zavře mobil');
  } finally { nav.destroy(); frame.remove(); }
});
await test('Kliknutí na odkaz nebrání nativní navigaci a hash/popstate aktualizují aria-current', () => {
  const root = markup(); fixture.append(root); const nav = createNavigation(root); const link = root.querySelector('a');
  try {
    let prevented; const observe = event => { prevented = event.defaultPrevented; event.preventDefault(); }; fixture.addEventListener('click', observe);
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); assert(prevented === false, 'Odkaz není router'); fixture.removeEventListener('click', observe);
    link.href = location.href; window.dispatchEvent(new PopStateEvent('popstate')); assert(link.getAttribute('aria-current') === 'page', 'Historie obnoví current');
  } finally { nav.destroy(); }
});
document.querySelector('#summary').textContent = `${passed} prošlo, ${failed} selhalo.`;
