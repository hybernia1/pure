import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareImage } from '../src/js/image.js';
import { utilities } from '../scripts/utilities.mjs';
import { configurePure, getPureConfig } from '../src/js/config.js';

test('image input/header limits reject before browser decoding', async () => {
  const bytes = new Uint8Array(33); bytes.set([137, 80, 78, 71, 13, 10, 26, 10]); const view = new DataView(bytes.buffer); view.setUint32(8, 13); bytes.set([73, 72, 68, 82], 12); view.setUint32(16, 100_000); view.setUint32(20, 100_000);
  await assert.rejects(prepareImage(new File([bytes], 'huge.png', { type: 'image/png' })), RangeError);
  view.setUint32(16, 1); view.setUint32(20, 1);
  const animated = new Uint8Array(53); animated.set(bytes); new DataView(animated.buffer).setUint32(33, 8); animated.set([97, 99, 84, 76], 37);
  await assert.rejects(prepareImage(new File([animated], 'animated.png', { type: 'image/png' })), /Animated PNG/);
  await assert.rejects(prepareImage(new File(['bad'], 'bad.jpg', { type: 'image/jpeg' })), /JPEG header/);
  await assert.rejects(prepareImage(new File(['1234'], 'a.png', { type: 'image/png' }), { maxInputBytes: 1 }), RangeError);
});
test('image policy rejects unsupported formats, options and pre-aborted work', async () => {
  await assert.rejects(prepareImage(new File(['gif'], 'a.gif', { type: 'image/gif' })), TypeError);
  const file = new File(['jpeg'], 'a.jpg', { type: 'image/jpeg' });
  await assert.rejects(prepareImage(file, { maxBytes: 0 }), TypeError);
  await assert.rejects(prepareImage(file, { quality: .2, minQuality: .5 }), TypeError);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(prepareImage(file, { signal: controller.signal }), { name: 'AbortError' });
});
test('sticky offsets use shared tokens in mobile and desktop utilities', () => {
  const css = utilities(); assert.ok(css.includes('.sticky { position:sticky; }')); assert.ok(css.includes('.dt\\:sticky { position:sticky; }'));
  assert.ok(css.includes('.top-4 { inset-block-start:var(--p-space-4); }')); assert.ok(css.includes('.z-sticky { z-index:var(--p-sticky-z); }'));
});
test('global prepareFile callback validation remains atomic', () => {
  const prepareFile = file => file;
  try {
    configurePure({ upload: { prepareFile } }); assert.equal(getPureConfig().upload.prepareFile, prepareFile);
    assert.throws(() => configurePure({ upload: { prepareFile: {} } }), TypeError); assert.equal(getPureConfig().upload.prepareFile, prepareFile);
  } finally { configurePure({ upload: { prepareFile: null } }); }
});
