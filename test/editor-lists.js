import { loadComponent } from '../dist/js/lazy.js';
const [{ createEditor }, { createMediaLibrary }] = await Promise.all(['editor', 'media-library'].map(name => loadComponent(name)));
const fixture = document.querySelector('#fixture'); let passed = 0; let failed = 0;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const settle = () => new Promise(resolve => setTimeout(resolve, 30));
function select(text, from = 0, to = from) {
  const range = document.createRange(); range.setStart(text, from); range.setEnd(text, to); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); document.dispatchEvent(new Event('selectionchange'));
}
function setup() { const source = document.createElement('textarea'); fixture.append(source); return createEditor(source); }
async function test(name, fn) {
  const row = document.createElement('li'); document.querySelector('#results').append(row);
  try { await fn(); row.textContent = `OK — ${name}`; passed++; } catch (error) { row.textContent = `CHYBA — ${name}: ${error.message}`; failed++; }
  finally { fixture.replaceChildren(); }
}
await test('Seznamy mají sémantické ul/ol, výběr i formátování druhé položky a historii', async () => {
  const editor = setup();
  try {
    await editor.ready; editor.setJSON({ version: 1, blocks: ['One', 'Two'].map(text => ({ type: 'list-item', style: 'bullet', children: [{ text }] })) });
    assert(fixture.querySelectorAll('ul.editor-list > li').length === 2, 'Souvislý seznam');
    const text = fixture.querySelectorAll('[data-editor-text]')[1].firstChild; select(text, 0, 3); editor.command('bold');
    assert(editor.getJSON().blocks[0].items[1].children[0].bold && !editor.getJSON().blocks[0].items[0].children[0].bold, 'Offset druhé položky');
    editor.command('orderedList'); assert(fixture.querySelector('ol.editor-list') && editor.getJSON().blocks[0].style === 'ordered', 'Změna typu celého seznamu');
    editor.command('undo'); assert(editor.getJSON().blocks[0].style === 'bullet', 'Undo');
    assert(editor.getStats().blocks === 1 && fixture.querySelectorAll('.editor-block-header').length === 1, 'Seznam je jediný blok');
    assert(editor.getStats().words === 2, 'Statistiky bez UI');
  } finally { editor.destroy(); }
});
await test('Enter pokračuje, prázdná položka ukončí seznam a Backspace na začátku převede odstavec', async () => {
  const editor = setup();
  try {
    await editor.ready; editor.setJSON({ version: 1, blocks: [{ type: 'list-item', style: 'ordered', children: [{ text: 'One' }] }] });
    const content = fixture.querySelector('[contenteditable="true"]'); select(fixture.querySelector('[data-editor-text]').firstChild, 3);
    content.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertParagraph', bubbles: true, cancelable: true }));
    assert(editor.getJSON().blocks.length === 1 && editor.getJSON().blocks[0].items.length === 2, 'Pokračování uvnitř bloku');
    content.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertParagraph', bubbles: true, cancelable: true }));
    assert(editor.getJSON().blocks[1].type === 'paragraph', 'Ukončení');
    select(fixture.querySelector('[data-editor-text]').firstChild, 0);
    content.dispatchEvent(new InputEvent('beforeinput', { inputType: 'deleteContentBackward', bubbles: true, cancelable: true }));
    assert(editor.getJSON().blocks[0].type === 'paragraph', 'Backspace');
  } finally { editor.destroy(); }
});
await test('Seznam se přesouvá a maže jako celek', async () => {
  const editor = setup();
  try {
    await editor.ready; editor.setJSON({ version: 1, blocks: [{ type: 'paragraph', children: [{ text: 'Intro' }] }, ...['A', 'B'].map(text => ({ type: 'list-item', style: 'bullet', children: [{ text }] }))] });
    const handles = fixture.querySelectorAll('[data-drag-handle]'); assert(handles.length === 2 && !fixture.querySelector('li .editor-block-header'), 'Jeden úchyt pro seznam'); handles[1].focus();
    for (const key of [' ', 'ArrowUp', ' ']) handles[1].dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    assert(editor.getJSON().blocks[0].type === 'list' && editor.getJSON().blocks[0].items.length === 2, 'Přesun celého seznamu');
    fixture.querySelector('[data-block-delete="0"]').click(); assert(editor.getJSON().blocks.length === 1 && editor.getText() === 'Intro', 'Smazání celého seznamu');
    editor.command('undo'); assert(editor.getJSON().blocks.length === 2 && editor.getJSON().blocks[0].items.length === 2, 'Undo smazání');
    editor.command('moveBlock', { from: 0, to: 1 }); assert(editor.getJSON().blocks[1].type === 'list', 'Přesun přes odstavec');
  } finally { editor.destroy(); }
});
await test('Nativní input zachová typ seznamu a vypnuté nástroje nezahodí načtená data', async () => {
  const source = document.createElement('textarea'); fixture.append(source); const editor = createEditor(source, { features: { lists: false } });
  try {
    await editor.ready; editor.setJSON({ version: 1, blocks: [{ type: 'list-item', style: 'bullet', children: [{ text: 'A' }] }] });
    assert(!fixture.querySelector('[data-editor-command="bulletList"]') && editor.command('bulletList') === false, 'Volitelná funkce');
    fixture.querySelector('[data-editor-text]').firstChild.textContent = 'Updated';
    fixture.querySelector('[contenteditable="true"]').dispatchEvent(new InputEvent('input', { bubbles: true }));
    assert(editor.getJSON().blocks[0].style === 'bullet' && editor.getText() === 'Updated', 'Nativní změna zachová metadata');
  } finally { editor.destroy(); }
});
await test('Knihovna stránkuje úplné pole a zobrazí ID i názvy bezpečně', async () => {
  const records = Array.from({ length: 7 }, (_, id) => ({ id, src: '/examples/editor-image.svg', name: `<b>Image ${id}</b>` }));
  const library = createMediaLibrary({ load: () => records, pageSize: 2 });
  try {
    await library.open(); assert(library.dialog.querySelectorAll('.media-item').length === 2, 'Lokální stránka');
    assert(library.dialog.textContent.includes('7') && !library.dialog.querySelector('.media-item b'), 'Součet a bezpečný název');
    library.dialog.querySelector('[data-page-action="page-3"]').click(); await settle();
    assert(library.dialog.querySelector('.media-item').dataset.mediaId === '4', 'Číslovaná stránka');
    assert(library.dialog.querySelector('.media-item-id').textContent === 'ID: 4', 'Viditelné ID');
  } finally { library.destroy(); }
});
await test('Server total, zmenšení počtu stránek, filtr a chyba s retry', async () => {
  let mode = 'ok'; const calls = [];
  const library = createMediaLibrary({ pageSize: 2, load: ({ page, query }) => {
    calls.push({ page, query }); if (mode === 'error') throw new Error('offline');
    const total = mode === 'shrink' ? 1 : 8; const count = page > Math.ceil(total / 2) ? 0 : Math.min(2, total - (page - 1) * 2);
    return { items: Array.from({ length: count }, (_, index) => ({ id: (page - 1) * 2 + index, src: '/examples/editor-image.svg' })), total };
  } });
  try {
    await library.open(); library.dialog.querySelector('[data-page-action="page-4"]').click(); await settle(); assert(calls.at(-1).page === 4, 'Server stránka');
    mode = 'shrink'; await library.refresh(); assert(calls.at(-1).page === 1 && library.dialog.querySelectorAll('.media-item').length === 1, 'Oprava stránky');
    mode = 'error'; await library.refresh(); assert(library.dialog.querySelectorAll('.media-item').length === 1, 'Obsah při chybě');
    const retry = [...library.dialog.querySelectorAll('button')].find(button => button.textContent === 'Zkusit znovu'); assert(!retry.hidden, 'Retry');
    mode = 'ok'; retry.click(); await settle();
    const search = library.dialog.querySelector('[type="search"]'); search.value = 'hello'; search.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await settle(); assert(calls.at(-1).page === 1 && calls.at(-1).query === 'hello', 'Filtr');
  } finally { library.destroy(); }
});
await test('Galerie i paginace se vejdou do 375px modalu', async () => {
  const frame = document.createElement('iframe'); frame.title = 'Mobile gallery'; frame.style.width = '375px'; frame.style.height = '700px'; frame.style.border = '0'; fixture.append(frame);
  const doc = frame.contentDocument; doc.documentElement.lang = 'cs'; const css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('../dist/pure.css', location.href).href;
  const loaded = new Promise((resolve, reject) => { css.onload = resolve; css.onerror = reject; }); doc.head.append(css); await loaded;
  const library = createMediaLibrary({ document: doc, pageSize: 2, load: () => ({ items: [{ id: 'long-id-'.repeat(10), src: '/examples/editor-image.svg', name: 'LongName'.repeat(15) }], total: 7 }) });
  try {
    await library.open(); const dialog = library.dialog;
    assert(dialog.getBoundingClientRect().width <= frame.clientWidth && dialog.scrollWidth <= dialog.clientWidth, 'Šířka modalu a karet');
    assert(frame.contentWindow.getComputedStyle(dialog.querySelector('.pagination-number')).display === 'none', 'Mobilní paginace');
  } finally { library.destroy(); frame.remove(); }
});
await test('Psaní ponechá sousední bloky, obrázek a UI; změna struktury má úplný render', async () => {
  const editor = setup();
  try {
    await editor.ready;
    editor.setJSON({ version: 1, blocks: [{ type: 'paragraph', children: [{ text: 'A' }] }, { type: 'image', src: '/examples/editor-image.svg', alt: 'Image' }, { type: 'list', style: 'bullet', items: [{ children: [{ text: 'B' }] }, { children: [{ text: 'C' }] }] }] });
    const content = fixture.querySelector('[contenteditable="true"]');
    const image = fixture.querySelector('img'); const header = fixture.querySelector('.editor-block-header');
    const items = fixture.querySelectorAll('.editor-list li'); const sibling = items[1].firstChild;
    select(items[0].firstChild, 1);
    content.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: 'x', bubbles: true, cancelable: true }));
    assert(editor.getJSON().blocks[2].items[0].children[0].text === 'Bx', 'JSON psaní');
    assert(fixture.querySelector('img') === image && fixture.querySelector('.editor-block-header') === header && items[1].firstChild === sibling, 'Stabilní sousedé a UI');
    editor.command('bold');
    content.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: 'y', bubbles: true, cancelable: true }));
    assert(fixture.querySelector('.editor-list strong')?.textContent === 'y', 'Pending formátování');
    editor.command('undo'); assert(editor.getJSON().blocks[2].items[0].children[0].text === 'Bx', 'Undo');
    editor.command('redo'); assert(editor.getJSON().blocks[2].items[0].children[1].bold, 'Redo');
    content.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertParagraph', bubbles: true, cancelable: true }));
    assert(fixture.querySelectorAll('.editor-list li').length === 3, 'Strukturální render');
    assert(fixture.querySelectorAll('[data-block-delete]').length === 3, 'Jeden ovladač na blok');
  } finally { editor.destroy(); }
});
document.querySelector('#summary').textContent = `${passed} prošlo, ${failed} selhalo.`;
