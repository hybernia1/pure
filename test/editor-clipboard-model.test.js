import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDocument, documentText, replaceDocument, selectionDocument } from '../src/js/editor-model.js';

const paragraph = (text, marks = {}) => ({ type: 'paragraph', children: text ? [{ text, ...marks }] : [] });
const model = (...blocks) => normalizeDocument({ version: 1, blocks });

test('clipboard fragments merge inline edges, replace selections and retain UTF-16 marks', () => {
  const original = model(paragraph('A😀Z', { bold: true }));
  const fragment = model(paragraph('XY', { italic: true }));
  const result = replaceDocument(original, 1, 3, fragment);
  assert.equal(documentText(result.value), 'AXYZ');
  assert.equal(result.offset, 3);
  assert.deepEqual(result.value.blocks[0].children, [{ text: 'A', bold: true }, { text: 'XY', italic: true }, { text: 'Z', bold: true }]);
  assert.equal(documentText(original), 'A😀Z');
  fragment.blocks[0].children[0].text = 'changed';
  assert.equal(documentText(result.value), 'AXYZ');
});

test('structured paste keeps headings and whole lists between destination text', () => {
  const original = model(paragraph('beforeafter'));
  const fragment = model({ type: 'heading', level: 2, children: [{ text: 'Title' }] }, {
    type: 'list', style: 'bullet', items: [{ children: [{ text: 'one' }] }, { children: [{ text: 'two' }] }]
  });
  const result = replaceDocument(original, 6, 6, fragment);
  assert.equal(documentText(result.value), 'before\nTitle\none\ntwo\nafter');
  assert.deepEqual(result.value.blocks.map(block => block.type), ['paragraph', 'heading', 'list', 'paragraph']);
  assert.equal(result.offset, 'before\nTitle\none\ntwo'.length);
  assert.equal(result.value.blocks[2].items.length, 2);
});

test('clipboard slicing preserves partial list runs, links and durable media IDs', () => {
  const original = model(paragraph('First'), {
    type: 'list', style: 'ordered', items: [{ children: [{ text: 'abc', link: '/safe' }] }, { children: [{ text: 'def' }] }]
  }, { type: 'image', src: '/asset.png', alt: 'Photo', mediaId: 42 });
  const fragment = selectionDocument(original, 7, documentText(original).length);
  assert.equal(fragment.blocks[0].type, 'list');
  assert.deepEqual(fragment.blocks[0].items[0].children, [{ text: 'bc', link: '/safe' }]);
  assert.equal(fragment.blocks[1].mediaId, 42);
  const inserted = replaceDocument(model(paragraph('')), 0, 0, fragment);
  assert.equal(documentText(inserted.value), 'bc\ndef\n\ufffc');
  assert.equal(inserted.value.blocks[0].items.length, 2);
});

test('paragraph paste retains a destination heading and list identity without merging incoming lists', () => {
  const heading = model({ type: 'heading', level: 3, children: [{ text: 'abcd' }] });
  const result = replaceDocument(heading, 2, 2, model(paragraph('X')));
  assert.equal(result.value.blocks[0].type, 'heading');
  assert.equal(documentText(result.value), 'abXcd');
  assert.equal(result.offset, 3);
  const list = model({ type: 'list', style: 'bullet', items: [{ children: [{ text: 'ab' }] }, { children: [{ text: 'cd' }] }] });
  const pasted = replaceDocument(list, 1, 1, model({ type: 'list', style: 'bullet', items: [{ children: [{ text: 'NEW' }] }] }));
  assert.equal(documentText(pasted.value), 'a\nNEW\nb\ncd');
  assert.equal(pasted.value.blocks.length, 3);
});
