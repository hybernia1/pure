import { createModal } from './modal.js';
import { iconButton, icon } from './controls.js';
import { normalizeMedia } from './media.js';
import { ensureStyles } from './styles.js';
import { validateFiles } from './file-validation.js';
import { editorI18n } from './editor-i18n.js';

export { normalizeMedia } from './media.js';

/** Připojitelný modal; API, autentizaci a ukládání vlastní aplikace. */
export function createMediaLibrary({ document: doc = document, load, upload, locale, messages, onSelect = () => {}, pageSize = 12, styles = true } = {}) {
  if (typeof load !== 'function' || !Number.isInteger(pageSize) || pageSize < 1) throw new TypeError('Media library requires load and a positive pageSize.');
  const { t } = editorI18n(doc, { locale, messages });
  const node = (tag, className, text) => { const element = doc.createElement(tag); if (className) element.className = className; if (text !== undefined) element.textContent = text; return element; };
  const dialog = node('dialog', 'modal media-library'); dialog.setAttribute('aria-label', t('library')); dialog.dataset.mediaLibrary = '';
  const header = node('div', 'modal-header'); const close = iconButton(doc, 'close', t('close')); close.dataset.modalClose = ''; header.append(node('h2', 'text-xl', t('library')), close);
  const body = node('div', 'modal-body'); const form = node('form', 'media-search');
  const control = node('div', 'control control-with-icon'); const search = node('input', 'input'); search.type = 'search'; search.setAttribute('aria-label', t('searchMedia'));
  const glyph = icon(doc, 'search'); glyph.classList.add('control-icon'); control.append(search, glyph);
  const submit = node('button', 'button button-outline', t('search')); submit.type = 'submit'; form.append(control, submit);
  const status = node('p', 'field-help'); status.setAttribute('role', 'status');
  const grid = node('div', 'media-grid'); const footer = node('div', 'modal-actions');
  const previous = node('button', 'button button-outline', t('previous')); previous.type = 'button';
  const next = node('button', 'button button-outline', t('next')); next.type = 'button'; const pageLabel = node('span', 'field-help');
  let file;
  if (upload) {
    const label = node('label', 'field-label', t('uploadImage')); file = node('input', 'input'); file.type = 'file'; file.accept = 'image/png,image/jpeg,image/webp,image/gif,image/avif'; label.append(file); body.append(label);
  }
  body.append(form, status, grid); footer.append(previous, pageLabel, next); dialog.append(header, body, footer); doc.body.append(dialog);
  const modal = createModal(dialog); let page = 1; let query = ''; let hasMore = false; let controller; let sequence = 0; let destroyed = false; let busy = false; let openSequence = 0;
  const listeners = []; const listen = (target, type, fn) => { target.addEventListener(type, fn); listeners.push(() => target.removeEventListener(type, fn)); };
  const setBusy = value => {
    busy = value; grid.setAttribute('aria-busy', String(value)); submit.disabled = value; if (file) file.disabled = value;
    previous.disabled = value || page <= 1; next.disabled = value || !hasMore;
    grid.querySelectorAll('button').forEach(button => { button.disabled = value; });
  };
  const abort = () => { sequence++; controller?.abort(); };
  const current = (id, signal) => !destroyed && dialog.open && sequence === id && !signal.aborted;
  const choose = async item => {
    if (busy || destroyed || !dialog.open) return;
    abort(); controller = new AbortController(); const id = sequence; const signal = controller.signal; setBusy(true);
    try { await onSelect({ ...item }, { signal }); if (current(id, signal)) modal.close('select'); }
    catch (error) { if (current(id, signal)) status.textContent = error.message || t('failure'); }
    finally { if (current(id, signal)) setBusy(false); }
  };
  const refresh = async () => {
    if (destroyed) throw new Error('Media library is destroyed.');
    if (!dialog.open) return;
    abort(); controller = new AbortController(); const signal = controller.signal; const id = sequence;
    status.textContent = t('loading'); grid.replaceChildren(); setBusy(true); pageLabel.textContent = t('page', { page });
    try {
      const result = await load({ query, page, pageSize, signal });
      if (!current(id, signal)) return;
      const raw = Array.isArray(result) ? result : result?.items;
      if (!Array.isArray(raw)) throw new TypeError(t('invalidMedia'));
      const items = raw.map(normalizeMedia); hasMore = !Array.isArray(result) && result.hasMore === true;
      for (const item of items) {
        const button = node('button', 'media-item'); button.type = 'button'; button.dataset.mediaId = item.id;
        const image = node('img'); image.src = item.src; image.alt = ''; image.loading = 'lazy';
        button.append(image, node('span', '', item.name)); button.addEventListener('click', () => choose(item)); grid.append(button);
      }
      status.textContent = items.length ? '' : t('noMedia');
    } catch { if (current(id, signal)) { hasMore = false; status.textContent = t('mediaError'); } }
    finally { if (current(id, signal)) setBusy(false); }
  };
  listen(form, 'submit', event => { event.preventDefault(); if (busy) return; query = search.value.trim(); page = 1; refresh(); });
  listen(previous, 'click', () => { if (!busy && page > 1) { page--; refresh(); } });
  listen(next, 'click', () => { if (!busy && hasMore) { page++; refresh(); } });
  if (file) listen(file, 'change', async () => {
    if (busy || !file.files[0]) return;
    const chosen = file.files[0]; const errors = validateFiles([chosen], { accept: file.accept, maxFiles: 1, maxSize: 10 * 1024 * 1024, translate: t });
    if (errors.length) { status.textContent = errors.join(' '); file.value = ''; return; }
    abort(); controller = new AbortController(); const signal = controller.signal; const id = sequence; setBusy(true); status.textContent = t('loading');
    try {
      const item = normalizeMedia(await upload(chosen, { signal }));
      if (current(id, signal)) { file.value = ''; setBusy(false); await choose(item); }
    } catch (error) { if (current(id, signal)) status.textContent = error.message || t('failure'); }
    finally { if (current(id, signal)) { file.value = ''; setBusy(false); } }
  });
  listen(dialog, 'cancel', abort);
  listen(dialog, 'click', event => { if (!dialog.open || event.target.closest('[data-modal-close]')) abort(); });
  listen(dialog, 'close', () => { if (!dialog.open) { abort(); grid.replaceChildren(); if (file) file.value = ''; setBusy(false); } });
  return {
    dialog, refresh,
    open(opener = doc.activeElement) {
      if (destroyed) throw new Error('Media library is destroyed.');
      const opening = ++openSequence;
      const show = () => {
        if (destroyed || opening !== openSequence) return;
        page = 1; query = ''; search.value = ''; hasMore = false; modal.open(opener); return refresh();
      };
      return styles ? ensureStyles('media-library', { document: doc }).then(show) : show();
    },
    close() { openSequence++; abort(); modal.close(); },
    destroy() { if (destroyed) return; openSequence++; abort(); destroyed = true; listeners.forEach(fn => fn()); modal.destroy(); dialog.remove(); },
  };
}
