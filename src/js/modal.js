import { componentOptions } from './config.js';
import { icon } from './controls.js';
// Locks are shared by all Pure modals in the same document, including nested dialogs.
const scrollLocks = new WeakMap();
function lockScroll(doc) {
  let lock = scrollLocks.get(doc);
  if (!lock) {
    const root = doc.documentElement;
    const properties = ['overflow', 'overscroll-behavior', 'scrollbar-gutter'];
    const original = properties.map(name => [name, root.style.getPropertyValue(name), root.style.getPropertyPriority(name)]);
    root.style.setProperty('overflow', 'hidden', 'important');
    root.style.setProperty('overscroll-behavior', 'none', 'important');
    const gutter = doc.defaultView?.getComputedStyle(root).scrollbarGutter || root.style.getPropertyValue('scrollbar-gutter');
    root.style.setProperty('scrollbar-gutter', gutter?.includes('stable') ? gutter : 'stable', 'important');
    lock = { count:0, restore() { for (const [name,value,priority] of original) { if(value)root.style.setProperty(name,value,priority);else root.style.removeProperty(name); } } };
    scrollLocks.set(doc, lock);
  }
  lock.count++;
  let released = false;
  return () => { if(released)return;released=true;if(--lock.count===0){lock.restore();scrollLocks.delete(doc);} };
}
export function createModal(dialog, options = {}) {
  const { closeOnBackdrop = true } = componentOptions('modal', options);
  if (dialog.tagName !== 'DIALOG') throw new TypeError('Modal vyžaduje element dialog.');
  const doc = dialog.ownerDocument;
  let opener;
  let destroyed = false;
  let backdropStart = false;
  let releaseScroll;
  const overscroll = [dialog.style.getPropertyValue('overscroll-behavior'), dialog.style.getPropertyPriority('overscroll-behavior')];
  dialog.style.setProperty('overscroll-behavior', 'contain');
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
  const onClose = () => { if(dialog.open)return;releaseScroll?.();releaseScroll=null;if (opener?.isConnected) opener.focus({preventScroll:true}); opener = null; };
  dialog.addEventListener('pointerdown', onPointerDown);
  dialog.addEventListener('click', onClick);
  dialog.addEventListener('close', onClose);
  return {
    open(trigger = doc.activeElement) {
      if (destroyed) throw new Error('Modal byl odpojen.');
      if (dialog.open) return;
      // close events are queued; release a previous opening before acquiring its replacement.
      releaseScroll?.();releaseScroll=null;
      opener = trigger; dialog.returnValue = '';
      releaseScroll = lockScroll(doc);
      try { dialog.showModal(); } catch(error) { releaseScroll();releaseScroll=null;opener=null;throw error; }
    },
    close(value = '') { dialog.close(value); onClose(); },
    destroy() {
      if (destroyed) return;
      if (dialog.open) { dialog.close(); onClose(); }
      releaseScroll?.();releaseScroll=null;
      dialog.removeEventListener('pointerdown', onPointerDown); dialog.removeEventListener('click', onClick); dialog.removeEventListener('close', onClose);
      restoreButtons.forEach(restore => restore());
      if(overscroll[0])dialog.style.setProperty('overscroll-behavior',...overscroll);else dialog.style.removeProperty('overscroll-behavior');
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
