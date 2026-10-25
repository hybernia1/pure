import { createModal } from './modal.js';
import { iconButton } from './controls.js';
import { editorI18n } from './editor-i18n.js';
let dialogId = 0;

/** Samostatný formulář v Pure modalu; nikdy není vnořený do hostitelského form. */
export function createEditorDialog(doc, { title, fields, submit, remove, selectFactory, uploadFactory, t = editorI18n(doc).t }) {
  const dialog = doc.createElement('dialog'); dialog.className = 'modal editor-dialog'; dialog.setAttribute('aria-label', title);
  const form = doc.createElement('form'); const header = doc.createElement('div'); header.className = 'modal-header';
  const heading = doc.createElement('h2'); heading.className = 'text-xl'; heading.textContent = title;
  const close = iconButton(doc, 'close', t('close')); close.setAttribute('data-modal-close', ''); header.append(heading, close);
  const body = doc.createElement('div'); body.className = 'modal-body grid gap-3'; const controls = {};
  const id = ++dialogId;
  for (const [name, config] of Object.entries(fields)) {
    const label = doc.createElement('div'); label.className = 'field';
    const text = doc.createElement('label'); text.className = 'field-label'; text.textContent = config.label; text.htmlFor = `pure-editor-dialog-${id}-${name}`;
    const input = doc.createElement(config.options ? 'select' : config.type === 'textarea' ? 'textarea' : 'input'); input.className = 'input'; input.name = name;
    input.id = text.htmlFor;
    if (input.tagName === 'INPUT') input.type = config.type || 'text';
    if (config.rows) input.rows = config.rows;
    if (config.accept) input.accept = config.accept;
    if (config.placeholder) input.placeholder = config.placeholder;
    if (config.options) for (const [value, title] of config.options) { const option = doc.createElement('option'); option.value = value; option.textContent = title; input.append(option); }
    label.append(text, input); body.append(label); controls[name] = input;
    if (input.type === 'file') {
      label.classList.add('upload'); label.dataset.upload = '';
      const help = doc.createElement('p'); help.className = 'field-help'; help.textContent = t('uploadHelp');
      help.id = `${input.id}-help`;
      const status = doc.createElement('p'); status.dataset.uploadStatus = ''; status.className = 'state-text text-xs'; status.setAttribute('role', 'status'); status.id = `${input.id}-status`;
      const list = doc.createElement('ul'); list.className = 'upload-list'; list.dataset.uploadList = '';
      input.setAttribute('aria-describedby', `${help.id} ${status.id}`); label.append(help, status, list);
    }
  }
  const error = doc.createElement('p'); error.className = 'field-error'; error.setAttribute('role', 'alert');
  const footer = doc.createElement('div'); footer.className = 'modal-actions';
  const cancel = doc.createElement('button'); cancel.type = 'button'; cancel.className = 'button button-outline'; cancel.textContent = t('cancel'); cancel.setAttribute('data-modal-close', 'cancel');
  const apply = doc.createElement('button'); apply.type = 'submit'; apply.className = 'button'; apply.textContent = t('apply');
  const removeButton = doc.createElement('button'); removeButton.type = 'button'; removeButton.className = 'button button-outline'; removeButton.textContent = t('removeImage'); removeButton.hidden = true;
  footer.append(removeButton, cancel, apply); form.append(header, body, error, footer); dialog.append(form); doc.body.append(dialog);
  const selects = Object.values(controls).filter(input => input.tagName === 'SELECT').map(input => selectFactory(input));
  const uploads = Object.values(controls).filter(input => input.type === 'file').map(input => uploadFactory(input, { maxFiles: 1, translate: t }));
  const modal = createModal(dialog); let abort; let destroyed = false;
  const setBusy = busy => { apply.disabled = busy; Object.values(controls).forEach(input => { input.disabled = busy; }); form.setAttribute('aria-busy', String(busy)); };
  const onSubmit = async event => {
    if (event.defaultPrevented) return;
    event.preventDefault(); if (apply.disabled) return;
    abort = new AbortController(); const task = abort;
    error.textContent = ''; setBusy(true);
    try {
      const result = await submit(controls, task.signal);
      if (!task.signal.aborted && !destroyed && dialog.open && result !== false) modal.close('apply');
    } catch (failure) { if (!task.signal.aborted && !destroyed) error.textContent = failure.message || t('failure'); }
    finally { if (!destroyed && abort === task) setBusy(false); }
  };
  const onClose = () => { if (dialog.open) return; abort?.abort(); setBusy(false); uploads.forEach(upload => upload.clear()); };
  const onCancel = () => abort?.abort();
  const onClick = event => { if (!dialog.open || event.target.closest('[data-modal-close]')) abort?.abort(); };
  const onRemove = () => { remove?.(); modal.close('remove'); };
  form.addEventListener('submit', onSubmit); dialog.addEventListener('close', onClose); dialog.addEventListener('cancel', onCancel); dialog.addEventListener('click', onClick); removeButton.addEventListener('click', onRemove);
  return {
    dialog, controls,
    setFiles(files) { return uploads[0]?.prepareAndSetFiles(files); },
    open(values = {}, opener = doc.activeElement, { removable = false } = {}) {
      form.reset(); error.textContent = ''; removeButton.hidden = !removable; setBusy(false);
      for (const [name, value] of Object.entries(values)) if (controls[name] && controls[name].type !== 'file') controls[name].value = String(value ?? '');
      selects.forEach(select => select.refresh());
      modal.open(opener); Object.values(controls)[0]?.focus();
    },
    close() { abort?.abort(); modal.close(); },
    destroy() { destroyed = true; abort?.abort(); uploads.forEach(upload => upload.destroy()); selects.forEach(select => select.destroy()); form.removeEventListener('submit', onSubmit); dialog.removeEventListener('close', onClose); dialog.removeEventListener('cancel', onCancel); dialog.removeEventListener('click', onClick); removeButton.removeEventListener('click', onRemove); modal.destroy(); dialog.remove(); },
  };
}
