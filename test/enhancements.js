import { distRoot } from './distribution.js';
const { loadComponent, configurePure } = await import(`${distRoot}js/lazy.js`);
const [{ createTagPicker }, { prepareImage }, { createUpload }, { createEditor }, { createMediaLibrary }] = await Promise.all(['tag-picker', 'image', 'upload', 'editor', 'media-library'].map(name => loadComponent(name)));
const fixture = document.querySelector('#fixture'); let passed = 0; let failed = 0;
const assert = (value, message) => { if (!value) throw new Error(message); };
const tick = () => new Promise(resolve => setTimeout(resolve, 30));
const wait = async fn => { const end = Date.now() + 4000; while (!fn()) { if (Date.now() > end) throw new Error('Timeout'); await tick(); } };
const test = async (name, fn) => { const row = document.createElement('li'); document.querySelector('#results').append(row); try { await fn(); passed++; row.textContent = `OK - ${name}`; } catch (error) { failed++; row.textContent = `FAIL - ${name}: ${error.message}`; } finally { fixture.replaceChildren(); configurePure({ upload: { prepareFile: null, maxSize: Infinity } }); } };
const setupTags = options => {
  const form = document.createElement('form'); const label = document.createElement('label'); label.htmlFor = 'tags'; label.textContent = 'Post tags';
  const source = document.createElement('select'); source.id = 'tags'; source.multiple = true; source.name = 'tags[]';
  for (const [value, title] of [['10', 'JavaScript'], ['20', 'CSS']]) { const option = document.createElement('option'); option.value = value; option.textContent = title; source.append(option); }
  form.append(label, source); fixture.append(form); return { form, source, picker: createTagPicker(source, options), entry: fixture.querySelector('input') };
};
await test('WordPress tags: comma entry, add, duplicates, IDs and removal', () => {
  const { picker, entry, form } = setupTags();
  try {
    entry.value = 'JavaScript, New tag, css'; entry.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    assert(JSON.stringify(new FormData(form).getAll('tags[]')) === JSON.stringify(['10', '20', 'New tag']), 'FormData IDs/text');
    assert(picker.getTags().length === 3 && !entry.value, 'Three selected tags');
    entry.value = 'CSS'; entry.dispatchEvent(new KeyboardEvent('keydown', { key: ',', bubbles: true, cancelable: true })); assert(picker.getTags().length === 3 && !entry.value, 'Duplicate ignored');
    fixture.querySelector('[data-tag-remove="New tag"]').click(); assert(picker.getTags().length === 2, 'Remove');
  } finally { picker.destroy(); }
});
await test('Tags: max, known-only, safe labels, reset, disabled and cleanup', async () => {
  const { picker, entry, source, form } = setupTags({ maxTags: 1, allowCreate: false });
  try {
    assert(!picker.add('Unknown') && picker.add('CSS') && !picker.add('JavaScript'), 'Limits');
    source.disabled = true; await tick(); assert(entry.disabled && !picker.add('New'), 'Disabled');
    source.disabled = false; form.reset(); await tick(); assert(!picker.getTags().length, 'Reset');
    picker.destroy(); assert(!source.hidden && !fixture.querySelector('.tag-picker'), 'Cleanup');
  } finally { picker.destroy(); }
});
await test('Tag suggestions retain server IDs and ignore stale requests', async () => {
  let resolveOld; const { picker, entry } = setupTags({ delay: 0, fetch: query => query === 'old' ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve([{ label: '<b>Server tag</b>', value: '42' }]) });
  try {
    entry.value = 'old'; entry.dispatchEvent(new Event('input', { bubbles: true })); await wait(() => resolveOld);
    entry.value = 'new'; entry.dispatchEvent(new Event('input', { bubbles: true })); await wait(() => fixture.querySelector('[data-search-index]'));
    resolveOld([{ label: 'Stale', value: '99' }]); await tick();
    const row = fixture.querySelector('[data-search-index]'); assert(row.textContent === '<b>Server tag</b>' && !row.querySelector('b'), 'Safe latest result');
    row.click(); assert(picker.getTags()[0].value === '42' && !entry.value, 'ID selection');
  } finally { picker.destroy(); }
});
const imageFile = async () => {
  const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 400; const ctx = canvas.getContext('2d'); ctx.fillStyle = '#789'; ctx.fillRect(0, 0, 800, 400);
  return new File([await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))], 'landscape.png', { type: 'image/png' });
};
await test('Image preparation: real encoder, dimensions, MIME, bytes and source preservation', async () => {
  const source = await imageFile(); const before = source.size;
  const result = await prepareImage(source, { maxWidth: 320, maxHeight: 320, maxBytes: 1200 });
  assert(result.width === 320 && result.height === 160 && result.file.size <= 1200 && result.file.type === 'image/webp' && result.file.name === 'landscape.webp', 'Output contract');
  assert(source.size === before && source.name === 'landscape.png', 'Original untouched');
});
await test('Image rejection: abort, input cap, impossible cap, malformed and animated types', async () => {
  const file = await imageFile(); const controller = new AbortController(); controller.abort();
  for (const [input, options] of [[file, { signal: controller.signal }], [file, { maxInputBytes: 1 }], [file, { maxBytes: 1 }], [new File(['bad'], 'bad.png', { type: 'image/png' }), {}], [new File(['gif'], 'a.gif', { type: 'image/gif' }), {}]]) {
    let rejected = false; try { await prepareImage(input, options); } catch { rejected = true; } assert(rejected, 'Invalid input rejected');
  }
});
await test('JPEG encoder and transparent PNG retain dimensions and alpha policy', async () => {
  const canvas = document.createElement('canvas'); canvas.width = 80; canvas.height = 40; const ctx = canvas.getContext('2d'); ctx.fillStyle = 'rgba(80,120,160,.5)'; ctx.fillRect(0, 0, 80, 40);
  const png = new File([await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))], 'alpha.png', { type: 'image/png' });
  const result = await prepareImage(png, { type: 'image/png', maxWidth: 40, maxBytes: 10000 });
  const bitmap = await createImageBitmap(result.file); canvas.width = 40; canvas.height = 20; ctx.drawImage(bitmap, 0, 0); bitmap.close();
  assert(ctx.getImageData(10, 10, 1, 1).data[3] < 200, 'Transparency retained');
  const jpeg = new File([await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'))], 'photo.jpg', { type: 'image/jpeg' });
  const encoded = await prepareImage(jpeg, { type: 'image/jpeg', maxWidth: 20, maxBytes: 10000 });
  assert(encoded.width === 20 && encoded.height === 10 && encoded.file.type === 'image/jpeg', 'JPEG dimensions/encoding');
});
const setupUpload = prepareFile => {
  const form = document.createElement('form'); const root = document.createElement('div'); root.dataset.upload = '';
  const input = document.createElement('input'); input.type = 'file'; const list = document.createElement('ul'); list.dataset.uploadList = ''; const status = document.createElement('p'); status.dataset.uploadStatus = '';
  root.append(input, list, status); form.append(root); fixture.append(form);
  return { input, form, upload: createUpload(input, { maxSize: 6, prepareFile }) };
};
await test('Upload preparation precedes output cap and sync setFiles stays synchronous', async () => {
  const { upload } = setupUpload(async file => new File(['small'], file.name, { type: file.type }));
  try {
    const original = new File(['too-large-original'], 'a.txt', { type: 'text/plain' });
    assert(upload.setFiles([original]) === false, 'Sync cap');
    assert(await upload.prepareAndSetFiles([original]), 'Preparation accepted'); assert(upload.getFiles()[0].size === 5 && await upload.ready, 'Transformed data');
    assert(upload.setFiles([]) === true, 'Sync compatibility');
  } finally { upload.destroy(); }
});
await test('Real noisy PNG over 20 MiB becomes a browser-prepared file below a 6 MiB upload cap', async () => {
  const canvas = document.createElement('canvas'); canvas.width = 3000; canvas.height = 2400; const ctx = canvas.getContext('2d');
  const pixels = ctx.createImageData(3000, 2400); let seed = 123456789;
  for (let at = 0; at < pixels.data.length; at += 4) {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    pixels.data[at] = seed & 255; pixels.data[at + 1] = seed >>> 8 & 255; pixels.data[at + 2] = seed >>> 16 & 255; pixels.data[at + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0); const original = new File([await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))], 'large-photo.png', { type: 'image/png' }); canvas.width = 0; canvas.height = 0;
  assert(original.size > 20 * 1024 * 1024, `Large source: ${original.size}`);
  const root = document.createElement('div'); root.dataset.upload = ''; const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/png,image/webp'; const list = document.createElement('ul'); list.dataset.uploadList = ''; const status = document.createElement('p'); status.dataset.uploadStatus = ''; root.append(input, list, status); fixture.append(root);
  const upload = createUpload(input, { maxSize: 6 * 1024 * 1024, prepareFile: async (file, { signal }) => (await prepareImage(file, { maxBytes: 5 * 1024 * 1024, signal })).file });
  try {
    const transfer = new DataTransfer(); transfer.items.add(original); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }));
    assert(await upload.ready, status.textContent); assert(input.files[0].size <= 5 * 1024 * 1024 && input.files[0].type === 'image/webp', 'Prepared file in native input');
  } finally { upload.destroy(); }
});
await test('Upload async lifecycle: submit blocked, latest wins, failures keep previous, destroy cancels', async () => {
  const tasks = []; const { upload, form } = setupUpload((file, { signal }) => new Promise(resolve => tasks.push({ resolve, signal, file })));
  try {
    upload.setFiles([new File(['old'], 'old.txt')]);
    const first = upload.prepareAndSetFiles([new File(['first'], 'first.txt')]);
    const submit = new Event('submit', { bubbles: true, cancelable: true }); form.dispatchEvent(submit); assert(submit.defaultPrevented, 'Submit blocked');
    const second = upload.prepareAndSetFiles([new File(['last'], 'last.txt')]); tasks[1].resolve(tasks[1].file); assert(await second, 'Latest');
    tasks[0].resolve(tasks[0].file); assert(!await first && upload.getFiles()[0].name === 'last.txt', 'Stale ignored');
    const bad = upload.prepareAndSetFiles([new File(['way-too-large'], 'bad.txt')]); tasks[2].resolve(tasks[2].file); assert(!await bad && !await upload.ready && upload.getFiles()[0].name === 'last.txt', 'Failure retained');
    const late = upload.prepareAndSetFiles([new File(['late'], 'late.txt')]); upload.destroy(); assert(tasks[3].signal.aborted, 'Abort'); tasks[3].resolve(tasks[3].file); assert(!await late && !fixture.querySelector('[aria-busy]'), 'No resurrection');
  } finally { upload.destroy(); }
});
await test('Pending upload respects canceled reset and cancels a real reset', async () => {
  const tasks = []; const { upload, form } = setupUpload((file, { signal }) => new Promise(resolve => tasks.push({ file, signal, resolve })));
  try {
    const pending = upload.prepareAndSetFiles([new File(['ok'], 'kept.txt')]);
    const cancel = event => event.preventDefault(); form.addEventListener('reset', cancel); form.reset(); await tick(); assert(!tasks[0].signal.aborted, 'Canceled reset retained task');
    tasks[0].resolve(tasks[0].file); assert(await pending, 'Accepted after canceled reset');
    form.removeEventListener('reset', cancel); const next = upload.prepareAndSetFiles([new File(['new'], 'new.txt')]); form.reset(); await tick(); assert(tasks[1].signal.aborted && !upload.getFiles().length, 'Real reset canceled');
    tasks[1].resolve(tasks[1].file); assert(!await next && !upload.getFiles().length, 'No late reset data');
  } finally { upload.destroy(); }
});
await test('Editor uses prepared image and blocks apply during processing', async () => {
  let finish; let sent;
  const source = document.createElement('textarea'); fixture.append(source);
  const editor = createEditor(source, { features: { images: true }, prepareFile: (file, { signal }) => new Promise(resolve => { finish = () => resolve(new File(['ok'], 'small.png', { type: file.type })); }), uploadImage: async file => { sent = file; return { id: 3, src: '/examples/editor-image.svg' }; } });
  try {
    await editor.openDialog('image'); const dialog = document.querySelector('[data-editor-dialog="image"]'); const input = dialog.querySelector('[type="file"]');
    const transfer = new DataTransfer(); transfer.items.add(new File([new Uint8Array(11 * 1024 * 1024)], 'large.png', { type: 'image/png' })); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }));
    dialog.querySelector('[type="submit"]').click(); await tick(); assert(!sent, 'No original upload'); finish();
    try { await wait(() => input.files[0]?.name === 'small.png'); } catch { throw new Error(`Prepared selection missing: ${dialog.textContent}`); }
    dialog.querySelector('[type="submit"]').click();
    try { await wait(() => sent); } catch { throw new Error(`Upload not called: ${dialog.textContent}`); }
    assert(sent.size === 2, 'Prepared upload');
  } finally { editor.destroy(); }
});
await test('Media library applies shared prepare hook before validation/upload', async () => {
  let sent; configurePure({ upload: { maxSize: 6, prepareFile: async file => new File(['ok'], 'small.png', { type: file.type }) } });
  const library = createMediaLibrary({ load: () => [], upload: async file => { sent = file; return { id: 'a', src: '/examples/editor-image.svg' }; } });
  try {
    await library.open(); const input = library.dialog.querySelector('[type="file"]'); const transfer = new DataTransfer(); transfer.items.add(new File(['oversized-original'], 'big.png', { type: 'image/png' })); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); await wait(() => sent); assert(sent.size === 2, 'Prepared library upload');
  } finally { library.destroy(); }
});
await test('Sticky utility follows scroll and uses shared inset tokens', () => {
  const scroller = document.createElement('div'); scroller.style.cssText = 'height:100px;overflow:auto'; const inner = document.createElement('div'); inner.style.height = '600px';
  const sticky = document.createElement('div'); sticky.className = 'sticky top-0 z-sticky'; sticky.textContent = 'Sticky'; inner.append(sticky); scroller.append(inner); fixture.append(scroller);
  const before = sticky.getBoundingClientRect().top; scroller.scrollTop = 80; const after = sticky.getBoundingClientRect().top;
  assert(getComputedStyle(sticky).position === 'sticky' && Math.abs(after - before) < 1, 'Sticky geometry');
});
await test('Tag controls and long labels fit a 375px document', async () => {
  const frame = document.createElement('iframe'); frame.style.width = '375px'; fixture.append(frame); const doc = frame.contentDocument;
  const css = doc.createElement('link'); css.rel = 'stylesheet'; css.href = `${distRoot}pure.css`; await new Promise((resolve, reject) => { css.onload = resolve; css.onerror = reject; doc.head.append(css); });
  const source = doc.createElement('select'); source.multiple = true; doc.body.append(source); const picker = createTagPicker(source);
  try {
    picker.add('VeryLongTag'.repeat(30));
    await wait(() => frame.contentWindow.getComputedStyle(doc.querySelector('.tag-picker')).display === 'grid');
    const width = doc.documentElement.clientWidth;
    assert(doc.documentElement.scrollWidth <= width, `No horizontal overflow: ${doc.documentElement.scrollWidth}/${width}; ${[...doc.body.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > width).map(el => el.className || el.tagName).join(',')}`);
  }
  finally { picker.destroy(); frame.remove(); }
});
document.querySelector('#summary').textContent = `${passed} passed, ${failed} failed.`;
