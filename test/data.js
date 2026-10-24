import { loadComponent } from '../dist/js/lazy.js';
const [{ createDataController }, { createTable }, { createList }, { createPagination }] = await Promise.all(['data', 'table', 'list', 'pagination'].map(name => loadComponent(name)));
const fixture = document.querySelector('#fixture'); const results = document.querySelector('#results');
let passed = 0; let failed = 0;
const assert = (condition, text) => { if (!condition) throw new Error(text); };
const settle = () => new Promise(resolve => setTimeout(resolve, 20));
async function test(name, fn) {
  const result = document.createElement('li'); results.append(result);
  try { await fn(); result.textContent = `OK — ${name}`; passed++; }
  catch (error) { result.textContent = `CHYBA — ${name}: ${error.message}`; failed++; }
  finally { fixture.replaceChildren(); }
}
const columns = [{ key: 'name', label: 'Jméno', primary: true, sortable: true }, { key: 'email', label: 'E-mail' }];

await test('Tabulka a seznam sdílejí data, řazení a paginaci bez HTML interpretace', async () => {
  const a = document.createElement('div'); const b = document.createElement('div'); fixture.append(a, b);
  const calls = []; const controller = createDataController({ pageSize: 1, load: async args => { calls.push(args); return { items: [{ name: args.page === 1 ? '<b>Anna</b>' : 'Jan', email: 'a@example.cz' }], total: 3 }; } });
  const table = createTable(a, { controller, columns }); const list = createList(b, { controller, renderItem: item => item.name });
  try {
    await controller.reload();
    assert(a.querySelector('tbody').textContent.includes('<b>Anna</b>') && !a.querySelector('tbody b'), 'Text nesmí být HTML');
    assert(b.querySelector('li').textContent === '<b>Anna</b>', 'Sdílený list');
    const next = a.querySelector('[data-page-action="next"]'); next.focus(); next.click(); await settle();
    assert(controller.getState().page === 2 && b.querySelector('li').textContent === 'Jan', 'Společná stránka');
    assert(document.activeElement.dataset.pageAction === 'next', 'Focus zůstává v paginaci');
    a.querySelector('[data-sort="name"]').click(); await settle();
    assert(calls.at(-1).page === 1 && calls.at(-1).sort.direction === 'asc', 'Řazení resetuje stránku');
    assert(a.querySelector('th[scope="col"]').getAttribute('aria-sort') === 'ascending', 'ARIA řazení');
    table.destroy(); await controller.setPage(2); assert(b.querySelector('li').textContent === 'Jan', 'Zničení pohledu nezničí sdílený controller');
  } finally { table.destroy(); list.destroy(); controller.destroy(); }
});
await test('Loading a chyba ponechají obsah; retry obnoví data a prázdný výsledek má text', async () => {
  let mode = 'ok'; let finish;
  const table = createTable(fixture, { columns, load: async () => {
    if (mode === 'pending') return new Promise(resolve => { finish = resolve; });
    if (mode === 'error') throw new Error('offline');
    return { items: mode === 'empty' ? [] : [{ name: 'Anna' }], total: mode === 'empty' ? 0 : 1 };
  } });
  try {
    await table.ready; mode = 'pending'; const task = table.reload();
    assert(fixture.querySelector('[aria-busy="true"]') && fixture.querySelector('tbody').textContent.includes('Anna'), 'Starý obsah při loading');
    finish({ items: [{ name: 'Jan' }], total: 1 }); await task;
    mode = 'error'; await table.reload();
    assert(fixture.querySelector('tbody').textContent.includes('Jan'), 'Starý obsah při chybě');
    assert(fixture.querySelector('.data-view').dataset.state === 'error', 'Sémantický error');
    mode = 'empty'; fixture.querySelector('.data-view > button').click(); await settle();
    assert(!fixture.querySelector('tbody tr') && fixture.textContent.includes('Žádné záznamy.'), 'Prázdný výsledek');
  } finally { table.destroy(); }
});
await test('Samostatná paginace má URL, current page, disabled hranice a modifier click neinterceptuje', async () => {
  const pager = createPagination(fixture, { page: 2, pages: 10, total: 100, href: page => `?page=${page}`, onChange: () => {} });
  try {
    const link = fixture.querySelector('[data-page-action="next"]'); assert(link.tagName === 'A' && link.href.endsWith('?page=3'), 'Skutečné URL');
    let intercepted;
    const observe = event => { intercepted = event.defaultPrevented; event.preventDefault(); };
    fixture.addEventListener('click', observe);
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true })); assert(!intercepted, 'Ctrl click je nativní');
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); assert(intercepted, 'Běžný click používá callback');
    fixture.removeEventListener('click', observe);
    pager.update({ page: 1, pages: 3, total: 30 });
    assert(fixture.querySelector('[data-page-action="previous"]').disabled, 'První stránka nemá previous');
    assert(fixture.querySelector('[aria-current="page"]').textContent === '1', 'Aktuální stránka');
  } finally { pager.destroy(); }
});
await test('Destroy vlastního pohledu abortuje transport a nevytvoří opožděný DOM', async () => {
  let finish; let signal;
  const list = createList(fixture, { renderItem: item => item, load: args => { signal = args.signal; return new Promise(resolve => { finish = resolve; }); } });
  list.destroy(); finish({ items: ['late'], total: 1 }); await list.ready;
  assert(signal.aborted && fixture.childNodes.length === 0, 'Destroy musí uklidit pending operaci');
});
await test('375px bloková tabulka a paginace nepřetékají; od 960px se vrací sloupce', async () => {
  const frame = document.createElement('iframe'); frame.title = 'Responsive test'; frame.style.width = '375px'; frame.style.height = '600px'; frame.style.border = '0'; fixture.append(frame);
  const doc = frame.contentDocument; doc.documentElement.lang = 'cs';
  const css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('../dist/pure.css', location.href).href;
  const loaded = new Promise((resolve, reject) => { css.onload = resolve; css.onerror = reject; }); doc.head.append(css); await loaded;
  const columns = ['name', 'email', 'team', 'status'].map(key => ({ key, label: key, sortable: key === 'name' }));
  const table = createTable(doc.body, { columns, responsive: 'stack', load: async () => ({ items: [{ name: 'Anna', email: 'longaddress@example.cz', team: 'Design', status: 'Active' }], total: 100 }) });
  try {
    await table.ready;
    assert(frame.contentWindow.getComputedStyle(doc.querySelector('.table-label')).display === 'block', 'Mobilní popisky');
    assert(frame.contentWindow.getComputedStyle(doc.querySelector('.table-mobile-sort')).display === 'flex', 'Mobilní řazení');
    assert(frame.contentWindow.getComputedStyle(doc.querySelector('.pagination-number')).display === 'none', 'Kompaktní paginace');
    assert(doc.documentElement.scrollWidth <= frame.clientWidth, 'Bez horizontálního přetékání stránky');
    frame.style.width = '1000px';
    const deadline = performance.now() + 3000;
    while (frame.contentWindow.getComputedStyle(doc.querySelector('.table')).display !== 'table' && performance.now() < deadline) await settle();
    assert(frame.contentWindow.getComputedStyle(doc.querySelector('.table')).display === 'table', `Desktop tabulka (${frame.clientWidth}/${frame.contentWindow.innerWidth})`);
    assert(frame.contentWindow.getComputedStyle(doc.querySelector('.table-mobile-sort')).display === 'none', 'Desktop řazení v hlavičce');
    assert(frame.contentWindow.getComputedStyle(doc.querySelector('.pagination-number')).display !== 'none', 'Čísla na desktopu');
    table.destroy(); frame.style.width = '375px';
    const shrinkDeadline = performance.now() + 3000;
    while (frame.contentWindow.innerWidth !== 375 && performance.now() < shrinkDeadline) await settle();
    const scroll = createTable(doc.body, { columns, load: async () => ({ items: [], total: 0 }) }); await scroll.ready;
    const region = doc.querySelector('.table-region');
    assert(region.scrollWidth > region.clientWidth && doc.documentElement.scrollWidth <= frame.clientWidth, `Scroll zůstává uvnitř obalu (${region.scrollWidth}/${region.clientWidth}; document ${doc.documentElement.scrollWidth}/${frame.clientWidth})`); scroll.destroy();
  } finally { table.destroy(); frame.remove(); }
});
await test('Lazy datové moduly nestahují editor ani formulářové widgety', async () => {
  const urls = performance.getEntriesByType('resource').map(entry => new URL(entry.name).pathname);
  assert(!urls.some(url => /\/js\/(editor|select|picker|upload)\.js$/.test(url)), 'Nezávislé moduly');
});
document.querySelector('#summary').textContent = `${passed} prošlo, ${failed} selhalo.`;
