import { distRoot } from './distribution.js';
const { createEditor } = await import(`${distRoot}js/editor.js`);
const fixture = document.querySelector('#fixture');
const p = text => ({ type: 'paragraph', children: text ? [{ text }] : [] });
const image = { type: 'image', src: new URL('editor-image.svg', location.href.replace('/test/', '/examples/')).href, alt: 'Photo', mediaId: 42 };
const mixed = { version: 1, blocks: [
  { type: 'heading', level: 2, children: [{ text: 'Title', bold: true }] },
  { type: 'list', style: 'bullet', items: [{ children: [{ text: 'One' }] }, { children: [{ text: 'Two' }] }] }, image, p('End')
] };
const assert = (condition, message) => { if (!condition) throw Error(message); };
const key = (target, key, options = {}) => target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options }));
const input = (target, inputType) => target.dispatchEvent(new InputEvent('beforeinput', { inputType, bubbles: true, cancelable: true }));
const caret = (node, offset) => {
  const range = document.createRange(); range.setStart(node, offset); range.collapse(true);
  getSelection().removeAllRanges(); getSelection().addRange(range); document.dispatchEvent(new Event('selectionchange'));
};
let passed = 0, failed = 0;
async function test(name, run) {
  const row = document.createElement('li'); document.querySelector('#results').append(row);
  const source = document.createElement('textarea'); fixture.append(source);
  const editor = createEditor(source, { locale: 'en', features: { headings: true, images: true } });
  try { await editor.ready; await run(editor, fixture.querySelector('.editor-content')); row.textContent = `PASS: ${name}`; passed++; }
  catch (error) { row.textContent = `FAIL: ${name}: ${error.stack}`; failed++; }
  finally { editor.destroy(); fixture.replaceChildren(); }
}
const empty = editor => editor.getJSON().blocks.length === 1 && editor.getJSON().blocks[0].type === 'paragraph' && editor.getText() === '';

await test('Ctrl/Cmd+A selects only model content; Delete/Backspace clears all blocks in one undo step', (editor, content) => {
  for (const [modifier, deletion] of [['ctrlKey', 'Delete'], ['metaKey', 'Backspace']]) {
    editor.setJSON(mixed); content.focus();
    const snapshot = JSON.stringify(editor.getJSON());
    assert(!key(content, 'a', { [modifier]: true }), 'Select-all not intercepted');
    assert(!key(content, deletion) && empty(editor), 'All block types not deleted');
    assert(content.querySelectorAll('[data-editor-block]').length === 1 && content.querySelector('[data-editor-text]'), 'No editable empty paragraph');
    editor.command('undo'); assert(JSON.stringify(editor.getJSON()) === snapshot, 'Undo lost blocks or media ID');
    editor.command('redo'); assert(empty(editor), 'Redo did not clear');
  }
});

await test('beforeinput deletes a selected range across text, lists and images with caret and undo retained', (editor, content) => {
  editor.setJSON(mixed);
  const texts = content.querySelectorAll('[data-editor-text]');
  const range = document.createRange(); range.setStart(texts[0].querySelector('strong').firstChild, 2); range.setEnd(texts[texts.length - 1].firstChild, 1);
  getSelection().removeAllRanges(); getSelection().addRange(range);
  input(content, 'deleteContentBackward');
  assert(editor.getText() === 'Tind' && !editor.getJSON().blocks.some(block => block.type === 'list' || block.type === 'image'), 'Range not removed');
  editor.command('undo'); assert(editor.getJSON().blocks.length === 4, 'Range undo');
});

await test('Backspace and Delete join paragraphs without damaging block controls', (editor, content) => {
  editor.setJSON({ version: 1, blocks: [p('AB'), p('CD')] });
  caret(content.querySelectorAll('[data-editor-text]')[1].firstChild, 0); input(content, 'deleteContentBackward');
  assert(editor.getText() === 'ABCD' && editor.getJSON().blocks.length === 1, 'Backspace boundary');
  editor.command('undo');
  caret(content.querySelector('[data-editor-text]').firstChild, 2); input(content, 'deleteContentForward');
  assert(editor.getText() === 'ABCD' && content.querySelectorAll('[data-block-delete]').length === 1, 'Delete boundary/UI');
});

await test('Adjacent images and focused block handles can be removed with the keyboard', async (editor, content) => {
  editor.setJSON({ version: 1, blocks: [p('Before'), image, p('After')] }); await editor.ready;
  caret(content.querySelectorAll('[data-editor-text]')[1].firstChild, 0); input(content, 'deleteContentBackward');
  assert(editor.getJSON().blocks.length === 2 && editor.getText() === 'Before\nAfter', 'Image boundary');
  editor.command('undo'); await editor.ready;
  const figure = content.querySelector('[data-editor-image]'); figure.focus(); key(figure, 'Delete');
  assert(!editor.getJSON().blocks.some(block => block.type === 'image'), 'Focused image deletion');
  const handle = content.querySelector('[data-drag-handle]'); handle.focus(); key(handle, 'Backspace');
  assert(editor.getText() === 'After', 'Handle deletion');
});

await test('All-image documents clear to an editable paragraph, and cut uses the same range deletion', (editor, content) => {
  editor.setJSON({ version: 1, blocks: [image, { ...image, mediaId: 43 }] });
  key(content, 'a', { ctrlKey: true }); input(content, 'deleteContentForward'); assert(empty(editor), 'Image-only select all');
  editor.setJSON(mixed); key(content, 'a', { ctrlKey: true });
  const clipboard = new DataTransfer(); content.dispatchEvent(new ClipboardEvent('cut', { clipboardData: clipboard, bubbles: true, cancelable: true }));
  assert(empty(editor) && clipboard.getData('text/plain') === 'Title\nOne\nTwo\nPhoto\nEnd', 'Cut model/text');
});

await test('Character deletion preserves complete emoji and empty-list exit behavior', (editor, content) => {
  editor.setJSON({ version: 1, blocks: [p('A👩‍💻B')] });
  caret(content.querySelector('[data-editor-text]').firstChild, 6); input(content, 'deleteContentBackward'); assert(editor.getText() === 'AB', 'Split emoji');
  editor.setJSON({ version: 1, blocks: [{ type: 'list', style: 'bullet', items: [{ children: [] }] }] });
  caret(content.querySelector('[data-editor-text]'), 0); input(content, 'deleteContentBackward');
  assert(empty(editor), 'Empty list exit changed');
});

await test('Select all stays scoped to the editor and composition events remain native', (editor, content) => {
  editor.setJSON(mixed);
  const outside = document.createElement('textarea'); fixture.append(outside);
  assert(key(outside, 'a', { ctrlKey: true }), 'Outside shortcut captured');
  const composing = new InputEvent('beforeinput', { inputType: 'deleteContentBackward', isComposing: true, bubbles: true, cancelable: true });
  assert(content.dispatchEvent(composing) && editor.getJSON().blocks.length === 4, 'IME intercepted');
});

await test('Word deletion uses the browser target range without rewriting block UI', (editor, content) => {
  editor.setJSON({ version: 1, blocks: [p('First second')] });
  const text = content.querySelector('[data-editor-text]').firstChild; caret(text, text.length);
  const target = new StaticRange({ startContainer: text, startOffset: 6, endContainer: text, endOffset: 12 });
  content.dispatchEvent(new InputEvent('beforeinput', { inputType: 'deleteWordBackward', targetRanges: [target], bubbles: true, cancelable: true }));
  assert(editor.getText() === 'First ' && content.querySelectorAll('[data-drag-handle]').length === 1, 'Word target range lost');
});

document.querySelector('#summary').textContent = `${passed} passed, ${failed} failed`;
document.documentElement.dataset.testResult = failed ? 'fail' : 'pass';
