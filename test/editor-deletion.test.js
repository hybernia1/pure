import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDocument, documentText, deleteContent, emptyDocument } from '../src/js/editor-model.js';
const p = text => ({ type: 'paragraph', children: [{ text }] });
const image = { type: 'image', src: '/photo.png', alt: 'Photo', mediaId: 42 };
const model = (...blocks) => normalizeDocument({ version: 1, blocks });

test('deletion spans paragraphs, list rows and images without leaving block controls in data', () => {
  const value = model(p('First'), { type: 'list', style: 'bullet', items: [{ children: [{ text: 'One' }] }, { children: [{ text: 'Two' }] }] }, image, p('Last'));
  assert.deepEqual(deleteContent(value, 0, documentText(value).length).value, emptyDocument());
  const next = deleteContent(value, 2, documentText(value).length - 2);
  assert.equal(documentText(next.value), 'Fist');
  assert.equal(next.offset, 2);
  assert.equal(value.blocks.length, 4);
});

test('backspace/delete join adjacent text blocks at their boundary', () => {
  const value = model(p('AB'), p('CD'));
  const back = deleteContent(value, 3, 3, 'backward');
  const forward = deleteContent(value, 2, 2, 'forward');
  assert.equal(documentText(back.value), 'ABCD');
  assert.equal(documentText(forward.value), 'ABCD');
  assert.equal(back.offset, 2);
  assert.equal(forward.offset, 2);
});

test('adjacent images are removed atomically with metadata of surrounding blocks retained', () => {
  const value = model(p('AB'), image, { type: 'heading', level: 3, children: [{ text: 'CD' }] });
  const back = deleteContent(value, 5, 5, 'backward');
  const forward = deleteContent(value, 2, 2, 'forward');
  assert.equal(documentText(back.value), 'AB\nCD');
  assert.equal(back.value.blocks[1].level, 3);
  assert.equal(back.offset, 3);
  assert.equal(forward.offset, 2);
  assert.deepEqual(deleteContent(model(image), 0, 0, 'forward').value, emptyDocument());
  const selected = deleteContent(value, 3, 4);
  assert.equal(selected.value.blocks.length, 2);
  assert.equal(selected.value.blocks[1].level, 3);
  const two = model(p('AB'), image, image, p('CD'));
  assert.equal(deleteContent(two, 3, 6).value.blocks.length, 2);
});

test('character deletion preserves emoji, combining accents and document boundaries', () => {
  for (const glyph of ['😀', 'e\u0301', '👩‍💻']) {
    const value = model(p(`A${glyph}B`));
    assert.equal(documentText(deleteContent(value, 1 + glyph.length, 1 + glyph.length).value), 'AB');
    assert.equal(documentText(deleteContent(value, 1, 1, 'forward').value), 'AB');
  }
  const value = model(p('A'));
  assert.equal(deleteContent(value, 0, 0).value, value);
  assert.equal(deleteContent(value, 1, 1, 'forward').value, value);
  assert.throws(() => deleteContent(value, -1, 0), RangeError);
});
