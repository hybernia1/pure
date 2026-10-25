import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markdownDocument } from '../src/js/editor-markdown.js';
import { plainText } from '../src/js/editor-model.js';

test('Markdown imports headings, whole lists, marks, links and image alt text into JSON', () => {
  const value = markdownDocument('# Title\r\n\r\n- **Bold**\r\n- *Italic*\r\n\r\n1. [Link](/safe)\r\n2. ~~Gone~~\r\n\r\n![Photo](https://example.com/photo.png)');
  assert.deepEqual(value.blocks.map(block => block.type), ['heading', 'list', 'list', 'paragraph']);
  assert.equal(value.blocks[0].level, 2);
  assert.equal(value.blocks[1].items[0].children[0].bold, true);
  assert.equal(value.blocks[1].items[1].children[0].italic, true);
  assert.equal(value.blocks[2].style, 'ordered');
  assert.equal(value.blocks[2].items[0].children[0].link, '/safe');
  assert.equal(value.blocks[2].items[1].children[0].strike, true);
  assert.equal(value.blocks[3].children[0].text, 'Photo');
});

test('Markdown treats raw HTML, escapes and code as text and rejects unsafe link targets', () => {
  const value = markdownDocument('\\*literal\\* `<script>` [bad](javascript:alert)\n\n```html\n<img src="/never-fetch">\n**literal**\n```');
  assert.equal(value.blocks[0].children[0].text, '*literal* <script> bad');
  assert.ok(value.blocks.every(block => !block.children.some(run => run.link)));
  assert.equal(value.blocks[1].children[0].text, '<img src="/never-fetch">');
  assert.equal(value.blocks[2].children[0].text, '**literal**');
});

test('Markdown supports combined emphasis and leaves ordinary underscores intact', () => {
  const value = markdownDocument('***Both*** **bold *nested*** *italic **nested*** user_name');
  assert.ok(value.blocks[0].children.some(run => run.text === 'Both' && run.bold && run.italic));
  assert.equal(value.blocks[0].children.filter(run => run.text === 'nested' && run.bold && run.italic).length, 2);
  assert.equal(plainText(value), 'Both bold nested italic nested user_name');
});

test('Markdown import bounds work and empty input has no fragment', () => {
  assert.equal(markdownDocument(' \n\n'), null);
  assert.equal(markdownDocument('![](https://example.com/image.png)'), null);
  assert.throws(() => markdownDocument('x'.repeat(1_000_001)), RangeError);
  assert.throws(() => markdownDocument('\n'.repeat(10_000)), RangeError);
});
