import { createEditorDialog } from './editor-dialog.js';
import { createSelect } from './select.js';
import { clipboardDocument } from './editor-clipboard.js';
import { markdownDocument } from './editor-markdown.js';
import { renderDocument } from './renderer.js';

export function createImportDialog(doc, { t, filter, insert }) {
  const convert = fields => {
    const source = fields.source.value;
    let value;
    try { value = fields.format.value === 'html' ? clipboardDocument(source, { document: doc }) : markdownDocument(source); }
    catch { throw new Error(t('importInvalid')); }
    if (!value) throw new Error(t('importEmpty'));
    value = filter(value);
    if (!value) throw new Error(t('importEmpty'));
    return value;
  };
  const controller = createEditorDialog(doc, {
    title: t('importTitle'), t, selectFactory: createSelect,
    fields: {
      format: { label: t('importFormat'), options: [['markdown', 'Markdown'], ['html', 'HTML']] },
      source: { label: t('importSource'), type: 'textarea', rows: 6 }
    },
    submit(fields) { insert(convert(fields)); }
  });
  controller.dialog.dataset.editorDialog = 'import';
  const button = doc.createElement('button'); button.type = 'button'; button.className = 'button button-outline'; button.textContent = t('importPreview');
  const help = doc.createElement('p'); help.className = 'field-help'; help.textContent = t('importHelp');
  const preview = doc.createElement('div'); preview.className = 'content border rounded p-3'; preview.hidden = true; preview.setAttribute('aria-label', t('importPreview'));
  const status = doc.createElement('p'); status.className = 'field-error'; status.setAttribute('role', 'status');
  controller.controls.source.closest('.field').after(help, button, status, preview);
  const clear = () => { preview.replaceChildren(); preview.hidden = true; status.textContent = ''; };
  const show = () => {
    clear();
    try { preview.append(renderDocument(convert(controller.controls), { document: doc })); preview.hidden = false; }
    catch (error) { status.textContent = error.message; }
  };
  const stopLink = event => { if (event.target.closest('a')) event.preventDefault(); };
  preview.addEventListener('click', stopLink);
  button.addEventListener('click', show);
  controller.controls.source.addEventListener('input', clear);
  controller.controls.format.addEventListener('change', clear);
  return {
    dialog: controller.dialog,
    open(format, opener) { clear(); controller.open({ format, source: '' }, opener); controller.controls.source.focus(); },
    close: () => controller.close(),
    destroy() {
      preview.removeEventListener('click', stopLink);
      button.removeEventListener('click', show); controller.controls.source.removeEventListener('input', clear);
      controller.controls.format.removeEventListener('change', clear); controller.destroy();
    }
  };
}
