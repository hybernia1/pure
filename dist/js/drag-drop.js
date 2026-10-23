const instances = new WeakSet();

/** Svislé řazení přímých potomků; transport ani datový model nejsou součástí služby. */
export function createDragDrop(container, { items = '[data-drag-item]', handle = '[data-drag-handle]', onMove = () => {}, translate } = {}) {
  if (instances.has(container)) throw new Error('Drag & drop už je inicializovaný.');
  const doc = container.ownerDocument; const win = doc.defaultView;
  const status = doc.createElement('span'); status.className = 'sr-only'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); container.after(status);
  const all = () => [...container.children].filter(item => item.matches(items));
  const listeners = []; let gesture = null; let destroyed = false; let frame;
  const listen = (target, type, callback) => { target.addEventListener(type, callback); listeners.push(() => target.removeEventListener(type, callback)); };
  const markers = () => { for (const item of all()) { item.removeAttribute('data-drop-before'); item.removeAttribute('data-dragging'); } container.removeAttribute('data-drop-end'); };
  const cancel = () => {
    const previous = gesture; gesture = null; win.cancelAnimationFrame(frame); markers();
    if (previous?.trigger.hasPointerCapture?.(previous.id)) previous.trigger.releasePointerCapture(previous.id);
  };
  const indicate = () => {
    markers(); if (!gesture?.active) return;
    gesture.item.dataset.dragging = '';
    if (gesture.to === null || gesture.to === gesture.from) return;
    const others = all().filter(item => item !== gesture.item);
    if (others[gesture.to]) others[gesture.to].dataset.dropBefore = ''; else container.dataset.dropEnd = '';
  };
  const move = (from, to) => {
    if (destroyed) throw new Error('Drag & drop byl odpojen.');
    cancel(); const list = all();
    if (![from, to].every(index => Number.isInteger(index) && index >= 0 && index < list.length)) throw new RangeError('Neplatná pozice přesunu.');
    if (from === to) return false;
    const item = list[from]; const trigger = item.querySelector(handle); const others = list.filter(candidate => candidate !== item);
    container.insertBefore(item, others[to] || null); trigger?.focus();
    status.textContent = translate ? translate('dragMoved', { index: to + 1, count: list.length }) : `Blok přesunut na pozici ${to + 1} z ${list.length}.`;
    onMove({ from, to, item, items: all() }); return true;
  };
  const finish = () => {
    if (!gesture) return;
    const previous = gesture; cancel();
    if (previous.active && previous.to !== null && previous.item.parentElement === container && all()[previous.from] === previous.item) move(previous.from, previous.to);
  };
  const locate = () => {
    if (!gesture?.active || gesture.keyboard) return;
    const rect = container.getBoundingClientRect();
    gesture.to = gesture.x < rect.left || gesture.x > rect.right || gesture.y < rect.top || gesture.y > rect.bottom ? null
      : all().filter(item => item !== gesture.item && gesture.y > item.getBoundingClientRect().top + item.getBoundingClientRect().height / 2).length;
    indicate();
  };
  const autoScroll = () => {
    if (!gesture?.active || gesture.keyboard) return;
    let scroller = container;
    while (scroller && !/(auto|scroll)/.test(win.getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
    const rect = scroller ? scroller.getBoundingClientRect() : { top: 0, bottom: win.innerHeight };
    const top = Math.max(0, rect.top); const bottom = Math.min(win.innerHeight, rect.bottom);
    const delta = gesture.y < top + 32 ? -10 : gesture.y > bottom - 32 ? 10 : 0;
    if (delta) { if (scroller) scroller.scrollBy(0, delta); else win.scrollBy(0, delta); locate(); }
    frame = win.requestAnimationFrame(autoScroll);
  };
  const target = event => {
    const trigger = event.target.closest(handle); const item = trigger?.closest(items);
    return trigger && item?.parentElement === container && !trigger.disabled ? { trigger, item } : null;
  };
  listen(container, 'pointerdown', event => {
    const found = target(event); if (!found || gesture || event.button !== 0 || event.isPrimary === false) return;
    event.preventDefault(); found.trigger.focus();
    gesture = { ...found, from: all().indexOf(found.item), to: null, id: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, active: false };
    try { found.trigger.setPointerCapture(event.pointerId); } catch { /* Synthetic events have no capture. */ }
  });
  listen(win, 'pointermove', event => {
    if (!gesture || gesture.keyboard || event.pointerId !== gesture.id) return;
    if (!gesture.item.isConnected) { cancel(); return; }
    gesture.x = event.clientX; gesture.y = event.clientY;
    if (!gesture.active && Math.hypot(gesture.x - gesture.startX, gesture.y - gesture.startY) >= 5) {
      gesture.active = true; status.textContent = translate ? translate('dragMoving') : 'Přesouvání. Uvolni pro vložení, Escape pro zrušení.'; frame = win.requestAnimationFrame(autoScroll);
    }
    if (gesture.active) { event.preventDefault(); locate(); }
  });
  listen(win, 'pointerup', event => { if (gesture && !gesture.keyboard && event.pointerId === gesture.id) finish(); });
  listen(win, 'pointercancel', event => { if (gesture && !gesture.keyboard && event.pointerId === gesture.id) cancel(); });
  listen(container, 'lostpointercapture', () => { if (gesture && !gesture.keyboard) cancel(); });
  listen(win, 'blur', cancel);
  listen(container, 'focusout', event => { if (gesture?.keyboard && event.relatedTarget !== gesture.trigger) cancel(); });
  listen(doc, 'keydown', event => {
    if (event.key === 'Escape' && gesture) { event.preventDefault(); event.stopPropagation(); cancel(); status.textContent = translate ? translate('dragCanceled') : 'Přesun zrušen.'; }
  });
  listen(container, 'keydown', event => {
    const found = target(event); if (!found) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault(); event.stopPropagation();
      if (gesture?.keyboard) { finish(); return; }
      cancel(); gesture = { ...found, from: all().indexOf(found.item), to: all().indexOf(found.item), active: true, keyboard: true };
      status.textContent = translate ? translate('dragPicked') : 'Blok vybrán. Šipkami nahoru a dolů vyber pozici, mezerníkem potvrď, Escape zruš.'; indicate();
    } else if (gesture?.keyboard && ['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); event.stopPropagation();
      gesture.to = event.key === 'Home' ? 0 : event.key === 'End' ? all().length - 1 : Math.max(0, Math.min(all().length - 1, gesture.to + (event.key === 'ArrowUp' ? -1 : 1)));
      indicate(); status.textContent = translate ? translate('dragPosition', { index: gesture.to + 1, count: all().length }) : `Cílová pozice ${gesture.to + 1} z ${all().length}.`;
    } else if (event.key === 'Tab') cancel();
  });
  instances.add(container);
  return { move, cancel, destroy() { if (destroyed) return; cancel(); destroyed = true; listeners.forEach(cleanup => cleanup()); status.remove(); instances.delete(container); } };
}
