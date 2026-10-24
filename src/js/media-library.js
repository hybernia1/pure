import { getPureConfig, componentOptions } from './config.js';
import { createModal } from './modal.js';
import { iconButton, icon } from './controls.js';
import { normalizeMedia } from './media.js';
import { ensureStyles } from './styles.js';
import { validateFiles } from './file-validation.js';
import { editorI18n } from './editor-i18n.js';
import { createPagination } from './pagination.js';

export { normalizeMedia } from './media.js';

/** Připojitelný modal; API, autentizaci a ukládání vlastní aplikace. */
export function createMediaLibrary(options = {}) {
  const { document: doc = document, load, upload, locale, messages, onSelect = () => {}, pageSize = 12, styles = getPureConfig().styles.auto, prepareFile = getPureConfig().upload.prepareFile } = componentOptions('mediaLibrary', options);
  if (typeof load !== 'function' || !Number.isInteger(pageSize) || pageSize < 1) throw new TypeError('Media library requires load and a positive pageSize.');
  if (prepareFile !== null && typeof prepareFile !== 'function') throw new TypeError('prepareFile must be a function or null.');
  const imageMaxSize = getPureConfig().upload.maxSize === Infinity ? 10 * 1024 * 1024 : getPureConfig().upload.maxSize;
  const { t } = editorI18n(doc, { locale, messages });
  const node = (tag, className, text) => { const element = doc.createElement(tag); if (className) element.className = className; if (text !== undefined) element.textContent = text; return element; };
  const dialog = node('dialog', 'modal media-library'); dialog.setAttribute('aria-label', t('library')); dialog.dataset.mediaLibrary = '';
  const header = node('div', 'modal-header'); const close = iconButton(doc, 'close', t('close')); close.dataset.modalClose = ''; header.append(node('h2', 'text-xl', t('library')), close);
  const body = node('div', 'modal-body'); const form = node('form', 'media-search');
  const control = node('div', 'control control-with-icon'); const search = node('input', 'input'); search.type = 'search'; search.setAttribute('aria-label', t('searchMedia'));
  const glyph = icon(doc, 'search'); glyph.classList.add('control-icon'); control.append(search, glyph);
  const submit = node('button', 'button button-outline', t('search')); submit.type = 'submit'; form.append(control, submit);
  const status = node('p', 'field-help'); status.setAttribute('role', 'status');
  const retry = node('button', 'button button-outline', t('mediaRetry')); retry.type = 'button'; retry.hidden = true;
  const grid = node('div', 'media-grid'); grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', t('library'));
  const footer = node('div', 'media-footer'); const pagerHost = node('div');
  const legacy = node('div', 'media-legacy-pagination'); legacy.hidden = true;
  const previous = node('button', 'button button-outline', t('previous')); previous.type = 'button';
  const next = node('button', 'button button-outline', t('next')); next.type = 'button'; const pageLabel = node('span', 'field-help');
  let file;
  if (upload) {
    const label = node('label', 'field-label media-upload', t('uploadImage')); file = node('input', 'input'); file.type = 'file'; file.accept = 'image/png,image/jpeg,image/webp,image/gif,image/avif'; label.append(file); body.append(label);
  }
  body.prepend(form); body.append(status, retry, grid); legacy.append(previous, pageLabel, next); footer.append(pagerHost, legacy); dialog.append(header, body, footer); doc.body.append(dialog);
  const modal = createModal(dialog); let page = 1; let query = ''; let hasMore = false; let controller; let sequence = 0; let destroyed = false; let busy = false; let openSequence = 0;
  const pager = createPagination(pagerHost, { locale, messages, onChange(next) { if (!busy) { page = next; refresh(); } } });
  let lastPagination = { page: 1, pages: 1, total: 0 };
  const listeners = []; const listen = (target, type, fn) => { target.addEventListener(type, fn); listeners.push(() => target.removeEventListener(type, fn)); };
  const setBusy = value => {
    busy = value; grid.setAttribute('aria-busy', String(value)); submit.disabled = value; if (file) file.disabled = value;
    previous.disabled = value || page <= 1; next.disabled = value || !hasMore;
    grid.querySelectorAll('button').forEach(button => { button.disabled = value; });
    pager.update(lastPagination);
    if (value) pagerHost.querySelectorAll('button').forEach(button => { button.disabled = true; });
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
    status.textContent = t('loading'); retry.hidden = true; setBusy(true); pageLabel.textContent = t('page', { page });
    try {
      let result; let raw; let total; let known;
      for (let attempt = 0; attempt < 2; attempt++) {
        result = await load({ query, page, pageSize, signal });
        if (!current(id, signal)) return;
        raw = Array.isArray(result) ? result : result?.items;
        if (!Array.isArray(raw)) throw new TypeError(t('invalidMedia'));
        known = Array.isArray(result) || result.total !== undefined;
        total = Array.isArray(result) ? raw.length : result.total;
        if (known && (!Number.isSafeInteger(total) || total < 0 || (!Array.isArray(result) && (raw.length > pageSize || raw.length > total)))) throw new TypeError(t('invalidMedia'));
        const pages = known ? Math.max(1, Math.ceil(total / pageSize)) : page;
        if (known && page > pages) { if (attempt) throw new Error(t('mediaError')); page = pages; continue; }
        break;
      }
      const items = (Array.isArray(result) ? raw.slice((page - 1) * pageSize, page * pageSize) : raw).map(normalizeMedia);
      hasMore = !known && result.hasMore === true;
      legacy.hidden = known; pagerHost.hidden = !known;
      if (known) lastPagination = { page, pages: Math.max(1, Math.ceil(total / pageSize)), total };
      pageLabel.textContent = t('page', { page });
      const fragment = doc.createDocumentFragment();
      for (const item of items) {
        const button = node('button', 'media-item'); button.type = 'button'; button.dataset.mediaId = item.id;
        const image = node('img'); image.src = item.src; image.alt = ''; image.loading = 'lazy';
        const title = node('span', 'media-item-name', item.name); const idLabel = node('span', 'media-item-id', `ID: ${item.id}`);
        button.setAttribute('aria-label', t('mediaChoose', { name: item.name }));
        button.append(image, title, idLabel); button.addEventListener('click', () => choose(item)); fragment.append(button);
      }
      grid.replaceChildren(fragment); status.textContent = items.length ? known ? t('mediaCount', { count: total }) : '' : t('noMedia');
    } catch { if (current(id, signal)) { status.textContent = t('mediaError'); retry.hidden = false; } }
    finally { if (current(id, signal)) setBusy(false); }
  };
  listen(form, 'submit', event => { event.preventDefault(); if (busy) return; query = search.value.trim(); page = 1; refresh(); });
  listen(retry, 'click', () => { if (!busy) refresh(); });
  listen(previous, 'click', () => { if (!busy && page > 1) { page--; refresh(); } });
  listen(next, 'click', () => { if (!busy && hasMore) { page++; refresh(); } });
  if (file) listen(file, 'change', async () => {
    if (busy || !file.files[0]) return;
    const chosen = file.files[0];
    const errors = validateFiles([chosen], { accept: file.accept, maxFiles: 1, maxSize: prepareFile ? Infinity : imageMaxSize, translate: t });
    if (errors.length) { status.textContent = errors.join(' '); file.value = ''; return; }
    abort(); controller = new AbortController(); const signal = controller.signal; const id = sequence; setBusy(true); status.textContent = t('loading');
    try {
      const prepared = prepareFile ? await prepareFile(chosen, { signal }) : chosen;
      if (!current(id, signal)) return;
      if (!(prepared instanceof doc.defaultView.File)) throw new TypeError('prepareFile must return a File.');
      const errors = validateFiles([prepared], { accept: file.accept, maxFiles: 1, maxSize: imageMaxSize, translate: t });
      if (errors.length) throw new Error(errors.join(' '));
      const item = normalizeMedia(await upload(prepared, { signal }));
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
    destroy() { if (destroyed) return; openSequence++; abort(); destroyed = true; listeners.forEach(fn => fn()); pager.destroy(); modal.destroy(); dialog.remove(); },
  };
}
