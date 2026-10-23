import { icon } from './controls.js';

const instances = new WeakMap();
export function createResize(target, {
  container = target.parentElement, width = 100, min = 10, max = 100, step = 1,
  label = 'Šířka', help = 'Táhni pro změnu šířky; šipky mění velikost, Escape ruší tažení.', iconsUrl, onChange = () => {}, onCommit = () => {},
} = {}) {
  if (!container || instances.has(target)) throw new TypeError('Resize vyžaduje kontejner a dosud neinicializovaný prvek.');
  if (![width, min, max, step].every(Number.isFinite) || min <= 0 || max > 100 || min > max || step <= 0) throw new TypeError('Neplatné meze resize.');
  const doc = target.ownerDocument; const win = doc.defaultView;
  const originalWidth = target.style.getPropertyValue('width'); const priority = target.style.getPropertyPriority('width');
  const hadClass = target.classList.contains('resizable');
  const handle = doc.createElement('span'); handle.className = 'resize-handle'; handle.dataset.resizeHandle = '';
  handle.tabIndex = 0; handle.setAttribute('role', 'slider'); handle.setAttribute('aria-label', label);
  handle.setAttribute('aria-orientation', 'horizontal'); handle.setAttribute('aria-valuemin', min); handle.setAttribute('aria-valuemax', max);
  handle.title = help;
  handle.append(icon(doc, 'resize', iconsUrl));
  const snap = number => Math.max(min, Math.min(max, Number((min + Math.round((number - min) / step) * step).toFixed(2))));
  let current = snap(width); let gesture = null; let destroyed = false;
  let pointerCleanups = [];
  const stopPointer = () => { pointerCleanups.forEach(cleanup => cleanup()); pointerCleanups = []; };
  const listeners = [];
  const listen = (element, type, callback) => { element.addEventListener(type, callback); listeners.push(() => element.removeEventListener(type, callback)); };
  const paint = () => {
    target.style.width = `${current}%`; handle.setAttribute('aria-valuenow', current); handle.setAttribute('aria-valuetext', `${current} %`);
  };
  const change = number => {
    const next = snap(number); if (next === current) return false;
    current = next; paint(); onChange(current); return true;
  };
  const finish = cancel => {
    if (!gesture) return;
    const previous = gesture; gesture = null; target.removeAttribute('data-resizing');
    stopPointer();
    if (handle.hasPointerCapture?.(previous.id)) handle.releasePointerCapture(previous.id);
    if (cancel) { change(previous.width); return; }
    if (current !== previous.width) onCommit(current);
  };
  const setWidth = number => {
    if (destroyed) throw new Error('Resize byl odpojen.');
    if (!Number.isFinite(number)) throw new TypeError('Šířka musí být číslo.');
    finish(true); if (change(number)) onCommit(current); return current;
  };
  const startPointer = () => {
    const callbacks = {
      pointermove(event) {
        if (!gesture || gesture.id !== event.pointerId) return;
        event.preventDefault(); change(gesture.width + (event.clientX - gesture.x) / gesture.size * 100);
      },
      pointerup(event) { if (gesture?.id === event.pointerId) finish(false); },
      pointercancel(event) { if (gesture?.id === event.pointerId) finish(true); },
      blur() { finish(true); },
    };
    for (const [type, callback] of Object.entries(callbacks)) {
      win.addEventListener(type, callback); pointerCleanups.push(() => win.removeEventListener(type, callback));
    }
  };
  listen(handle, 'pointerdown', event => {
    if (gesture || event.button !== 0 || event.isPrimary === false) return;
    const style = win.getComputedStyle(container);
    const size = container.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    if (size <= 0) return;
    event.preventDefault(); event.stopPropagation(); handle.focus();
    gesture = { id: event.pointerId, x: event.clientX, width: current, size };
    startPointer();
    target.dataset.resizing = '';
    // Window listeners also support pointers that leave the handle before capture.
    try { handle.setPointerCapture(event.pointerId); } catch { /* Synthetic pointers have no active capture. */ }
  });
  listen(handle, 'lostpointercapture', () => finish(true));
  listen(handle, 'keydown', event => {
    if (event.key === 'Escape' && gesture) { event.preventDefault(); event.stopPropagation(); finish(true); return; }
    const values = { ArrowLeft: current - step, ArrowDown: current - step, ArrowRight: current + step, ArrowUp: current + step, Home: min, End: max };
    if (!(event.key in values)) return;
    event.preventDefault(); event.stopPropagation(); setWidth(values[event.key]);
  });
  target.classList.add('resizable'); target.append(handle); paint();
  const api = {
    getWidth: () => current, setWidth,
    smaller: () => setWidth(current - step), larger: () => setWidth(current + step),
    destroy() {
      if (destroyed) return;
      // Cleanup must not call application callbacks.
      gesture = null; destroyed = true; stopPointer(); listeners.forEach(cleanup => cleanup()); handle.remove(); target.removeAttribute('data-resizing');
      if (!hadClass) target.classList.remove('resizable');
      if (originalWidth) target.style.setProperty('width', originalWidth, priority); else target.style.removeProperty('width');
      instances.delete(target);
    },
  };
  instances.set(target, api); return api;
}
