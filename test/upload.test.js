import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateFiles } from '../src/js/upload.js';

test('upload přijme MIME, wildcard a přípony bez ohledu na velikost písmen', () => {
  assert.deepEqual(validateFiles([new File(['a'], 'PHOTO.PNG', { type: 'image/png' })], { accept: 'image/*' }), []);
  assert.deepEqual(validateFiles([new File(['a'], 'NOTES.TXT')], { accept: '.pdf, .txt' }), []);
  assert.deepEqual(validateFiles([new File(['a'], 'a.webp', { type: 'image/webp' })], { accept: 'image/webp' }), []);
});
test('upload odmítne špatný počet, typ i velikost; prázdný výběr je validní', () => {
  const files = [new File(['12345'], 'a.exe', { type: 'application/octet-stream' }), new File(['a'], 'b.txt')];
  const errors = validateFiles(files, { accept: '.txt', maxSize: 4, maxFiles: 1 });
  assert.equal(errors.length, 3);
  assert.deepEqual(validateFiles([], { maxFiles: 1 }), []);
  assert.throws(() => validateFiles([], { maxSize: 0 }), TypeError);
});
