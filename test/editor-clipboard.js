import { distRoot } from './distribution.js';
const { createEditor } = await import(`${distRoot}js/editor.js`);
const { clipboardDocument, clipboardType } = await import(`${distRoot}js/editor-clipboard.js`);
const fixture = document.querySelector('#fixture');
let passed = 0, failed = 0;
const assert = (condition, message) => { if (!condition) throw Error(message); };
const paragraph = text => ({ type: 'paragraph', children: [{ text }] });
const set = (editor, ...blocks) => editor.setJSON({ version: 1, blocks });
const select = (content, all = true) => {
  const range = document.createRange(); range.selectNodeContents(content);
  if (!all) range.collapse(false);
  getSelection().removeAllRanges(); getSelection().addRange(range);
  document.dispatchEvent(new Event('selectionchange'));
};
const transfer = (plain = '', html = '') => {
  const data = new DataTransfer(); if (plain) data.setData('text/plain', plain); if (html) data.setData('text/html', html); return data;
};
const paste = (content, data) => content.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
const wait = async predicate => {
  for (let index = 0; index < 200; index++) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 10)); }
  throw Error('Timed out waiting for clipboard dialog');
};
async function test(name, run, options = {}) {
  const row = document.createElement('li'); document.querySelector('#results').append(row);
  const source = document.createElement('textarea'); fixture.append(source);
  const editor = createEditor(source, { locale: 'en', features: { headings: true }, ...options });
  try { await editor.ready; await run(editor, fixture.querySelector('.editor-content')); row.textContent = `PASS: ${name}`; passed++; }
  catch (error) { row.textContent = `FAIL: ${name}: ${error.stack}`; failed++; }
  finally { editor.destroy(); fixture.replaceChildren(); }
}

await test('HTML marks, safe links, heading mapping and one-step undo/redo', (editor, content) => {
  set(editor, paragraph('Original')); select(content);
  paste(content, transfer('Title\nRich text', '<h1>Title</h1><p><strong>Rich</strong> <em>text</em> <u>under</u> <del>gone</del> <a href="/safe">link</a></p>'));
  const blocks = editor.getJSON().blocks;
  assert(blocks[0].type === 'heading' && blocks[0].level === 2, 'Heading mapping');
  assert(blocks[1].children.some(run => run.bold) && blocks[1].children.some(run => run.italic) && blocks[1].children.some(run => run.underline) && blocks[1].children.some(run => run.strike), 'Marks lost');
  assert(blocks[1].children.some(run => run.link === '/safe'), 'Safe link lost');
  editor.command('undo'); assert(editor.getText() === 'Original', 'Paste not one undo step');
  editor.command('redo'); assert(editor.getJSON().blocks[0].type === 'heading', 'Redo lost structure');
});

await test('HTML lists are whole blocks and nested lists flatten in reading order', (editor, content) => {
  select(content); paste(content, transfer('', '<ul><li>one</li><li><b>two</b></li></ul><ol><li>three<ul><li>nested</li></ul>end</li></ol>'));
  const blocks = editor.getJSON().blocks;
  assert(blocks[0].type === 'list' && blocks[0].items.length === 2, 'List split into individual blocks');
  assert(editor.getText() === 'one\ntwo\nthree\nnested\nend', 'Nested list order');
  assert(blocks[0].items[1].children[0].bold, 'List marks');
});

await test('Word-style inline marks, entities, line breaks, tables and preformatted lines', () => {
  const value = clipboardDocument('<p><span style="font-weight:700;font-style:italic;text-decoration:underline line-through;color:red">A&amp;B</span><br>C</p><table><tr><td>X</td><td>Y</td></tr></table><pre>one\n  two</pre>', { document });
  const runs = value.blocks[0].children;
  assert(runs[0].text === 'A&B' && runs[0].bold && runs[0].italic && runs[0].underline && runs[0].strike, 'Office marks/entities');
  assert(!runs[0].color && value.blocks.map(block => block.children.map(run => run.text).join('')).join('|') === 'A&B|C|X|Y|one|  two', 'Block conversion');
});

await test('Untrusted HTML is never attached; scripts, handlers, CSS and unsafe URLs are discarded', (editor, content) => {
  const count = performance.getEntriesByType('resource').length;
  paste(content, transfer('', '<script>window.clipboardExecuted=true</script><style>body{display:none}</style><iframe src="/clipboard-should-not-fetch"></iframe><p onclick="window.clipboardExecuted=true"><a href="javascript:alert(1)">safe text</a><img src="/clipboard-should-not-fetch" onerror="window.clipboardExecuted=true" alt=" image"></p>'));
  assert(!window.clipboardExecuted && !content.querySelector('script,iframe,style,img,[onclick],[onerror]'), 'Unsafe DOM attached');
  assert(!editor.getJSON().blocks[0].children.some(run => run.link), 'Unsafe link stored');
  assert(performance.getEntriesByType('resource').slice(count).every(entry => !entry.name.includes('clipboard-should-not-fetch')), 'Imported markup fetched resources');
});

await test('Empty, unsupported and image-only clipboard content cannot delete the selection', (editor, content) => {
  set(editor, paragraph('Keep me')); select(content);
  for (const data of [transfer(), transfer('', '<img src="https://example.invalid/x.png">'), transfer('', '<script>bad()</script>')]) paste(content, data);
  assert(editor.getText() === 'Keep me', 'Unsupported clipboard deleted text');
});

await test('Plain mode normalizes CRLF and retains destination marks', (editor, content) => {
  set(editor, { type: 'paragraph', children: [{ text: 'Original', bold: true }] }); select(content);
  const data = transfer('A\r\nB', '<i>Wrong</i>');
  paste(content, data); assert(editor.getText() === 'A\nB', 'Plain fallback/line endings');
  assert(editor.getJSON().blocks[0].children[0].bold && !editor.getJSON().blocks[0].children[0].italic, 'Destination marks/HTML');
}, { pasteMode: 'plain' });

await test('Invalid Pure JSON falls back to supported HTML, then plain text', (editor, content) => {
  const data = transfer('Fallback', '<i>Rich fallback</i>'); data.setData(clipboardType, '{broken');
  paste(content, data); assert(editor.getText() === 'Rich fallback' && editor.getJSON().blocks[0].children[0].italic, 'HTML fallback');
  select(content); paste(content, transfer('Plain fallback', '<script>ignored()</script>'));
  assert(editor.getText() === 'Plain fallback', 'Text fallback');
});

await test('Pure copy/paste retains marks, list structure, mediaId and excludes block controls', (editor, content) => {
  set(editor, { type: 'list', style: 'bullet', items: [{ children: [{ text: 'First', bold: true }] }, { children: [{ text: 'Second', link: '/safe' }] }] }, { type: 'image', src: '/photo.png', alt: 'Photo', mediaId: 'media-42' });
  select(content); const data = new DataTransfer(); content.dispatchEvent(new ClipboardEvent('copy', { clipboardData: data, bubbles: true, cancelable: true }));
  assert(data.getData('text/plain') === 'First\nSecond\nPhoto', 'UI labels leaked into clipboard');
  assert(data.getData('text/html').includes('<ul>') && data.getData('text/html').includes('<strong>First</strong>') && !data.getData('text/html').includes('<img'), 'Semantic HTML export');
  set(editor, paragraph('')); select(content); paste(content, data);
  const blocks = editor.getJSON().blocks;
  assert(blocks[0].items.length === 2 && blocks[0].items[0].children[0].bold && blocks[1].mediaId === 'media-42', 'Pure JSON roundtrip');
}, { features: { images: true } });

await test('Feature-disabled destinations flatten incoming headings, lists and images', (editor, content) => {
  const data = transfer(); data.setData(clipboardType, JSON.stringify({ version: 1, blocks: [{ type: 'heading', level: 2, children: [{ text: 'Title' }] }, { type: 'list', style: 'bullet', items: [{ children: [{ text: 'Item' }] }] }, { type: 'image', src: '/photo.png', alt: 'Photo', mediaId: 2 }] }));
  paste(content, data);
  assert(editor.getJSON().blocks.every(block => block.type === 'paragraph') && editor.getText() === 'Title\nItem\nPhoto', 'Disabled features imported');
}, { features: { headings: false, lists: false, images: false } });

await test('Large/deep HTML falls back without partial conversion', (editor, content) => {
  const deep = '<div>'.repeat(70) + 'Deep' + '</div>'.repeat(70);
  paste(content, transfer('Fallback', deep)); assert(editor.getText() === 'Fallback', 'Deep fallback');
  assert(clipboardDocument('x'.repeat(1_000_001), { document }) === null, 'Input size limit');
});

let prepared = 0, uploaded = 0;
await test('Pasted image opens the shared upload modal, prepares locally and cancels without edits', async (editor, content) => {
  set(editor, paragraph('Keep me')); select(content);
  const data = transfer(); data.items.add(new File(['image bytes'], 'clipboard.png', { type: 'image/png' })); paste(content, data);
  await wait(() => document.querySelector('dialog[open] input[type=file]')?.files.length === 1);
  const dialog = document.querySelector('dialog[open]');
  assert(dialog.querySelector('input[type=file]').files[0].name === 'prepared.png' && prepared === 1 && uploaded === 0, 'Upload adapter bypassed/preparation failed');
  dialog.close(); await new Promise(requestAnimationFrame);
  assert(editor.getText() === 'Keep me', 'Cancel changed document');
}, { features: { images: true }, prepareFile: async file => { prepared++; return new File([file], 'prepared.png', { type: file.type }); }, uploadImage: async () => { uploaded++; return { id: 42, src: '/uploaded.png' }; } });

await test('Pasted image uploads only after Apply and stores the returned mediaId', async (editor, content) => {
  const data = transfer(); data.items.add(new File(['image bytes'], 'clipboard.png', { type: 'image/png' })); paste(content, data);
  await wait(() => document.querySelector('dialog[open] input[type=file]')?.files.length === 1);
  const form = document.querySelector('dialog[open] form'); form.requestSubmit();
  await wait(() => editor.getJSON().blocks.some(block => block.type === 'image'));
  assert(uploaded === 1 && editor.getJSON().blocks.find(block => block.type === 'image').mediaId === 42, 'Upload result was not preserved');
}, { features: { images: true }, uploadImage: async () => { uploaded++; return { id: 42, src: '/uploaded.png' }; } });

await test('Import modal previews Markdown and inserts the saved selection as one undo step', async (editor, content) => {
  set(editor, paragraph('Original')); select(content);
  await editor.openDialog('import');
  const dialog = document.querySelector('dialog[data-editor-dialog="import"][open]');
  const source = dialog.querySelector('textarea'); source.value = '# Imported\n\n- **First**\n- Second';
  [...dialog.querySelectorAll('button')].find(button => button.textContent === 'Conversion preview').click();
  assert(dialog.querySelector('.content h2')?.textContent === 'Imported' && dialog.querySelectorAll('.content li').length === 2, 'Preview conversion');
  assert(editor.getText() === 'Original', 'Preview edited document');
  dialog.querySelector('form').requestSubmit();
  await wait(() => !dialog.open);
  assert(editor.getJSON().blocks[0].type === 'heading' && editor.getJSON().blocks[1].items.length === 2, 'Import blocks');
  editor.command('undo'); assert(editor.getText() === 'Original', 'Import undo');
});

await test('HTML import preview is safe, follows feature settings and cancel leaves text unchanged', async (editor, content) => {
  set(editor, paragraph('Keep me')); select(content);
  await editor.openDialog('import', { format: 'html' });
  const dialog = document.querySelector('dialog[data-editor-dialog="import"][open]');
  assert(dialog.querySelector('select').value === 'html', 'Initial format');
  dialog.querySelector('textarea').value = '<h1>Title</h1><script>window.importExecuted=true</script><p><a href="/never-navigate">Link</a></p>';
  [...dialog.querySelectorAll('button')].find(button => button.textContent === 'Conversion preview').click();
  assert(!dialog.querySelector('.content h2') && dialog.querySelector('.content p')?.textContent === 'Title' && !window.importExecuted, 'Safe filtered preview');
  const link = dialog.querySelector('.content a');
  assert(!link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })), 'Preview links navigate');
  dialog.close(); await new Promise(requestAnimationFrame); assert(editor.getText() === 'Keep me', 'Cancel edited content');
}, { features: { headings: false } });

await test('Empty import is rejected and disabled import creates no dialog', async (editor) => {
  await editor.openDialog('import');
  const dialog = document.querySelector('dialog[data-editor-dialog="import"][open]');
  dialog.querySelector('form').requestSubmit(); await new Promise(requestAnimationFrame);
  assert(dialog.open && dialog.querySelector('[role=alert]').textContent, 'Empty import accepted');
  dialog.close(); await new Promise(requestAnimationFrame);
});

await test('Disabled import creates no toolbar button or dialog', async (editor, content) => {
  assert(!content.closest('.editor').querySelector('[data-editor-command="import"]'), 'Disabled toolbar button');
  assert(await editor.openDialog('import') === false && !document.querySelector('dialog[data-editor-dialog="import"]'), 'Disabled API');
}, { features: { import: false } });

await test('Changing the model while import loads cancels stale UI', async (editor) => {
  const opening = editor.openDialog('import');
  set(editor, paragraph('Changed'));
  assert(await opening === false && !document.querySelector('dialog[data-editor-dialog="import"]'), 'Stale import opened');
});

await test('Destroying an editor during import initialization cannot restore UI', async (editor) => {
  const opening = editor.openDialog('import'); editor.destroy();
  assert(await opening === false && !document.querySelector('dialog[data-editor-dialog="import"]'), 'Late dialog after destroy');
});

await test('Model changes after opening reject an obsolete import selection', async (editor, content) => {
  set(editor, paragraph('Original')); select(content); await editor.openDialog('import');
  const dialog = document.querySelector('dialog[data-editor-dialog="import"][open]');
  dialog.querySelector('textarea').value = 'Imported';
  editor.command('bold'); dialog.querySelector('form').requestSubmit(); await new Promise(requestAnimationFrame);
  assert(dialog.open && dialog.querySelector('[role=alert]').textContent.includes('content changed') && editor.getText() === 'Original', 'Obsolete selection applied');
  dialog.close(); await new Promise(requestAnimationFrame);
});

document.querySelector('#summary').textContent = `${passed} passed, ${failed} failed`;
document.documentElement.dataset.testResult = failed ? 'fail' : 'pass';
