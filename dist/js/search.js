import { uiI18n } from './i18n.js';
import { componentOptions } from './config.js';
import { icon, iconButton } from './controls.js';
import { request } from './ajax.js';

let nextId = 0;
const instances = new WeakSet();
export function createSearch(source, options = {}) {
  const { url, param = 'q', fetch: fetchItems, delay = 250, minLength = 2, limit = 8, onSelect = () => {} } = componentOptions('search', options);
  if (source.tagName !== 'INPUT' || !['text', 'search'].includes(source.type) || instances.has(source)) throw new TypeError('Search vyžaduje neinicializovaný textový nebo search input.');
  if ((!url && typeof fetchItems !== 'function') || !Number.isFinite(delay) || delay < 0 || !Number.isInteger(minLength) || minLength < 0 || !Number.isInteger(limit) || limit < 1) throw new TypeError('Neplatné nastavení search.');
  const doc = source.ownerDocument; const win = doc.defaultView;
  const { t } = uiI18n(doc);
  const attrs = ['role', 'autocomplete', 'aria-autocomplete', 'aria-controls', 'aria-expanded', 'aria-activedescendant', 'aria-busy'];
  const original = new Map(attrs.map(name => [name, source.getAttribute(name)]));
  const wrapper = doc.createElement('div'); wrapper.className = 'control control-with-icon control-with-action search'; source.before(wrapper); wrapper.append(source);
  const glyph = icon(doc, 'search'); glyph.classList.add('control-icon'); wrapper.append(glyph);
  const clear = iconButton(doc, 'close', t('clearSearch')); clear.classList.add('control-action'); wrapper.append(clear);
  const syncClear = () => { clear.hidden = !source.value; clear.disabled = source.matches(':disabled') || source.readOnly; }; syncClear();
  const panel = doc.createElement('div'); panel.className = 'control-panel search-panel'; panel.id = `pure-search-${++nextId}`; panel.setAttribute('popover', 'auto');
  panel.setAttribute('role', 'listbox'); panel.setAttribute('aria-label', t('suggestions')); wrapper.append(panel);
  const status = doc.createElement('span'); status.className = 'search-status field-help'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); wrapper.append(status);
  source.setAttribute('role', 'combobox'); source.setAttribute('autocomplete', 'off'); source.setAttribute('aria-autocomplete', 'list'); source.setAttribute('aria-controls', panel.id); source.setAttribute('aria-expanded', 'false');
  let items = []; let active = -1; let timer; let resetTimer; let controller; let sequence = 0; let destroyed = false; let composing = false;
  const listeners = [];
  const listen = (target, type, fn) => { target.addEventListener(type, fn); listeners.push(() => target.removeEventListener(type, fn)); };
  const position = () => {
    if (!panel.matches(':popover-open')) return;
    const rect = source.getBoundingClientRect(); const gutter = parseFloat(win.getComputedStyle(source).paddingInlineEnd) || 0;
    panel.style.width = `${rect.width}px`;
    panel.style.left = `${Math.max(gutter, Math.min(rect.left, win.innerWidth - panel.offsetWidth - gutter))}px`;
    const below = win.innerHeight - rect.bottom - gutter; const above = rect.top - gutter;
    panel.style.setProperty('--p-search-available', `${Math.max(0, Math.max(below, above))}px`);
    panel.style.top = `${below >= panel.offsetHeight || below >= above ? rect.bottom : Math.max(gutter, rect.top - panel.offsetHeight)}px`;
  };
  const clearActive = () => { active = -1; source.removeAttribute('aria-activedescendant'); };
  const cancel = () => { clearTimeout(timer); controller?.abort(); sequence++; source.removeAttribute('aria-busy'); };
  const close = () => {
    cancel(); if (panel.matches(':popover-open')) panel.hidePopover(); source.setAttribute('aria-expanded', 'false'); clearActive(); items = []; panel.replaceChildren(); status.textContent = '';
  };
  const select = index => {
    const item = items[index]; if (!item || source.matches(':disabled') || source.readOnly) return;
    source.value = item.value; close();
    source.dispatchEvent(new win.Event('input', { bubbles: true }));
    // The synthetic input event is for consumers, not another suggestion request.
    cancel();
    source.dispatchEvent(new win.Event('change', { bubbles: true }));
    onSelect(item); source.dispatchEvent(new win.CustomEvent('pure:search-select', { bubbles: true, detail: item }));
  };
  const activate = index => {
    active = index;
    [...panel.children].forEach((row, at) => row.setAttribute('aria-selected', String(at === active)));
    const row = panel.children[active]; if (row) { source.setAttribute('aria-activedescendant', row.id); row.scrollIntoView({ block: 'nearest' }); }
  };
  const refresh = async () => {
    if (destroyed) throw new Error('Search byl odpojen.');
    close(); syncClear(); const query = source.value.trim(); const current = sequence;
    if (composing || source.matches(':disabled') || source.readOnly || query.length < minLength) { close(); return; }
    controller = new AbortController(); const signal = controller.signal;
    source.setAttribute('aria-busy', 'true'); status.textContent = t('searching');
    try {
      let result;
      if (fetchItems) result = await fetchItems(query, { signal });
      else { const endpoint = new URL(url, doc.baseURI); endpoint.searchParams.set(param, query); result = await request(endpoint, { type: 'json', signal }); }
      if (destroyed || current !== sequence || signal.aborted || source.matches(':disabled') || source.readOnly) return;
      if (!Array.isArray(result) || result.some(item => !item || typeof item.label !== 'string' || typeof item.value !== 'string')) throw new TypeError('Search API musí vrátit pole { label, value }.');
      items = result.slice(0, limit); clearActive(); panel.replaceChildren();
      items.forEach((item, index) => {
        const row = doc.createElement('div'); row.className = 'control-option'; row.id = `${panel.id}-${index}`; row.setAttribute('role', 'option'); row.setAttribute('aria-selected', 'false'); row.dataset.searchIndex = index; row.textContent = item.label; panel.append(row);
      });
      status.textContent = items.length ? t('found', { count: items.length }) : t('noResults');
      if (items.length && doc.activeElement === source) { panel.showPopover(); source.setAttribute('aria-expanded', 'true'); position(); }
    } catch (error) {
      if (destroyed || current !== sequence || signal.aborted) return;
      panel.replaceChildren(); items = []; status.textContent = t('searchFailure');
      source.dispatchEvent(new win.CustomEvent('pure:search-error', { bubbles: true, detail: error }));
    } finally { if (!destroyed && current === sequence) source.removeAttribute('aria-busy'); }
  };
  listen(source, 'input', () => { syncClear(); close(); if (!composing) timer = setTimeout(refresh, delay); });
  listen(clear, 'click', () => {
    if (source.matches(':disabled') || source.readOnly) return;
    source.value = ''; source.dispatchEvent(new win.Event('input', { bubbles: true })); source.dispatchEvent(new win.Event('change', { bubbles: true })); source.focus();
  });
  listen(source, 'compositionstart', () => { composing = true; close(); });
  listen(source, 'compositionend', () => { composing = false; close(); timer = setTimeout(refresh, delay); });
  listen(source, 'blur', close);
  listen(source, 'keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'Escape') { if (panel.matches(':popover-open') || controller) event.preventDefault(); close(); }
    else if (event.key === 'Tab') close();
    else if (items.length && panel.matches(':popover-open')) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); activate((active + (event.key === 'ArrowDown' ? 1 : active < 0 ? 0 : -1) + items.length) % items.length); }
      else if (event.key === 'Enter' && active >= 0) { event.preventDefault(); select(active); }
    }
  });
  listen(panel, 'pointerdown', event => event.preventDefault());
  listen(panel, 'click', event => { const row = event.target.closest('[data-search-index]'); if (row) select(Number(row.dataset.searchIndex)); });
  listen(panel, 'toggle', () => { if (!panel.matches(':popover-open')) { source.setAttribute('aria-expanded', 'false'); clearActive(); } });
  listen(win, 'resize', position);
  doc.addEventListener('scroll', position, true); listeners.push(() => doc.removeEventListener('scroll', position, true));
  if (source.form) listen(source.form, 'reset', event => { clearTimeout(resetTimer); resetTimer = setTimeout(() => { if (!destroyed && !event.defaultPrevented) { close(); syncClear(); } }, 0); });
  instances.add(source);
  return {
    refresh, close,
    destroy() {
      if (destroyed) return; close(); destroyed = true; clearTimeout(resetTimer); listeners.forEach(fn => fn());
      wrapper.before(source); wrapper.remove(); original.forEach((value, name) => { if (value === null) source.removeAttribute(name); else source.setAttribute(name, value); }); instances.delete(source);
    },
  };
}
