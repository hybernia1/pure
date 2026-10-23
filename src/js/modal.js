import { icon } from './controls.js';
export function createModal(dialog, { closeOnBackdrop = true } = {}) {
  if (dialog.tagName !== 'DIALOG') throw new TypeError('Modal vyžaduje element dialog.');
  const doc = dialog.ownerDocument;
  let opener;
  let destroyed = false;
  let backdropStart = false;
  const restoreButtons = [];
  dialog.querySelectorAll('[data-modal-close=""]').forEach(button => {
    const children = [...button.childNodes]; const original = ['class', 'aria-label', 'title'].map(name => [name, button.getAttribute(name)]);
    button.replaceChildren(icon(doc, 'close')); button.className = 'icon-button';
    button.setAttribute('aria-label', button.getAttribute('aria-label') || 'Zavřít dialog'); button.title = button.getAttribute('aria-label');
    restoreButtons.push(() => { button.replaceChildren(...children); original.forEach(([name, value]) => { if (value === null) button.removeAttribute(name); else button.setAttribute(name, value); }); });
  });
  const outside = (event) => {
    if (event.target !== dialog) return false;
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  };
  const onPointerDown = (event) => { backdropStart = outside(event); };
  const onClick = (event) => {
    if (closeOnBackdrop && backdropStart && outside(event)) dialog.close();
    backdropStart = false;
    const button = event.target.closest('[data-modal-close]');
    if (button?.closest('dialog') === dialog) { event.preventDefault(); dialog.close(button.dataset.modalClose || ''); }
  };
  const onClose = () => { if (opener?.isConnected) opener.focus(); opener = null; };
  dialog.addEventListener('pointerdown', onPointerDown);
  dialog.addEventListener('click', onClick);
  dialog.addEventListener('close', onClose);
  return {
    open(trigger = doc.activeElement) {
      if (destroyed) throw new Error('Modal byl odpojen.');
      if (dialog.open) return;
      opener = trigger; dialog.returnValue = ''; dialog.showModal();
    },
    close(value = '') { dialog.close(value); },
    destroy() {
      if (destroyed) return;
      if (dialog.open) { dialog.close(); onClose(); }
      dialog.removeEventListener('pointerdown', onPointerDown); dialog.removeEventListener('click', onClick); dialog.removeEventListener('close', onClose);
      restoreButtons.forEach(restore => restore());
      destroyed = true;
    },
  };
}

export function initModals(scope = document) {
  const controllers = new Map();
  scope.querySelectorAll('dialog[data-modal]').forEach(dialog => controllers.set(dialog, createModal(dialog)));
  const click = (event) => {
    const trigger = event.target.closest('[data-modal-open]');
    if (!trigger || !scope.contains(trigger)) return;
    const dialog = trigger.ownerDocument.getElementById(trigger.dataset.modalOpen);
    if (controllers.has(dialog)) { event.preventDefault(); controllers.get(dialog).open(trigger); }
  };
  scope.addEventListener('click', click);
  return () => { scope.removeEventListener('click', click); controllers.forEach(controller => controller.destroy()); };
}
