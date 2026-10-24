import { distRoot } from './distribution.js';
const { loadComponent } = await import(`${distRoot}js/lazy.js`);
const { createEditor } = await loadComponent('editor');
const fixture = document.querySelector('#fixture'); let passed = 0; let failed = 0;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function test(name, run) {
  const row = document.createElement('li'); document.querySelector('#results').append(row);
  try { await run(); row.textContent = `PASS: ${name}`; passed++; }
  catch (error) { row.textContent = `FAIL: ${name}: ${error.message}`; failed++; }
  finally { fixture.replaceChildren(); }
}
for (const width of [300, 780]) await test(`Heading upgrade preserves geometry at ${width}px`, async () => {
  const host = document.createElement('div'); host.style.width = `${width}px`; fixture.append(host);
  const source = document.createElement('textarea'); host.append(source);
  const editor = createEditor(source, { features: { headings: true }, iconsUrl: `${distRoot}icons.svg` });
  try {
    const slot = host.querySelector('.editor-style');
    assert(slot?.getAttribute('aria-busy') === 'true', 'Slot is reserved synchronously');
    const geometry = () => [...host.querySelectorAll('.editor-toolbar, .editor-style, .editor-tool, .editor-content')].map(node => {
      const rect = node.getBoundingClientRect(); return [rect.x, rect.y, rect.width, rect.height];
    });
    const before = geometry(); await editor.ready; const after = geometry();
    assert(before.length === after.length && before.every((rect, i) => rect.every((n, j) => Math.abs(n - after[i][j]) < .1)), 'Toolbar, buttons and content retain their bounds');
    assert(!slot.hasAttribute('aria-busy') && !slot.querySelector('.editor-style-placeholder'), 'Placeholder is removed');
    assert(slot.querySelector('[aria-haspopup="listbox"]'), 'Custom selector is present');
    editor.command('heading', 2); assert(editor.getJSON().blocks[0].type === 'heading', 'Heading command still works');
  } finally { editor.destroy(); }
});
await test('Disabled headings reserve no space', async () => {
  const source = document.createElement('textarea'); fixture.append(source); const editor = createEditor(source);
  try { await editor.ready; assert(!fixture.querySelector('.editor-style'), 'No heading slot'); } finally { editor.destroy(); }
});
await test('Destroy while the selector is pending does not restore UI', async () => {
  const source = document.createElement('textarea'); fixture.append(source); const editor = createEditor(source, { features: { headings: true } });
  editor.destroy(); await editor.ready; assert(!fixture.querySelector('.editor, .editor-style, .control'), 'No detached UI is restored');
});
document.querySelector('#summary').textContent = `${passed} passed, ${failed} failed`;
document.documentElement.dataset.testStatus = failed ? 'fail' : 'pass';
