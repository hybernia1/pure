import { distRoot } from './distribution.js';
const { createEditor, createFlash, createLoader, createForm, initPasswords, initInputs, createSelect, createPicker, createModal, createUpload, createResize, createActivity, createProgress, createSearch, createDragDrop, createMediaLibrary } = await import(`${distRoot}js/index.js`);
const { cleanHTML } = await import(`${distRoot}js/html.js`);
const { configurePure, getPureConfig } = await import(`${distRoot}js/config.js`);
const fixture = document.querySelector('#fixture');
const results = document.querySelector('#results');
let failed = 0; let passed = 0;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function waitFor(selector) { const deadline = performance.now() + 5000; while (!document.querySelector(selector)) { if (performance.now() > deadline) throw new Error(`Timed out: ${selector}`); await new Promise(resolve => setTimeout(resolve, 5)); } return document.querySelector(selector); }
async function test(name, fn) {
  const row = document.createElement('li'); results.append(row);
  try { await fn(); row.textContent = `OK — ${name}`; passed++; }
  catch (error) { row.textContent = `CHYBA — ${name}: ${error.message}`; failed++; }
  finally { fixture.replaceChildren(); document.querySelectorAll('.editor-dialog, .editor-fullscreen').forEach(dialog => { if (dialog.open) dialog.close(); dialog.remove(); }); }
}
await test('HTML allowlist odstraní aktivní obsah a zachová textové formátování', async () => {
  const html = cleanHTML('<p class="bad" onclick="alert(1)">A<strong>B</strong><a href="java&#10;script:alert(1)">C</a><a href="/safe">D</a><img src=x onerror="alert(1)"><svg><script>alert(1)</script></svg><iframe srcdoc="x">x</iframe></p>');
  assert(html === '<p>A<strong>B</strong><a>C</a><a href="/safe">D</a></p>', html);
});
await test('JSON editor přepíná formátování, synchronizuje FormData, undo/redo a reset', async () => {
  const form = document.createElement('form');
  form.innerHTML = '<label for="test-body">Obsah</label><textarea id="test-body" name="body"></textarea>';
  form.querySelector('textarea').defaultValue = JSON.stringify({ version: 1, blocks: [{ type: 'paragraph', children: [{ text: 'Ahoj světe' }] }] });
  fixture.append(form);
  const source = form.querySelector('textarea'); const editor = createEditor(source);
  await editor.ready;
  const content = form.querySelector('[contenteditable]');
  content.focus();
  const text = content.querySelector('p').firstChild;
  const range = document.createRange(); range.setStart(text, 0); range.setEnd(text, 4);
  const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
  document.dispatchEvent(new Event('selectionchange'));
  assert(editor.command('bold'), 'Tučný text se neaplikoval.');
  assert(editor.getJSON().blocks[0].children[0].bold === true, 'Chybí bold v JSON.');
  assert(JSON.parse(new FormData(form).get('body')).blocks[0].children[0].bold, 'FormData není JSON.');
  assert(form.querySelector('[data-editor-command="bold"]').getAttribute('aria-pressed') === 'true', 'Toolbar není aktivní.');
  editor.command('bold'); assert(editor.getJSON().blocks[0].children.length === 1, 'Toggle nevypnul bold.');
  editor.command('undo'); assert(editor.getJSON().blocks[0].children[0].bold, 'Undo');
  editor.command('redo'); assert(!editor.getJSON().blocks[0].children[0].bold, 'Redo');
  const clone = editor.getJSON(); clone.blocks[0].children[0].text = 'mutace'; assert(editor.getText() === 'Ahoj světe', 'GetJSON sdílí stav.');
  editor.setJSON({ version: 1, blocks: [{ type: 'paragraph', children: [{ text: '<img src=x onerror=alert(1)>' }] }] });
  await editor.ready;
  assert(!content.querySelector('img') && content.textContent.includes('<img'), 'JSON text se interpretoval jako HTML.');
  let rejected = false; try { editor.setJSON('<p>HTML</p>'); } catch { rejected = true; } assert(rejected, 'HTML import byl přijat.');
  await editor.ready;
  form.reset(); await new Promise(resolve => setTimeout(resolve, 0)); assert(editor.getText() === 'Ahoj světe', 'Reset');
  editor.setJSON({ version: 1, blocks: [{ type: 'paragraph', children: [{ text: 'Zachovat' }] }] });
  await editor.ready;
  form.addEventListener('reset', event => event.preventDefault(), { once: true });
  form.reset(); await new Promise(resolve => setTimeout(resolve, 0)); assert(editor.getText() === 'Zachovat', 'Zrušený reset přepsal model.');
  editor.destroy(); assert(!source.hidden && !form.querySelector('.editor'), 'Cleanup');
});
await test('JSON editor formátuje více odstavců a má SVG ikony s názvy', async () => {
  const source = document.createElement('textarea'); source.value = JSON.stringify({ version: 1, blocks: ['První', 'Druhý'].map(text => ({ type: 'paragraph', children: [{ text }] })) }); fixture.append(source);
  const editor = createEditor(source); const content = fixture.querySelector('[contenteditable]');
  await editor.ready;
  const range = document.createRange(); range.selectNodeContents(content);
  const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); document.dispatchEvent(new Event('selectionchange'));
  editor.command('italic');
  assert(editor.getJSON().blocks.every(block => block.children[0].italic), 'Formátování napříč odstavci');
  assert([...fixture.querySelectorAll('.editor-tool')].every(button => button.querySelector('svg use')), 'Chybí SVG ikony.');
  assert([...fixture.querySelectorAll('.editor-tool')].every(button => button.getAttribute('aria-label') && button.title), 'Chybí názvy ikon.');
  editor.destroy();
});
await test('Editor vkládá formátovaný text, odstavce a upravuje odkazy přes Pure modal', async () => {
  const source = document.createElement('textarea'); fixture.append(source); const editor = createEditor(source);
  await editor.ready;
  const content = fixture.querySelector('[contenteditable]'); content.focus();
  const range = document.createRange(); range.selectNodeContents(content.firstChild); range.collapse(true);
  getSelection().removeAllRanges(); getSelection().addRange(range); document.dispatchEvent(new Event('selectionchange'));
  editor.command('bold');
  content.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: 'Pure', bubbles: true, cancelable: true }));
  assert(editor.getJSON().blocks[0].children[0].bold, 'Formátování nového textu');
  content.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertParagraph', bubbles: true, cancelable: true }));
  assert(editor.getJSON().blocks.length === 2, 'Enter nevytvořil odstavec.');
  editor.command('bold');
  content.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: 'Web', bubbles: true, cancelable: true }));
  const text = content.lastChild.querySelector('[data-editor-text]'); const selected = document.createRange(); selected.selectNodeContents(text);
  getSelection().removeAllRanges(); getSelection().addRange(selected); document.dispatchEvent(new Event('selectionchange'));
  fixture.querySelector('[data-editor-command="link"]').click(); await waitFor('[data-editor-dialog="link"][open]');
  const panel = document.querySelector('[data-editor-dialog="link"]'); assert(panel.open && panel.matches(':modal'), 'Modal odkazu');
  panel.querySelector('input').value = '/docs'; panel.querySelector('button[type="submit"]').click(); await new Promise(resolve => setTimeout(resolve, 0));
  assert(editor.getJSON().blocks[1].children[0].link === '/docs', 'Chybí odkaz v JSON.');
  assert(content.querySelector('a').getAttribute('href') === '/docs' && !panel.open, 'Zobrazení odkazu');
  editor.command('unlink'); assert(!editor.getJSON().blocks[1].children[0].link, 'Unlink'); editor.destroy();
});
await test('Flash vkládá text, oznamuje stav a zavírá se klávesnicovým tlačítkem', async () => {
  const region = document.createElement('div'); fixture.append(region); const flash = createFlash(region);
  flash.show('<b>Chyba</b>', { state: 'error' });
  assert(!region.querySelector('b'), 'HTML zprávy se interpretovalo.');
  await new Promise(resolve => setTimeout(resolve, 5));
  assert(region.querySelector('[role="alert"]').textContent.includes('Chyba'), 'Chybí live oznámení.');
  const close = region.querySelector('button'); close.focus(); close.click();
  assert(!region.querySelector('.flash'), 'Zpráva nezmizela.'); assert(document.activeElement === region, 'Ztracený focus.');
  flash.destroy(); assert(!region.childNodes.length, 'Flash cleanup');
});
await test('Skutečný AJAX načte HTML a při 404 zachová poslední obsah', async () => {
  const target = document.createElement('div'); fixture.append(target); const loader = createLoader(target);
  await loader.load('../examples/fragment.html', { format: 'html' }); assert(target.querySelector('h3'), 'Fragment chybí.');
  const previous = target.innerHTML;
  try { await loader.load('../examples/missing.html'); throw new Error('404 nebyla odmítnuta.'); }
  catch (error) { assert(error.status === 404, error.message); }
  assert(target.innerHTML === previous && !target.hasAttribute('aria-busy'), 'Obsah nebo busy se neobnovil.'); loader.destroy();
});
await test('Formulář validuje e-mail a pattern, zachová popis, resetuje chyby a přepíná heslo', async () => {
  const form = document.createElement('form');
  form.innerHTML = '<div data-field><label for="test-email">E-mail</label><input class="input" id="test-email" name="email" type="email" required aria-describedby="email-hint"><p id="email-hint">Popis</p><p data-field-error hidden></p></div><div data-field><input name="username" pattern="[a-z]{3,}" required><p data-field-error hidden></p></div><input id="test-password" type="password" value="test-password"><button type="button" data-password-toggle aria-controls="test-password">Heslo</button>';
  fixture.append(form);
  const controller = createForm(form); const cleanup = initPasswords(form);
  const email = form.elements.email; const username = form.elements.username;
  email.value = 'invalid'; username.value = 'ab1';
  const invalidSubmit = new Event('submit', { bubbles: true, cancelable: true }); form.dispatchEvent(invalidSubmit);
  assert(invalidSubmit.defaultPrevented, 'Neplatný submit prošel.');
  assert(document.activeElement === email && email.getAttribute('aria-invalid') === 'true', 'Focus nebo ARIA chybí.');
  assert(email.getAttribute('aria-describedby').includes('email-hint '), 'Původní popis se ztratil.');
  email.value = 'test@example.com'; username.value = 'valid';
  assert(controller.validate({ focus: false }), 'Platné hodnoty neprošly.');
  assert(email.getAttribute('aria-describedby') === 'email-hint' && !email.hasAttribute('aria-invalid'), 'ARIA se neobnovilo.');
  const password = form.querySelector('#test-password'); const toggle = form.querySelector('button');
  toggle.click(); assert(password.type === 'text' && toggle.getAttribute('aria-pressed') === 'true', 'Heslo se nezobrazilo.');
  form.reset(); await Promise.resolve(); assert(password.type === 'password', 'Reset neskrývá heslo.');
  assert([...form.querySelectorAll('[data-field-error]')].every(node => node.hidden), 'Reset nechal chyby.');
  cleanup(); controller.destroy(); assert(!form.noValidate && toggle.textContent === 'Heslo', 'Form cleanup');
});
await test('Modal je v top layer, drží počáteční focus a po zavření jej vrátí', async () => {
  const button = document.createElement('button'); button.textContent = 'Otevřít';
  const dialog = document.createElement('dialog'); dialog.className = 'modal'; dialog.setAttribute('aria-label', 'Test dialogu');
  dialog.innerHTML = '<button type="button" autofocus data-modal-close="done">Hotovo</button><input aria-label="Test"><button type="button" data-modal-close>Zavřít</button>';
  fixture.append(button, dialog); const modal = createModal(dialog); button.focus(); modal.open(button);
  assert(dialog.querySelector('[data-modal-close=""] use').getAttribute('href').endsWith('#close') && dialog.querySelector('[data-modal-close=""]').getAttribute('aria-label'), 'Zavření nemá přístupnou ikonu.');
  assert(dialog.matches(':modal') && dialog.contains(document.activeElement), 'Dialog není modální nebo nemá focus.');
  const closed = new Promise(resolve => dialog.addEventListener('close', resolve, { once: true }));
  dialog.querySelector('button').click(); await closed;
  assert(!dialog.open && dialog.returnValue === 'done' && document.activeElement === button, 'Návrat focusu / returnValue');
  modal.open(button);
  const backdropClosed = new Promise(resolve => dialog.addEventListener('close', resolve, { once: true }));
  const bounds = dialog.getBoundingClientRect();
  dialog.dispatchEvent(new PointerEvent('pointerdown', { clientX: bounds.left - 2, clientY: bounds.top - 2 }));
  dialog.dispatchEvent(new MouseEvent('click', { clientX: bounds.left - 2, clientY: bounds.top - 2 })); await backdropClosed;
  assert(!dialog.open, 'Backdrop nezavřel modal.'); modal.destroy();
});
await test('Upload synchronizuje drop a FormData, odmítá soubory a podporuje odebrání i reset', async () => {
  const form = document.createElement('form');
  form.innerHTML = '<div data-upload><label for="test-files">Soubory</label><input id="test-files" name="files" type="file" multiple accept=".txt,image/png"><p data-upload-status role="status"></p><ul data-upload-list></ul></div>';
  fixture.append(form); const input = form.querySelector('input'); const zone = form.querySelector('[data-upload]');
  let changes = 0; const upload = createUpload(input, { maxFiles: 2, maxSize: 1000, onChange: () => changes++ });
  const file = new File(['abc'], 'test.txt', { type: 'text/plain' });
  const transfer = new DataTransfer(); transfer.items.add(file);
  zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
  assert(input.files.length === 1 && new FormData(form).get('files').name === 'test.txt', 'Drop se nedostal do formuláře.');
  assert(!upload.setFiles([new File(['bad'], 'bad.exe')]), 'Nepovolený typ prošel.');
  assert(input.files[0].name === 'test.txt' && form.querySelector('[data-upload-status]').dataset.state === 'error', 'Odmítnutí změnilo původní soubory.');
  const png = new File([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII='), c => c.charCodeAt(0))], 'test.png', { type: 'image/png' });
  upload.setFiles([png]); assert(form.querySelector('.upload-preview')?.src.startsWith('blob:'), 'Chybí lokální náhled.');
  form.querySelector('[data-remove-file]').click(); assert(!input.files.length && !upload.getFiles().length, 'Odebrání nesynchronizovalo input.');
  upload.setFiles([file]); form.reset(); await new Promise(resolve => setTimeout(resolve, 0));
  assert(!input.files.length && !form.querySelector('.upload-item'), 'Reset nevyprázdnil upload.');
  input.disabled = true; assert(!upload.setFiles([file]), 'Disabled upload přijímá soubory.');
  assert(changes >= 4, 'Chybí callbacky.'); upload.destroy();
});
await test('Ikony polí a heslové oko jsou uvnitř obalu a cleanup vrátí původní input', async () => {
  fixture.innerHTML = '<label for="icon-email">E-mail</label><input class="input" data-input-icon="mail" id="icon-email" type="email"><label for="icon-password">Heslo</label><input class="input" data-input-icon="lock" id="icon-password" type="password">';
  const stop = initInputs(fixture); const password = fixture.querySelector('#icon-password');
  const toggle = password.parentElement.querySelector('button');
  assert(password.parentElement.classList.contains('control-with-action') && toggle.classList.contains('control-action'), 'Oko není uvnitř pole.');
  assert(toggle.querySelector('use').getAttribute('href').endsWith('#eye'), 'Chybí ikona oka.');
  toggle.click(); assert(password.type === 'text' && toggle.querySelector('use').getAttribute('href').endsWith('#eye-off') && toggle.getAttribute('aria-label') === 'Skrýt heslo', 'Stav heslové ikony');
  stop(); assert(password.type === 'password' && !fixture.querySelector('.control'), 'Cleanup vstupů');
});
await test('Vlastní select podporuje klávesnici, zakázané skupiny, multiple a FormData', async () => {
  const form = document.createElement('form'); form.innerHTML = '<label for="custom-role">Role</label><select id="custom-role" name="role" required><option value="">Vyber</option><optgroup label="Tým"><option value="author">Autor</option><option value="editor">Editor</option></optgroup><optgroup label="Zákaz" disabled><option value="admin">Správce</option></optgroup></select>';
  fixture.append(form); const source = form.querySelector('select'); const select = createSelect(source); const controller = createForm(form);
  assert(source.hidden && !controller.validate() && document.activeElement === form.querySelector('.control-trigger'), 'Validace nezaměřila proxy.');
  select.open(); const panel = form.querySelector('[role="listbox"]'); assert(panel.matches(':popover-open'), 'Nabídka není vlastní popover.');
  assert(panel.querySelector('[data-option-index="3"]').disabled, 'Disabled optgroup je aktivní.');
  panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', bubbles: true, cancelable: true }));
  panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  assert(new FormData(form).get('role') === 'editor' && !panel.matches(':popover-open'), 'Výběr klávesnicí');
  source.multiple = true; select.refresh(); select.open(); panel.querySelector('[data-option-index="1"]').click();
  assert(new FormData(form).getAll('role').length === 2 && panel.matches(':popover-open'), 'Multiple výběr');
  panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); assert(!panel.matches(':popover-open'), 'Escape');
  form.reset(); await new Promise(resolve => setTimeout(resolve, 0)); assert(!source.value && form.querySelector('.control-value').textContent === 'Vyber možnost', 'Reset selectu');
  controller.destroy(); select.destroy(); assert(!source.hidden && !form.querySelector('.control'), 'Select cleanup');
});
await test('Vlastní kalendář respektuje min/max a step, čas a datetime ukládají standardní hodnoty', async () => {
  const form = document.createElement('form'); form.innerHTML = '<label for="custom-date">Datum</label><input id="custom-date" name="date" type="date" value="2026-10-23" min="2026-10-20" max="2026-10-28"><label for="custom-time">Čas</label><input id="custom-time" name="time" type="time" step="900"><label for="custom-datetime">Termín</label><input id="custom-datetime" name="meeting" type="datetime-local" value="2026-10-23T10:00">';
  fixture.append(form); const [date, time, meeting] = form.querySelectorAll('input');
  const calendar = createPicker(date); const clock = createPicker(time); const datetime = createPicker(meeting);
  calendar.open(); let panel = date.parentElement.querySelector('.control-panel');
  assert(panel.querySelector('[data-date="2026-10-19"]').disabled, 'Datum před min jde vybrat.');
  const focused = panel.querySelector('[data-date="2026-10-23"]'); focused.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
  assert(document.activeElement.dataset.date === '2026-10-24', 'Šipka kalendáře');
  document.activeElement.click(); assert(date.value === '2026-10-24' && new FormData(form).get('date') === date.value, 'Datum není synchronní.');
  clock.open(); panel = time.parentElement.querySelector('.control-panel');
  panel.querySelector('[data-time-part="hour"][data-time-value="10"]').click();
  assert(!panel.querySelector('[data-time-part="minute"][data-time-value="07"]'), 'Step nabízí chybný čas.');
  panel.querySelector('[data-time-part="minute"][data-time-value="15"]').click();
  [...panel.querySelectorAll('button')].find(button => button.textContent === 'Použít').click(); assert(time.value === '10:15', 'Čas není synchronní.');
  datetime.open(); panel = meeting.parentElement.querySelector('.control-panel'); panel.querySelector('[data-date="2026-10-25"]').click();
  [...panel.querySelectorAll('button')].find(button => button.textContent === 'Použít').click(); assert(meeting.value === '2026-10-25T10:00', 'Datetime hodnota');
  form.reset(); await new Promise(resolve => setTimeout(resolve, 0)); assert(date.value === '2026-10-23', 'Reset data');
  calendar.destroy(); clock.destroy(); datetime.destroy(); assert([...form.querySelectorAll('input')].every(input => !input.hidden), 'Picker cleanup');
});
await test('Datum a čas lze psát ručně, chybný text blokuje submit a picker ho opraví', async () => {
  const form = document.createElement('form'); form.innerHTML = '<div data-field><label for="typed-date">Datum</label><input id="typed-date" name="date" type="date" required><p data-field-error hidden></p></div><label for="typed-time">Čas</label><input id="typed-time" name="time" type="time" step="900">'; fixture.append(form);
  const [date, time] = form.querySelectorAll('input'); const calendar = createPicker(date); const clock = createPicker(time); const validation = createForm(form);
  const entry = date.parentElement.querySelector('.control-entry'); const timeEntry = time.parentElement.querySelector('.control-entry');
  entry.focus(); entry.value = '23.10.2026'; entry.dispatchEvent(new Event('input', { bubbles: true }));
  assert(date.value === '2026-10-23' && new FormData(form).get('date') === date.value, 'Ruční datum není synchronní.');
  entry.value = '31.02.2026'; entry.dispatchEvent(new Event('input', { bubbles: true }));
  assert(date.value === '' && !validation.validate() && document.activeElement === entry, 'Chybný datum neblokuje submit.');
  entry.value = '2026-10-23'; entry.dispatchEvent(new Event('input', { bubbles: true }));
  timeEntry.focus(); timeEntry.value = '10:07'; timeEntry.dispatchEvent(new Event('input', { bubbles: true })); assert(!validation.validate({ focus: false }), 'Ruční čas ignoruje step.');
  timeEntry.value = '10:15'; timeEntry.dispatchEvent(new Event('input', { bubbles: true })); assert(validation.validate({ focus: false }), 'Platný ruční čas neprošel.');
  form.reset(); await new Promise(resolve => setTimeout(resolve, 0)); assert(entry.value === '' && timeEntry.value === '', 'Reset ručního zápisu');
  validation.destroy(); calendar.destroy(); clock.destroy();
});
await test('Volitelný editor zachová nadpisy, obrázky, jejich úpravy a modaly ve fullscreenu', async () => {
  const source = document.createElement('textarea'); fixture.append(source);
  let imageUploads = 0;
  const editor = createEditor(source, { features: { headings: true, images: true }, uploadImage: async () => { imageUploads++; return '/examples/editor-image.svg'; } });
  await editor.ready;
  editor.setJSON({ version: 1, blocks: [{ type: 'paragraph', children: [{ text: 'Nadpis' }] }] }); editor.command('heading', 2);
  await editor.ready;
  assert(fixture.querySelector('.editor-content h2')?.textContent === 'Nadpis', 'Nadpis se nevykreslil.');
  fixture.querySelector('[data-editor-command="image"]').click(); await waitFor('[data-editor-dialog="image"][open]');
  let modal = document.querySelector('[data-editor-dialog="image"]'); assert(modal.matches(':modal'), 'Obrázek není v Pure modalu.');
  assert(!modal.querySelector('[name="src"]') && modal.querySelector('input[type="file"]'), 'Modal nemá být URL formulář.');
  const transfer = new DataTransfer(); transfer.items.add(new File(['test'], 'image.png', { type: 'image/png' }));
  const fileInput = modal.querySelector('[name="file"]'); fileInput.files = transfer.files; fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  assert(modal.querySelector('.upload-list img'), 'Chybí náhled vybraného souboru.');
  modal.querySelector('[name="alt"]').value = 'Krajina'; modal.querySelector('[name="width"]').value = '50'; modal.querySelector('[name="align"]').value = 'right';
  modal.querySelector('[type="submit"]').click(); await new Promise(resolve => setTimeout(resolve, 0));
  assert(editor.getJSON().blocks[1].type === 'image' && editor.getJSON().blocks[1].width === 50, 'Obrázek není v JSON.');
  fixture.querySelector('[data-image-action="edit"]').click(); await waitFor('[data-editor-dialog="image"][open]');
  modal.querySelector('[name="caption"]').value = 'Popisek'; modal.querySelector('[name="width"]').value = '75'; modal.querySelector('[type="submit"]').click(); await new Promise(resolve => setTimeout(resolve, 0));
  assert(fixture.querySelector('figcaption').textContent === 'Popisek' && editor.getJSON().blocks[1].width === 75, 'Úprava obrázku');
  assert(imageUploads === 1, 'Úprava vlastností znovu nahrála obrázek.');
  editor.command('undo'); assert(editor.getJSON().blocks[1].width === 50, 'Undo obrázku'); editor.command('redo');
  await editor.command('fullscreen'); const fullscreen = document.querySelector('.editor-fullscreen'); assert(fullscreen.matches(':modal') && fullscreen.querySelector('.editor'), 'Fullscreen');
  fullscreen.querySelector('[data-editor-command="link"]').click(); await waitFor('[data-editor-dialog="link"][open]'); const link = document.querySelector('[data-editor-dialog="link"]'); assert(link.matches(':modal') && fullscreen.open, 'Odkaz nad fullscreenem');
  link.querySelector('[data-modal-close="cancel"]').click(); await new Promise(resolve => setTimeout(resolve, 0)); assert(fullscreen.open, 'Zavření modalu ukončilo fullscreen.');
  await editor.command('fullscreen'); await new Promise(resolve => setTimeout(resolve, 0)); assert(fixture.querySelector('.editor') && !fullscreen.open, 'Návrat z fullscreenu');
  fixture.querySelector('[data-editor-image] [data-block-delete]').click(); assert(!editor.getJSON().blocks.some(block => block.type === 'image'), 'Odebrání obrázku'); editor.command('undo'); assert(editor.getJSON().blocks.some(block => block.type === 'image'), 'Undo odebrání');
  editor.destroy(); assert(!document.querySelector('.editor-dialog') && !document.querySelector('.editor-fullscreen') && !source.hidden, 'Cleanup rozšířeného editoru');
});
await test('Zrušený upload obrázku nevloží pozdní výsledek do editoru', async () => {
  const source = document.createElement('textarea'); fixture.append(source); let finish;
  const editor = createEditor(source, { features: { images: true, fullscreen: false }, uploadImage: () => new Promise(resolve => { finish = resolve; }) });
  await editor.ready;
  fixture.querySelector('[data-editor-command="image"]').click(); await waitFor('[data-editor-dialog="image"][open]'); const modal = document.querySelector('[data-editor-dialog="image"]');
  const transfer = new DataTransfer(); transfer.items.add(new File(['test'], 'test.png', { type: 'image/png' })); modal.querySelector('[name="file"]').files = transfer.files;
  modal.querySelector('[type="submit"]').click(); assert(finish, 'Upload callback nezačal.'); modal.querySelector('[data-modal-close="cancel"]').click(); await new Promise(resolve => setTimeout(resolve, 0));
  finish('/examples/editor-image.svg'); await new Promise(resolve => setTimeout(resolve, 0)); assert(!editor.getJSON().blocks.some(block => block.type === 'image'), 'Pozdní upload změnil dokument.'); editor.destroy();
});
await test('Samostatný resize: kroky, tažení, zrušení, klávesnice a cleanup', async () => {
  const box = document.createElement('div'); box.style.width = '400px'; fixture.append(box);
  const target = document.createElement('figure'); target.style.width = '33%'; box.append(target);
  const changes = []; const commits = [];
  const resize = createResize(target, { width: 50, min: 25, step: 5, onChange: value => changes.push(value), onCommit: value => commits.push(value) });
  const handle = target.querySelector('[role="slider"]');
  assert(resize.getWidth() === 50 && !commits.length, 'Inicializace');
  resize.smaller(); resize.larger(); resize.setWidth(500);
  assert(resize.getWidth() === 100 && commits.length === 3, 'API nebo meze');
  handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert(resize.getWidth() === 25 && handle.getAttribute('aria-valuenow') === '25', 'Klávesnice a ARIA');
  const pointer = (type, x, element = window) => element.dispatchEvent(new PointerEvent(type, { pointerId: 7, isPrimary: true, button: 0, clientX: x, bubbles: true, cancelable: true }));
  const count = commits.length;
  pointer('pointerdown', 0, handle); pointer('pointermove', 100); pointer('pointermove', 200);
  assert(resize.getWidth() === 75 && commits.length === count, 'Náhled nesmí ukládat');
  pointer('pointerup', 200); assert(commits.length === count + 1 && commits.at(-1) === 75, 'Tažení musí uložit jedinou změnu');
  pointer('pointerdown', 0, handle); pointer('pointermove', -100);
  handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  pointer('pointerup', -100); assert(resize.getWidth() === 75 && commits.length === count + 1 && changes.at(-1) === 75, 'Escape musí vrátit náhled');
  resize.destroy(); resize.destroy(); pointer('pointermove', 300);
  assert(target.style.width === '33%' && !target.querySelector('[role="slider"]') && !target.classList.contains('resizable'), 'Cleanup');
});
await test('Akce a resize editoru ukládají JSON a jednu položku undo', async () => {
  const source = document.createElement('textarea'); fixture.append(source);
  const editor = createEditor(source, { features: { images: true } });
  await editor.ready;
  editor.setJSON({ version: 1, blocks: [{ type: 'image', src: '/examples/editor-image.svg', alt: 'Test', width: 100, align: 'center' }] });
  await editor.ready;
  fixture.querySelector('[data-image-action="smaller"]').click();
  assert(editor.getJSON().blocks[0].width === 75 && !document.querySelector('[data-editor-dialog="image"]')?.open, 'Přímá akce otevřela modal');
  fixture.querySelector('[data-image-action="left"]').click(); assert(editor.getJSON().blocks[0].align === 'left', 'Zarovnání');
  editor.command('undo'); assert(editor.getJSON().blocks[0].align === 'center', 'Undo zarovnání');
  let handle = fixture.querySelector('[data-resize-handle]'); handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  assert(editor.getJSON().blocks[0].width === 50 && document.activeElement.matches('[data-resize-handle]'), 'Resize a focus po renderu');
  editor.command('undo'); assert(editor.getJSON().blocks[0].width === 75, 'Undo resize');
  const content = fixture.querySelector('.editor-content'); const style = getComputedStyle(content);
  const width = content.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  handle = fixture.querySelector('[data-resize-handle]');
  handle.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 8, isPrimary: true, button: 0, clientX: 0, bubbles: true }));
  window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 8, clientX: -width / 2 }));
  assert(editor.getJSON().blocks[0].width === 75, 'Tažení předčasně změnilo JSON');
  window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 8 }));
  assert(editor.getJSON().blocks[0].width === 25, 'Tažení nezměnilo JSON');
  editor.command('undo'); assert(editor.getJSON().blocks[0].width === 75, 'Tažení vytvořilo více položek historie');
  editor.destroy();
});

await test('Loader drží souběžné činnosti, uklidí chybu i pozdní dokončení', async () => {
  const activity = createActivity({ target: fixture, global: true });
  const element = fixture.querySelector('.activity'); assert(element.hidden && element.classList.contains('activity-global'), 'Počáteční stav');
  const first = activity.start('První'); const second = activity.start('Druhá');
  assert(!element.hidden && element.textContent === 'Druhá' && activity.isActive(), 'Začátek');
  second(); second(); assert(element.textContent === 'První' && activity.isActive(), 'Souběh a idempotence');
  let caught = false; try { await activity.run(() => { throw new Error('test'); }); } catch { caught = true; }
  assert(caught && activity.isActive() && element.textContent === 'První', 'Chyba nesmí ukončit jinou činnost');
  first(); assert(element.hidden && !activity.isActive(), 'Ukončení');
  assert(await activity.run(async () => 42) === 42 && !activity.isActive(), 'Výsledek run');
  let resolve; const pending = activity.run(() => new Promise(done => { resolve = done; }));
  activity.destroy(); activity.destroy(); resolve('done'); await pending; first();
  assert(!fixture.querySelector('.activity') && !activity.isActive(), 'Cleanup při aktivní úloze');
});
await test('Progress synchronizuje hodnoty, neurčitý průběh, stav a cleanup', async () => {
  const sentinel = document.createElement('span'); sentinel.textContent = 'Obsah'; fixture.append(sentinel);
  const progress = createProgress(fixture, { max: 200, value: 50, label: 'Nahrávání' });
  const track = fixture.querySelector('[role="progressbar"]'); const root = fixture.querySelector('.progress');
  assert(track.getAttribute('aria-valuenow') === '50' && track.getAttribute('aria-valuemax') === '200' && root.textContent.includes('25 %'), 'Hodnoty');
  progress.set(null); assert(!track.hasAttribute('aria-valuenow') && root.dataset.indeterminate === 'true', 'Neurčitý průběh');
  progress.set(999); assert(progress.getValue() === 200 && root.textContent.includes('100 %'), 'Meze');
  progress.setState('error'); assert(root.dataset.state === 'error' && track.getAttribute('aria-label') === 'Chyba', 'Stav bez barvy');
  progress.setState('success', 'Uloženo'); assert(root.querySelector('[role="status"]').textContent === 'Uloženo', 'Oznámení');
  let invalid = false; try { progress.set(NaN); } catch { invalid = true; } assert(invalid && progress.getValue() === 200, 'Neplatná hodnota');
  progress.setState(null); assert(!root.hasAttribute('data-state') && track.getAttribute('aria-label') === 'Nahrávání', 'Reset stavu');
  progress.destroy(); progress.destroy(); assert(fixture.contains(sentinel) && !fixture.querySelector('.progress'), 'Původní obsah a cleanup');
  createProgress(fixture).destroy();
});

await test('Search ignoruje staré odpovědi, zachová focus a potvrdí návrh do FormData', async () => {
  const form = document.createElement('form'); form.innerHTML = '<label for="test-search">Najít</label><input id="test-search" name="q" type="search" class="input">'; fixture.append(form);
  const input = form.querySelector('input'); const pending = []; let chosen;
  const search = createSearch(input, { fetch: (query, { signal }) => new Promise(resolve => pending.push({ query, signal, resolve })), onSelect: item => { chosen = item; } });
  input.focus(); input.value = 'old'; const old = search.refresh(); input.value = 'new'; const latest = search.refresh();
  assert(pending[0].signal.aborted, 'Starý požadavek není zrušen');
  pending[1].resolve([{ label: '<b>Nový</b>', value: 'new-id', id: '2' }, { label: 'Druhý', value: 'second' }]); await latest;
  pending[0].resolve([{ label: 'Starý', value: 'old' }]); await old;
  const panel = fixture.querySelector('[role="listbox"]');
  assert(panel.matches(':popover-open') && panel.children.length === 2 && !panel.querySelector('b') && panel.textContent.includes('<b>'), 'Pozdní odpověď nebo HTML');
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert(document.activeElement === input && input.getAttribute('aria-activedescendant') === panel.children[0].id, 'Focus nebo aktivní návrh');
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  assert(chosen.id === '2' && new FormData(form).get('q') === 'new-id' && input.getAttribute('aria-expanded') === 'false', 'Výběr a FormData');
  input.value = 'late'; const late = search.refresh(); search.close(); pending[2].resolve([{ label: 'Pozdě', value: 'late' }]); await late;
  assert(!panel.matches(':popover-open'), 'Zavřená nabídka se znovu otevřela');
  search.destroy(); assert(!fixture.querySelector('.search') && !input.hasAttribute('role') && form.contains(input), 'Cleanup');
});
await test('Search zpracuje debounce, krátký dotaz, chybu a skutečný AJAX', async () => {
  const input = document.createElement('input'); input.type = 'search'; input.className = 'input'; fixture.append(input); input.focus();
  let calls = 0;
  const search = createSearch(input, { delay: 10, fetch: async () => { calls++; throw new Error('offline'); } });
  input.value = 'n'; input.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(resolve => setTimeout(resolve, 20)); assert(calls === 0, 'Krátký dotaz');
  for (const value of ['ni', 'nik', 'niko']) { input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); }
  await new Promise(resolve => setTimeout(resolve, 30));
  assert(calls === 1 && fixture.querySelector('[role="status"]').textContent.includes('nezdařilo') && !input.hasAttribute('aria-busy'), 'Debounce nebo chyba');
  search.destroy();
  const ajax = createSearch(input, { url: '/examples/search-items.json' }); await ajax.refresh();
  assert(fixture.querySelectorAll('[role="option"]').length === 5, 'Skutečný request');
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); assert(input.getAttribute('aria-expanded') === 'false', 'Escape');
  fixture.querySelector('[aria-label="Vymazat hledání"]').click(); assert(input.value === '' && document.activeElement === input, 'Vymazání a focus'); ajax.destroy();
});
await test('Editor má bloky a obrázek sdružuje úchyt i skupiny akcí', async () => {
  const source = document.createElement('textarea'); fixture.append(source);
  const editor = createEditor(source, { features: { images: true } });
  await editor.ready;
  editor.setJSON({ version: 1, blocks: [{ type: 'paragraph', children: [{ text: 'Text' }] }, { type: 'image', src: '/examples/editor-image.svg', alt: 'Test', width: 50, align: 'center' }] });
  await editor.ready;
  assert(fixture.querySelectorAll('[data-editor-block]').length === 2, 'Blokové UI');
  const figure = fixture.querySelector('.editor-image');
  assert(figure.querySelector('.editor-block-header').textContent.includes('50 %') && figure.querySelector('.editor-image-media [data-resize-handle]') && figure.querySelectorAll('.editor-image-action-group').length === 3, 'Struktura obrázku');
  figure.querySelector('img').click(); assert(!document.querySelector('[data-editor-dialog="image"]')?.open && document.activeElement === figure, 'Kliknutí nesmí otevřít modal');
  figure.querySelector('[data-image-action="edit"]').click(); await waitFor('[data-editor-dialog="image"][open]'); assert(document.querySelector('[data-editor-dialog="image"]')?.open, 'Explicitní úprava'); editor.destroy();
});

await test('Globální drag & drop řadí pointerem i klávesnicí a ruší nedokončené gesto', async () => {
  const list = document.createElement('div'); list.style.width = '400px'; fixture.append(list);
  for (const text of ['A', 'B', 'C']) {
    const item = document.createElement('div'); item.dataset.dragItem = ''; item.style.height = '60px';
    const handle = document.createElement('button'); handle.type = 'button'; handle.dataset.dragHandle = ''; handle.textContent = text; item.append(handle); list.append(item);
  }
  let count = 0; const drag = createDragDrop(list, { onMove: () => count++ });
  const key = (handle, value) => handle.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));
  let handle = list.firstChild.firstChild; key(handle, ' '); key(handle, 'End');
  assert(list.textContent === 'ABC' && list.hasAttribute('data-drop-end'), 'Náhled nemá měnit DOM'); key(handle, 'Enter');
  assert(list.textContent === 'BCA' && count === 1 && document.activeElement === handle, 'Klávesnice nebo focus');
  key(handle, ' '); key(handle, 'Home'); key(handle, 'Escape'); assert(list.textContent === 'BCA' && count === 1 && !list.querySelector('[data-dragging]'), 'Escape');
  const rect = list.getBoundingClientRect(); handle = list.firstChild.firstChild;
  const pointer = (type, y, target = window) => target.dispatchEvent(new PointerEvent(type, { pointerId: 12, isPrimary: true, button: 0, clientX: rect.left + 10, clientY: y, bubbles: true, cancelable: true }));
  pointer('pointerdown', rect.top + 10, handle); pointer('pointermove', rect.bottom - 1);
  assert(list.textContent === 'BCA' && list.hasAttribute('data-drop-end'), 'Pointer náhled'); pointer('pointerup', rect.bottom - 1);
  assert(list.textContent === 'CAB' && count === 2, 'Pointer přesun');
  pointer('pointerdown', rect.top + 10, list.firstChild.firstChild); pointer('pointermove', rect.bottom - 1); pointer('pointercancel', rect.bottom - 1);
  assert(list.textContent === 'CAB' && count === 2 && !list.hasAttribute('data-drop-end'), 'Pointercancel');
  drag.move(2, 0); assert(list.textContent === 'BCA' && count === 3, 'Programové move');
  drag.destroy(); drag.destroy(); key(list.firstChild.firstChild, ' '); assert(!list.querySelector('[data-dragging]'), 'Cleanup');
});
await test('Přesun a smazání bloků editoru zachová model, historii a čistý text', async () => {
  const source = document.createElement('textarea'); fixture.append(source); const editor = createEditor(source, { features: { images: true, headings: true } });
  await editor.ready;
  editor.setJSON({ version: 1, blocks: [{ type: 'heading', level: 2, children: [{ text: 'Nadpis', bold: true }] }, { type: 'image', src: '/examples/editor-image.svg', alt: 'Krajina', width: 50, align: 'center' }, { type: 'paragraph', children: [{ text: 'Konec' }] }] });
  await editor.ready;
  const handle = fixture.querySelector('[data-drag-handle]');
  for (const key of [' ', 'End', 'Enter']) handle.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  assert(editor.getJSON().blocks[2].type === 'heading' && editor.getJSON().blocks[2].children[0].bold && editor.getJSON().blocks[0].width === 50, 'Přesun změnil obsah');
  editor.command('undo'); assert(editor.getJSON().blocks[0].type === 'heading', 'Jediné undo přesunu'); editor.command('redo');
  fixture.querySelector('[data-block-delete="2"]').click(); assert(editor.getJSON().blocks.length === 2 && !editor.getText().includes('Smazat'), 'Mazání nebo UI v textu');
  editor.command('undo'); assert(editor.getJSON().blocks[2].type === 'heading', 'Undo mazání');
  // Nativní cesta (např. IME) nesmí načíst řídicí texty do modelu.
  const content = fixture.querySelector('.editor-content'); content.dispatchEvent(new Event('input', { bubbles: true }));
  assert(editor.getJSON().blocks[2].type === 'heading' && !JSON.stringify(editor.getJSON()).includes('Smazat'), 'Čtení DOM poškodilo bloky');
  const range = document.createRange(); range.selectNodeContents(content); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
  const clipboard = new DataTransfer(); content.dispatchEvent(new ClipboardEvent('copy', { clipboardData: clipboard, bubbles: true, cancelable: true }));
  assert(clipboard.getData('text/plain') === 'Krajina\nKonec\nNadpis', 'Kopírování obsahuje řídicí text');
  content.dispatchEvent(new ClipboardEvent('cut', { clipboardData: new DataTransfer(), bubbles: true, cancelable: true }));
  assert(editor.getText() === '', 'Vyjmutí bloků'); editor.command('undo'); assert(editor.getJSON().blocks.length === 3, 'Undo vyjmutí');
  while (editor.getJSON().blocks.length > 1) editor.command('removeBlock', 0);
  editor.command('removeBlock', 0); assert(editor.getJSON().blocks.length === 1 && editor.getText() === '', 'Poslední blok');
  editor.destroy(); assert(!fixture.querySelector('[data-drag-handle]'), 'Cleanup editoru');
});

await test('Patička editoru sleduje JSON, historii a jazyk dokumentu s vlastními překlady', async () => {
  const source = document.createElement('textarea'); fixture.append(source); const previous = document.documentElement.lang;
  document.documentElement.lang = 'en-GB';
  let editor; try { editor = createEditor(source, { features: { images: true, headings: true }, messages: { words: 'Word count: {count}' } }); } finally { document.documentElement.lang = previous; }
  await editor.ready;
  assert(fixture.querySelector('[data-drag-handle]').textContent === 'Paragraph' && fixture.querySelector('[data-editor-command="bold"]').getAttribute('aria-label').startsWith('Bold'), 'Jazyk dokumentu');
  editor.setJSON({ version: 1, blocks: [{ type: 'heading', level: 2, children: [{ text: 'Hello world' }] }, { type: 'image', src: '/examples/editor-image.svg', alt: 'Words not counted', mediaId: 'asset' }] });
  await editor.ready;
  assert(JSON.stringify(editor.getStats()) === JSON.stringify({ blocks: 2, words: 2, images: 1 }) && fixture.querySelector('[data-editor-count="words"]').textContent === 'Word count: 2', 'Statistiky');
  editor.command('removeBlock', 1); assert(editor.getStats().images === 0 && fixture.querySelector('[data-editor-count="images"]').textContent === 'Images: 0', 'Mazání');
  editor.command('undo'); assert(editor.getStats().images === 1, 'Undo statistiky');
  fixture.querySelector('[data-image-action="edit"]').click(); await waitFor('[data-editor-dialog="image"][open]'); const modal = document.querySelector('[data-editor-dialog="image"]');
  assert(modal.textContent.includes('Alternative text') && modal.textContent.includes('Cancel') && !modal.textContent.includes('Vyber nebo'), 'Překlady modalu');
  editor.destroy();
  const cs = createEditor(source, { locale: 'cs-CZ' }); assert(fixture.querySelector('[data-drag-handle]').textContent === 'Nadpis 2', 'Explicitní jazyk'); cs.destroy();
});
await test('Knihovna v editoru vloží mediaId až po potvrzení a zachová ho při editaci i undo', async () => {
  const tick = () => new Promise(resolve => setTimeout(resolve, 0));
  const source = document.createElement('textarea'); fixture.append(source);
  const editor = createEditor(source, { features: { images: true }, mediaLibrary: { load: async () => [{ id: 42, src: '/examples/editor-image.svg', alt: 'Krajina', name: '<b>Media</b>' }] } });
  await editor.ready;
  fixture.querySelector('[data-editor-command="image"]').click(); await waitFor('[data-editor-dialog="image"][open]'); const modal = document.querySelector('[data-editor-dialog="image"]');
  modal.querySelector('[data-editor-media-library]').click(); await waitFor('[data-media-library][open] [data-media-id]'); const library = document.querySelector('[data-media-library]');
  assert(library.matches(':modal') && library.querySelector('[data-media-id="42"]') && !library.querySelector('b'), 'Načtení médií nebo HTML');
  library.querySelector('[data-media-id="42"]').click(); await tick();
  assert(!library.open && modal.open && editor.getStats().images === 0 && modal.querySelector('[name="alt"]').value === 'Krajina', 'Výběr předčasně změnil dokument');
  modal.querySelector('[type="submit"]').click(); await tick();
  assert(editor.getJSON().blocks[1].mediaId === 42 && editor.getStats().images === 1, 'Vložení mediaId');
  fixture.querySelector('[data-image-action="edit"]').click(); await waitFor('[data-editor-dialog="image"][open]'); modal.querySelector('[name="caption"]').value = 'Popisek'; modal.querySelector('[type="submit"]').click(); await tick();
  assert(editor.getJSON().blocks[1].mediaId === 42, 'Úprava ztratila ID'); editor.command('undo'); editor.command('redo'); assert(editor.getJSON().blocks[1].mediaId === 42, 'Historie mediaId');
  editor.destroy(); assert(!document.querySelector('[data-media-library]'), 'Cleanup knihovny');
});
await test('Vlastní přímý upload vrátí ID bez závislosti na knihovně', async () => {
  const source = document.createElement('textarea'); fixture.append(source); let received;
  const editor = createEditor(source, { features: { images: true }, uploadImage: async (file, { signal }) => { received = { file, signal }; return { id: 'my-upload', src: '/examples/editor-image.svg' }; } });
  await editor.ready;
  fixture.querySelector('[data-editor-command="image"]').click(); await waitFor('[data-editor-dialog="image"][open]'); const modal = document.querySelector('[data-editor-dialog="image"]');
  const transfer = new DataTransfer(); transfer.items.add(new File(['test'], 'image.png', { type: 'image/png' })); modal.querySelector('[name="file"]').files = transfer.files;
  modal.querySelector('[type="submit"]').click(); await new Promise(resolve => setTimeout(resolve, 0));
  assert(received.file.name === 'image.png' && received.signal instanceof AbortSignal && editor.getJSON().blocks[1].mediaId === 'my-upload' && !document.querySelector('[data-media-library]'), 'Upload adaptér'); editor.destroy();
});
await test('Samostatná knihovna ignoruje staré načtení i upload po zavření', async () => {
  const pending = []; let uploads; let selected = 0;
  const library = createMediaLibrary({ styles: false, locale: 'en', load: options => new Promise(resolve => pending.push({ ...options, resolve })), upload: () => new Promise(resolve => { uploads = resolve; }), onSelect: () => { selected++; } });
  const first = library.open(); const latest = library.refresh(); assert(pending[0].signal.aborted, 'Abort starého načtení');
  pending[1].resolve({ items: [{ id: 'new', src: '/examples/editor-image.svg', name: 'New' }], hasMore: true }); await latest;
  pending[0].resolve([{ id: 'old', src: '/examples/editor-image.svg' }]); await first;
  assert(library.dialog.querySelector('[data-media-id="new"]') && !library.dialog.querySelector('[data-media-id="old"]'), 'Staré médium přepsalo nové');
  const buttons = [...library.dialog.querySelectorAll('.media-legacy-pagination button')]; assert(buttons[0].disabled && !buttons[1].disabled, 'Stránkování');
  buttons[1].click(); assert(pending[2].page === 2, 'Index stránky'); pending[2].resolve({ items: [], hasMore: false }); await new Promise(resolve => setTimeout(resolve, 0));
  assert(library.dialog.textContent.includes('No media found.') && buttons[1].disabled, 'Prázdná stránka');
  const input = library.dialog.querySelector('[type="file"]'); const transfer = new DataTransfer(); transfer.items.add(new File(['x'], 'image.png', { type: 'image/png' })); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }));
  library.close(); uploads({ id: 'late', src: '/examples/editor-image.svg' }); await new Promise(resolve => setTimeout(resolve, 0));
  assert(selected === 0 && !library.dialog.open, 'Pozdní upload vybral médium'); library.destroy(); library.destroy();
});

await test('Zrušený reset zachová soubory a chyby formuláře', async () => {
  const form = document.createElement('form'); form.innerHTML = '<div data-field><input type="email" required><p data-field-error hidden></p></div><div data-upload><input type="file"><p data-upload-status></p><ul data-upload-list></ul></div>'; fixture.append(form);
  const validation = createForm(form); const upload = createUpload(form.querySelector('[type="file"]'));
  validation.validate({ focus: false }); upload.setFiles([new File(['x'], 'a.txt')]);
  const stop = event => event.preventDefault(); form.addEventListener('reset', stop); form.reset();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert(form.querySelector('[type="email"]').getAttribute('aria-invalid') === 'true' && !form.querySelector('[data-field-error]').hidden, 'Zrušený reset skryl chyby');
  assert(upload.getFiles().length === 1 && form.querySelector('[type="file"]').files.length === 1 && form.querySelector('.upload-item'), 'Zrušený reset změnil upload');
  form.removeEventListener('reset', stop); form.reset(); await new Promise(resolve => setTimeout(resolve, 0));
  assert(!upload.getFiles().length && form.querySelector('[data-field-error]').hidden, 'Platný reset'); validation.destroy(); upload.destroy();
});
await test('Resize připojuje globální pointer listenery pouze po dobu gesta', async () => {
  const add = window.addEventListener; const remove = window.removeEventListener; const tracked = new Set(['pointermove', 'pointerup', 'pointercancel', 'blur']); let active = 0; let resize;
  window.addEventListener = function (type, ...args) { if (tracked.has(type)) active++; return add.call(this, type, ...args); };
  window.removeEventListener = function (type, ...args) { if (tracked.has(type)) active--; return remove.call(this, type, ...args); };
  try {
    const container = document.createElement('div'); container.style.width = '400px'; const box = document.createElement('div'); container.append(box); fixture.append(container);
    resize = createResize(box); assert(active === 0, 'Neaktivní resize má globální listenery');
    const start = () => box.querySelector('[data-resize-handle]').dispatchEvent(new PointerEvent('pointerdown', { pointerId: 92, isPrimary: true, button: 0, bubbles: true }));
    start(); assert(active === 4, 'Aktivní gesto'); window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 92 })); assert(active === 0, 'Cancel neodpojil listenery');
    start(); resize.destroy(); assert(active === 0, 'Destroy během gesta');
  } finally { resize?.destroy(); window.addEventListener = add; window.removeEventListener = remove; }
});

await test('Upload přebírá globální limit a dovolí lokální přepsání', async () => {
  const original = getPureConfig(); let upload;
  try {
    configurePure({ upload: { maxSize: 2 } });
    const region = document.createElement('div'); region.dataset.upload = '';
    const input = document.createElement('input'); input.type = 'file';
    const list = document.createElement('div'); list.dataset.uploadList = '';
    const status = document.createElement('p'); status.dataset.uploadStatus = '';
    region.append(input, list, status); fixture.append(region);
    const files = new DataTransfer(); files.items.add(new File(['large'], 'test.txt', { type: 'text/plain' }));
    upload = createUpload(input); input.files = files.files; input.dispatchEvent(new Event('change', { bubbles: true }));
    assert(input.files.length === 0 && status.textContent.includes('limit'), 'Globální limit odmítne velký soubor');
    upload.destroy(); upload = createUpload(input, { maxSize: 10 });
    input.files = files.files; input.dispatchEvent(new Event('change', { bubbles: true }));
    assert(input.files.length === 1, 'Lokální limit má přednost');
  } finally { upload?.destroy(); configurePure(original); }
});
await test('Globální konfigurace se projeví v UI; lokální volby a staré instance zůstávají nezávislé', async () => {
  const original = getPureConfig(); let editor; let select;
  try {
    configurePure({ locale: 'en', iconsUrl: '/dist/pure/icons.svg', editor: { features: { headings: true, fullscreen: false } }, messages: { selectPlaceholder: 'Pick one' } });
    const source = document.createElement('textarea'); fixture.append(source);
    editor = createEditor(source, { features: { headings: false } }); await editor.ready;
    assert(!fixture.querySelector('.editor-toolbar select'), 'Lokální headings:false má přednost');
    assert(!fixture.querySelector('[title="Celá obrazovka"]'), 'Globální fullscreen:false');
    assert(fixture.textContent.includes('Words: 0'), 'Globální anglický slovník');
    const field = document.createElement('select'); const option = document.createElement('option'); option.value = ''; field.append(option); fixture.append(field);
    select = createSelect(field);
    assert(fixture.textContent.includes('Pick one'), 'Vlastní globální text');
    assert(fixture.querySelector('use').getAttribute('href').startsWith(location.origin + '/dist/pure/icons.svg#'), 'Globální sprite');
    configurePure({ locale: 'cs', messages: { selectPlaceholder: 'Nový výběr' } });
    select.refresh();
    assert(fixture.textContent.includes('Pick one'), 'Existující select drží svůj text');
  } finally { editor?.destroy(); select?.destroy(); configurePure(original); }
});
document.querySelector('#summary').textContent = `${passed} prošlo, ${failed} selhalo.`;
document.documentElement.dataset.testResult = failed ? 'fail' : 'pass';
