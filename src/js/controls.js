let controlId = 0;
const proxies = new WeakMap();
export const formControl = source => proxies.get(source) || source;
export const iconsUrl = new URL('../icons.svg', import.meta.url).href;
export function icon(doc, name, sprite = iconsUrl) {
  const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon'); svg.setAttribute('aria-hidden', 'true');
  const use = doc.createElementNS('http://www.w3.org/2000/svg', 'use'); use.setAttribute('href', `${sprite}#${name}`); svg.append(use); return svg;
}
export function iconButton(doc, name, label) {
  const button = doc.createElement('button'); button.type = 'button'; button.className = 'icon-button';
  button.setAttribute('aria-label', label); button.title = label; button.append(icon(doc, name)); return button;
}
export function emitValue(source) {
  const Event = source.ownerDocument.defaultView.Event;
  source.dispatchEvent(new Event('input', { bubbles: true })); source.dispatchEvent(new Event('change', { bubbles: true }));
}

/** Společný obal; nativní pole zůstává nositelem hodnoty a validity. */
export function createFieldPopup(source, { glyph, kind, placeholder, editable = false }) {
  if (proxies.has(source)) throw new Error('Pole už má vlastní ovládání.');
  const doc = source.ownerDocument; const win = doc.defaultView; const originalHidden = source.hidden;
  const wrapper = doc.createElement('div'); wrapper.className = 'control control-with-icon control-with-action';
  const leading = icon(doc, glyph); leading.classList.add('control-icon');
  const trailing = icon(doc, 'chevron-down'); trailing.classList.add('control-end');
  const trigger = doc.createElement('button'); trigger.type = 'button'; trigger.className = 'input control-trigger';
  const entry = editable ? doc.createElement('input') : null;
  if (entry) { entry.type = 'text'; entry.className = 'input control-entry'; entry.dataset.pureProxy = ''; entry.autocomplete = 'off'; trigger.className = 'icon-button control-action'; trigger.append(icon(doc, glyph)); }
  trigger.setAttribute('aria-haspopup', kind); trigger.setAttribute('aria-expanded', 'false');
  const text = doc.createElement('span'); text.className = 'control-value'; if (!entry) trigger.append(text);
  const panel = doc.createElement('div'); panel.className = 'control-panel'; panel.id = `pure-panel-${++controlId}`;
  panel.setAttribute('role', kind); panel.setAttribute('popover', 'auto');
  trigger.setAttribute('aria-controls', panel.id);
  source.before(wrapper); wrapper.append(source, leading, ...(entry ? [entry, trigger] : [trigger, trailing]), panel); source.hidden = true;
  proxies.set(source, entry || trigger);
  const listeners = []; let resetTimer; let destroyed = false; let pointerWasOpen = false;
  const listen = (node, type, fn, options) => { node.addEventListener(type, fn, options); listeners.push(() => node.removeEventListener(type, fn, options)); };
  const isOpen = () => panel.matches(':popover-open');
  const position = () => {
    if (!isOpen()) return;
    const rect = (entry || trigger).getBoundingClientRect(); const gutter = parseFloat(win.getComputedStyle(panel).scrollMarginTop) || 0;
    panel.style.width = `max(${rect.width}px, var(--p-picker-width))`;
    const width = panel.getBoundingClientRect().width;
    panel.style.left = `${Math.max(gutter, Math.min(rect.left, win.innerWidth - width - gutter))}px`;
    panel.style.maxHeight = `${Math.max(rect.top - gutter, win.innerHeight - rect.bottom - gutter)}px`;
    const height = panel.getBoundingClientRect().height;
    const top = rect.bottom + height <= win.innerHeight - gutter ? rect.bottom : Math.max(gutter, rect.top - height);
    panel.style.top = `${top}px`;
  };
  const close = (focus = false) => { if (isOpen()) panel.hidePopover(); trigger.setAttribute('aria-expanded', 'false'); if (focus && !trigger.disabled) (entry || trigger).focus(); };
  let onOpen = () => {}; let onRefresh = () => {};
  const refresh = () => {
    if (destroyed) return;
    trigger.disabled = source.matches(':disabled') || source.readOnly;
    if (entry) { entry.disabled = source.matches(':disabled'); entry.readOnly = source.readOnly; }
    for (const name of ['aria-invalid', 'aria-describedby', 'aria-required']) {
      const value = name === 'aria-required' ? String(source.required) : source.getAttribute(name);
      if (value === null) (entry || trigger).removeAttribute(name); else (entry || trigger).setAttribute(name, value);
    }
    if (trigger.disabled) close(); onRefresh(); position();
  };
  const setDisplay = value => {
    const label = [...(source.labels || [])].map(label => label.textContent.trim()).join(' ') || source.getAttribute('aria-label') || 'Výběr';
    text.textContent = value || placeholder; text.classList.toggle('text-subtle', !value);
    trigger.setAttribute('aria-label', `${label}: ${value || placeholder}`); panel.setAttribute('aria-label', label);
    if (entry) { entry.setAttribute('aria-label', label); entry.placeholder = placeholder; trigger.setAttribute('aria-label', `Otevřít výběr: ${label}`); if (doc.activeElement !== entry) entry.value = value; }
  };
  const open = () => { refresh(); if (trigger.disabled || destroyed) return; panel.showPopover(); trigger.setAttribute('aria-expanded', 'true'); onOpen(); position(); };
  listen(trigger, 'pointerdown', () => { pointerWasOpen = isOpen(); });
  listen(trigger, 'click', () => { if (isOpen() || pointerWasOpen) close(); else open(); pointerWasOpen = false; });
  listen(trigger, 'keydown', event => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); open(); } });
  if (entry) listen(entry, 'keydown', event => { if (event.altKey && event.key === 'ArrowDown') { event.preventDefault(); open(); } });
  listen(panel, 'toggle', () => { trigger.setAttribute('aria-expanded', String(isOpen())); });
  listen(panel, 'keydown', event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); } });
  listen(doc, 'focusin', event => { if (isOpen() && !wrapper.contains(event.target)) close(); });
  listen(wrapper, 'focusout', event => {
    if (event.target !== source && !wrapper.contains(event.relatedTarget)) source.dispatchEvent(new win.FocusEvent('focusout', { bubbles: true, relatedTarget: event.relatedTarget }));
  });
  for (const label of source.labels || []) listen(label, 'click', event => { if (wrapper.contains(event.target)) return; event.preventDefault(); (entry || trigger).focus(); });
  listen(source, 'change', refresh); listen(source, 'input', refresh);
  listen(win, 'resize', position); listen(doc, 'scroll', position, true);
  if (source.form) listen(source.form, 'reset', event => { clearTimeout(resetTimer); resetTimer = setTimeout(() => { if (!event.defaultPrevented && !destroyed) { close(); refresh(); } }, 0); });
  const observer = new win.MutationObserver(refresh);
  observer.observe(source, { attributes: true, childList: true, subtree: true, characterData: true });
  for (const ancestor of wrapper.parentElement?.closest('fieldset') ? [wrapper.parentElement.closest('fieldset')] : []) observer.observe(ancestor, { attributes: true, attributeFilter: ['disabled'] });
  return {
    wrapper, trigger, entry, panel, listen, open, close, isOpen, refresh, setDisplay,
    configure({ onOpen: openCallback, onRefresh: refreshCallback }) { onOpen = openCallback; onRefresh = refreshCallback; refresh(); },
    destroy() { close(); destroyed = true; clearTimeout(resetTimer); observer.disconnect(); listeners.forEach(cleanup => cleanup()); proxies.delete(source); wrapper.before(source); wrapper.remove(); source.hidden = originalHidden; },
  };
}
