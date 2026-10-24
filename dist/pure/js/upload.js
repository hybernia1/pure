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
    prepareFile = null,
    translate = editorI18n(input.ownerDocument).t,
  } = componentOptions('upload', options);
  if (input.type !== 'file' || !dropzone || !list || !status) throw new TypeError('Upload vyžaduje file input, dropzone, list a status.');
  validateFiles([], { maxFiles, maxSize });
  if (prepareFile !== null && typeof prepareFile !== 'function') throw new TypeError('prepareFile must be a function or null.');
  const doc = input.ownerDocument;
  const win = doc.defaultView;
  const disabled = () => input.matches(':disabled');
  let selected = [...input.files];
  let urls = [];
  let depth = 0;
  let updating = false;
  let destroyed = false;
  let resetTimer; let pendingReset;
  let task; let sequence = 0; let ready = Promise.resolve(true); let processing = false;
  const cancelPreparation = () => { sequence++; task?.abort(); pendingReset = null; processing = false; dropzone.removeAttribute('aria-busy'); };
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
  const applyFiles = (files, { emit = true } = {}) => {
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
  const setFiles = (files, options) => {
    if (destroyed) throw new Error('Upload destroyed.');
    cancelPreparation(); const result = applyFiles(files, options); ready = Promise.resolve(result); return result;
  };
  const prepareAndSetFiles = (files, { emit = true } = {}) => {
    if (destroyed) return Promise.reject(new Error('Upload destroyed.'));
    if (disabled()) return Promise.resolve(false);
    const next = [...files]; cancelPreparation(); const id = sequence;
    if (!prepareFile || !next.length) { const result = setFiles(next, { emit }); ready = Promise.resolve(result); return ready; }
    const errors = validateFiles(next, { accept: input.accept || accept, maxFiles: input.multiple ? maxFiles : Math.min(maxFiles, 1), translate });
    if (errors.length) { sync(selected); announce(errors.join(' '), 'error'); ready = Promise.resolve(false); return ready; }
    task = new AbortController(); const signal = task.signal; processing = true; sync(selected); dropzone.setAttribute('aria-busy', 'true');
    announce(translate ? translate('uploadPreparing') : 'Preparing files...', 'info');
    ready = (async () => {
      try {
        const prepared = [];
        // Sequential processing bounds peak decode/canvas memory for multiple files.
        for (const file of next) { if (signal.aborted) return false; const result = await prepareFile(file, { signal }); if (!(result instanceof win.File)) throw new TypeError('prepareFile must return a File.'); prepared.push(result); }
        if (destroyed || signal.aborted || id !== sequence || disabled() || pendingReset && !pendingReset.defaultPrevented) return false;
        processing = false; dropzone.removeAttribute('aria-busy');
        return applyFiles(prepared, { emit });
      } catch (error) {
        if (!destroyed && !signal.aborted && id === sequence) { sync(selected); announce(error.message || 'File preparation failed.', 'error'); }
        return false;
      } finally { if (!destroyed && id === sequence) { processing = false; dropzone.removeAttribute('aria-busy'); } }
    })();
    return ready;
  };
  const change = event => {
    if (updating) return;
    if (prepareFile) { event.stopImmediatePropagation(); prepareAndSetFiles(input.files); }
    else if (setFiles(input.files, { emit: false })) onChange([...selected]);
  };
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
    if (!disabled()) { if (prepareFile) prepareAndSetFiles(event.dataTransfer.files); else setFiles(event.dataTransfer.files); }
  };
  const remove = event => {
    const button = event.target.closest('[data-remove-file]');
    if (!button || !list.contains(button) || disabled()) return;
    const index = Number(button.dataset.removeFile);
    if (setFiles(selected.filter((_, at) => at !== index))) {
      const remaining = list.querySelectorAll('button'); (remaining[Math.min(index, remaining.length - 1)] || input).focus();
    }
  };
  const reset = event => { clearTimeout(resetTimer); const resetSequence = sequence; pendingReset = event; resetTimer = setTimeout(() => {
    if (destroyed || event.defaultPrevented || resetSequence !== sequence) { if (pendingReset === event) pendingReset = null; return; }
    cancelPreparation(); ready = Promise.resolve(true);
    selected = [...input.files]; render(); announce(translate ? translate('uploadEmpty') : 'Žádné vybrané soubory.', 'info'); onChange([...selected]);
  }, 0); };
  input.addEventListener('change', change, true); dropzone.addEventListener('dragenter', enter); dropzone.addEventListener('dragover', over);
  dropzone.addEventListener('dragleave', leave); dropzone.addEventListener('drop', drop); list.addEventListener('click', remove); input.form?.addEventListener('reset', reset);
  render();
  const submit = event => { if (processing) { event.preventDefault(); announce(translate ? translate('uploadPreparing') : 'Preparing files...', 'info'); } };
  input.form?.addEventListener('submit', submit, true);
  return {
    setFiles,
    prepareAndSetFiles,
    get ready() { return ready; },
    isProcessing: () => processing,
    getFiles: () => [...selected],
    clear: () => setFiles([]),
    destroy() {
      if (destroyed) return;
      clearTimeout(resetTimer);
      cancelPreparation(); input.form?.removeEventListener('submit', submit, true);
      input.removeEventListener('change', change, true); dropzone.removeEventListener('dragenter', enter); dropzone.removeEventListener('dragover', over);
      dropzone.removeEventListener('dragleave', leave); dropzone.removeEventListener('drop', drop); list.removeEventListener('click', remove); input.form?.removeEventListener('reset', reset);
      release(); list.replaceChildren(); status.textContent = ''; status.removeAttribute('data-state'); dropzone.removeAttribute('data-drag-active'); destroyed = true;
    },
  };
}
