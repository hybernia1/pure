import { loadComponent } from '../dist/js/lazy.js';
const [{ createEditor }, { createTable }, { createList }] = await Promise.all(['editor', 'table', 'list'].map(name => loadComponent(name)));
const fixture = document.querySelector('#fixture');
const summarize = values => { values.sort((a, b) => a - b); return { medianMs: +values[Math.floor(values.length / 2)].toFixed(3), p95Ms: +values[Math.ceil(values.length * .95) - 1].toFixed(3) }; };
const measure = (fn, runs = 15) => { fn(); fn(); const values = []; for (let i = 0; i < runs; i++) { const start = performance.now(); fn(); values.push(performance.now() - start); } return summarize(values); };
const frames = () => new Promise(resolve => { const timer = setTimeout(resolve, 100); requestAnimationFrame(() => requestAnimationFrame(() => { clearTimeout(timer); resolve(); })); });
const cases = {};
try {
  for (const [name, count, list] of [['paragraphs100', 100, false], ['paragraphs1000', 1000, false], ['list1000', 1000, true]]) {
    const source = document.createElement('textarea'); fixture.append(source);
    const children = () => [{ text: 'Alpha beta gamma delta epsilon' }];
    const value = { version: 1, blocks: list ? [{ type: 'list', style: 'bullet', items: Array.from({ length: count }, () => ({ children: children() })) }] : Array.from({ length: count }, () => ({ type: 'paragraph', children: children() })) };
    source.value = JSON.stringify(value);
    const start = performance.now(); const editor = createEditor(source, { styles: false }); await editor.ready; const initMs = performance.now() - start;
    await frames();
    const content = fixture.querySelector('[contenteditable="true"]');
    const typing = measure(() => content.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: 'x', bubbles: true, cancelable: true })));
    const selection = measure(() => { for (let i = 0; i < 100; i++) document.dispatchEvent(new Event('selectionchange')); });
    const domNodes = fixture.querySelectorAll('*').length;
    const rendered = editor.getJSON(); const dataValid = (list ? rendered.blocks[0].items[0].children[0].text : rendered.blocks[0].children[0].text).startsWith('x'.repeat(17));
    const end = performance.now(); editor.destroy(); const destroyMs = performance.now() - end;
    cases[name] = { rows: count, initMs: +initMs.toFixed(3), typing, unchangedSelection100: selection, domNodes, destroyMs: +destroyMs.toFixed(3), dataValid };
    fixture.replaceChildren(); await frames();
  }
  for (const kind of ['table', 'list']) {
    const rows = Array.from({ length: 100 }, (_, id) => ({ id, name: `User ${id}`, email: `user${id}@example.test` }));
    const create = kind === 'table' ? createTable : createList;
    const view = create(fixture, { pageSize: 100, columns: [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }], renderItem: item => item.name, load: () => ({ items: rows, total: 100 }) }); await view.ready;
    const times = []; for (let i = 0; i < 15; i++) { const start = performance.now(); await view.reload(); times.push(performance.now() - start); }
    cases[kind] = { rows: 100, reload: summarize(times), domNodes: fixture.querySelectorAll('*').length }; view.destroy();
  }
  const report = { timestamp: new Date().toISOString(), userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency, viewport: { width: innerWidth, height: innerHeight }, methodology: 'Warm CSS/modules; synchronous JS+DOM operations, two warmups and 15 runs; selection case dispatches 100 unchanged events. No network, paint or mobile CPU guarantee. Init/destroy are single samples.', cases, cleanupNodes: fixture.childNodes.length };
  document.querySelector('#report').textContent = JSON.stringify(report, null, 2);
  document.querySelector('#status').textContent = 'Hotovo';
} catch (error) { document.querySelector('#status').textContent = `CHYBA: ${error.message}`; throw error; }
