import { editorI18n } from './editor-i18n.js';
import { componentOptions } from './config.js';
import { validateFiles } from './file-validation.js';
export { validateFiles } from './file-validation.js';

/** Pouze výběr souborů; přenos provádí aplikace přes FormData. */
export function createUpload(input, options = {}) {
  const {
    dropzone = input.closest('[data-upload]'),
    list = dropzone?.querySelector('[data-upload-list]'),
    status = dropzone?.querySelector('[data-upload-status]'),
    maxFiles = input.multiple ? Infinity : 1,
    maxSize = Infinity,
    accept = input.accept,
    onChange = () => {},
    translate = editorI18n(input.ownerDocument).t,
  } = componentOptions('upload', options);
  if (input.type !== 'file' || !dropzone || !list || !status) throw new TypeError('Upload vyžaduje file input, dropzone, list a status.');
  validateFiles([], { maxFiles, maxSize });
  const doc = input.ownerDocument;
  const win = doc.defaultView;
  const disabled = () => input.matches(':disabled');
  let selected = [...input.files];
  let urls = [];
  let depth = 0;
  let updating = false;
  let destroyed = false;
  let resetTimer;
  const release = () => { urls.forEach(url => win.URL.revokeObjectURL(url)); urls = []; };
  const sync = (files) => {
    const transfer = new win.DataTransfer(); files.forEach(file => transfer.items.add(file)); input.files = transfer.files;
  };
  const render = () => {
    release(); list.replaceChildren();
    selected.forEach((file, index) => {
      const item = doc.createElement('li'); item.className = 'upload-item';
      if (['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'].includes(file.type)) {
        const image = doc.createElement('img'); image.className = 'upload-preview'; image.alt = ''; image.loading = 'lazy';
        image.src = win.URL.createObjectURL(file); urls.push(image.src); item.append(image);
      }
      const name = doc.createElement('span'); name.className = 'upload-name'; name.textContent = `${file.name} (${Math.ceil(file.size / 1024)} kB)`;
      const remove = doc.createElement('button'); remove.type = 'button'; remove.className = 'button button-outline'; remove.textContent = translate ? translate('uploadRemove') : 'Odebrat';
      remove.setAttribute('aria-label', translate ? translate('uploadRemoveFile', { name: file.name }) : `Odebrat ${file.name}`); remove.dataset.removeFile = String(index);
      remove.disabled = disabled(); item.append(name, remove); list.append(item);
    });
  };
  const announce = (text, state) => { status.textContent = text; status.dataset.state = state; };
  const notify = () => {
    updating = true;
    try { input.dispatchEvent(new win.Event('change', { bubbles: true })); } finally { updating = false; }
    onChange([...selected]);
  };
  const setFiles = (files, { emit = true } = {}) => {
    if (destroyed) throw new Error('Upload byl odpojen.');
    if (disabled()) return false;
    const next = [...files];
    const errors = validateFiles(next, { accept: input.accept || accept, maxFiles: input.multiple ? maxFiles : Math.min(maxFiles, 1), maxSize, translate });
    if (errors.length) {
      sync(selected); announce(translate ? translate('uploadError', { errors: errors.join(' ') }) : `Chyba: ${errors.join(' ')} Původní výběr zachován.`, 'error'); return false;
    }
    sync(next); selected = next; render();
    announce(translate ? translate(next.length ? 'uploadSelected' : 'uploadEmpty', { count: next.length }) : next.length ? `Vybráno souborů: ${next.length}.` : 'Žádné vybrané soubory.', next.length ? 'success' : 'info');
    if (emit) notify();
    return true;
  };
  const change = () => { if (!updating) { if (setFiles(input.files, { emit: false })) onChange([...selected]); } };
  const isFileDrag = event => [...(event.dataTransfer?.types || [])].includes('Files');
  const enter = event => {
    if (!isFileDrag(event) || disabled()) return;
    event.preventDefault(); depth++; dropzone.setAttribute('data-drag-active', '');
  };
  const over = event => { if (isFileDrag(event) && !disabled()) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } };
  const leave = event => { if (!isFileDrag(event)) return; depth = Math.max(0, depth - 1); if (!depth) dropzone.removeAttribute('data-drag-active'); };
  const drop = event => {
    if (!isFileDrag(event)) return;
    event.preventDefault(); depth = 0; dropzone.removeAttribute('data-drag-active');
    if (!disabled()) setFiles(event.dataTransfer.files);
  };
  const remove = event => {
    const button = event.target.closest('[data-remove-file]');
    if (!button || !list.contains(button) || disabled()) return;
    const index = Number(button.dataset.removeFile);
    if (setFiles(selected.filter((_, at) => at !== index))) {
      const remaining = list.querySelectorAll('button'); (remaining[Math.min(index, remaining.length - 1)] || input).focus();
    }
  };
  const reset = event => { clearTimeout(resetTimer); resetTimer = setTimeout(() => {
    if (destroyed || event.defaultPrevented) return;
    selected = [...input.files]; render(); announce(translate ? translate('uploadEmpty') : 'Žádné vybrané soubory.', 'info'); onChange([...selected]);
  }, 0); };
  input.addEventListener('change', change); dropzone.addEventListener('dragenter', enter); dropzone.addEventListener('dragover', over);
  dropzone.addEventListener('dragleave', leave); dropzone.addEventListener('drop', drop); list.addEventListener('click', remove); input.form?.addEventListener('reset', reset);
  render();
  return {
    setFiles,
    getFiles: () => [...selected],
    clear: () => setFiles([]),
    destroy() {
      if (destroyed) return;
      clearTimeout(resetTimer);
      input.removeEventListener('change', change); dropzone.removeEventListener('dragenter', enter); dropzone.removeEventListener('dragover', over);
      dropzone.removeEventListener('dragleave', leave); dropzone.removeEventListener('drop', drop); list.removeEventListener('click', remove); input.form?.removeEventListener('reset', reset);
      release(); list.replaceChildren(); status.textContent = ''; status.removeAttribute('data-state'); dropzone.removeAttribute('data-drag-active'); destroyed = true;
    },
  };
}
