import { componentOptions } from './config.js';

const instances = new WeakSet();
let nextId = 0;

/** Static HTML panels, scoped to their own data-tabs root (including nested tabs). */
export function createTabs(root, options = {}) {
  const { active, activation = 'auto', orientation = 'horizontal', onChange = () => {} } = componentOptions('tabs', options);
  if (!root.matches('[data-tabs]') || instances.has(root) || !['auto', 'manual'].includes(activation) || !['horizontal', 'vertical'].includes(orientation) || typeof onChange !== 'function') throw new TypeError('Invalid tabs options or root.');
  const own = selector => [...root.querySelectorAll(selector)].filter(node => node.closest('[data-tabs]') === root);
  const lists = own('[data-tab-list]'); const tabs = own('[data-tab]'); const panels = own('[data-tab-panel]');
  const list = lists[0];
  const disabled = tab => tab.matches(':disabled') || tab.getAttribute('aria-disabled') === 'true';
  const keys = tabs.map(tab => tab.dataset.tab);
  if (lists.length !== 1 || !tabs.length || tabs.some(tab => tab.tagName !== 'BUTTON' || tab.parentElement !== list) || keys.some(key => !key) || new Set(keys).size !== tabs.length || panels.length !== tabs.length || keys.some(key => panels.filter(panel => panel.dataset.tabPanel === key).length !== 1) || panels.some(panel => panels.some(other => other !== panel && other.contains(panel))) || !tabs.some(tab => !disabled(tab))) throw new TypeError('Tabs require one list, unique sibling button/panel pairs and an enabled tab.');
  const doc = root.ownerDocument; const ids = [...tabs, ...panels].filter(node => node.id);
  if (new Set(ids.map(node => node.id)).size !== ids.length || ids.some(node => doc.getElementById(node.id) && doc.getElementById(node.id) !== node)) throw new TypeError('Tab and panel IDs must be unique.');
  const panelFor = tab => panels.find(panel => panel.dataset.tabPanel === tab.dataset.tab);
  const selectedMarkup = tabs.find(tab => tab.getAttribute('aria-selected') === 'true' && !disabled(tab));
  let selected = active === undefined ? selectedMarkup || tabs.find(tab => !disabled(tab)) : tabs.find(tab => tab.dataset.tab === active && !disabled(tab));
  if (!selected) throw new TypeError('Unknown or disabled initial tab.');
  const originals = new Map();
  const remember = (node, names) => originals.set(node, names.map(name => [name, node.getAttribute(name)]));
  remember(root, ['data-tabs-ready', 'data-tabs-orientation']);
  remember(list, ['role', 'aria-orientation', 'tabindex']);
  for (const tab of tabs) remember(tab, ['id', 'type', 'role', 'aria-controls', 'aria-selected', 'tabindex']);
  for (const panel of panels) remember(panel, ['id', 'role', 'aria-labelledby', 'tabindex', 'hidden']);
  const uniqueId = () => { let id; do { id = `pure-tab-${++nextId}`; } while (doc.getElementById(id)); return id; };
  list.setAttribute('role', 'tablist'); list.setAttribute('aria-orientation', orientation);
  root.dataset.tabsReady = ''; root.dataset.tabsOrientation = orientation;
  for (const tab of tabs) {
    const panel = panelFor(tab);
    tab.id ||= uniqueId(); panel.id ||= uniqueId(); tab.type = 'button';
    tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', tab.id);
    if (!panel.hasAttribute('tabindex')) panel.tabIndex = 0;
  }
  let destroyed = false; let roving = selected;
  const render = () => {
    for (const tab of tabs) { tab.setAttribute('aria-selected', String(tab === selected)); tab.tabIndex = tab === roving ? 0 : -1; panelFor(tab).hidden = tab !== selected; }
  };
  const select = (key, { focus = false } = {}) => {
    if (destroyed) throw new Error('Tabs destroyed.');
    const next = tabs.find(tab => tab.dataset.tab === key);
    if (!next || disabled(next)) return false;
    const previous = selected; const previousKey = previous?.dataset.tab ?? null;
    const moveFocus = focus || (previous !== next && previous && panelFor(previous).contains(doc.activeElement));
    selected = next; roving = next; render(); if (moveFocus) next.focus();
    if (previous !== next) {
      const detail = { key, previous: previousKey, tab: next, panel: panelFor(next) };
      root.dispatchEvent(new doc.defaultView.CustomEvent('pure:tab-change', { bubbles: true, detail }));
      onChange(detail);
    }
    return true;
  };
  const click = event => { const tab = event.target.closest('[data-tab]'); if (!tabs.includes(tab) || disabled(tab)) return; event.preventDefault(); select(tab.dataset.tab, { focus: true }); };
  const keydown = event => {
    const tab = event.target.closest('[data-tab]'); if (!tabs.includes(tab) || disabled(tab) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (activation === 'manual' && ['Enter', ' '].includes(event.key)) { event.preventDefault(); select(tab.dataset.tab, { focus: true }); return; }
    const enabled = tabs.filter(tab => !disabled(tab)); const index = enabled.indexOf(tab);
    const rtl = doc.defaultView.getComputedStyle(list).direction === 'rtl';
    let delta;
    if (orientation === 'horizontal') delta = event.key === 'ArrowRight' ? (rtl ? -1 : 1) : event.key === 'ArrowLeft' ? (rtl ? 1 : -1) : undefined;
    else delta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : undefined;
    const next = event.key === 'Home' ? enabled[0] : event.key === 'End' ? enabled.at(-1) : delta === undefined ? null : enabled[(index + delta + enabled.length) % enabled.length];
    if (!next) return; event.preventDefault();
    if (activation === 'auto') select(next.dataset.tab, { focus: true });
    else { roving = next; render(); next.focus(); }
  };
  render(); list.addEventListener('click', click); list.addEventListener('keydown', keydown); instances.add(root);
  return {
    select, getActive: () => selected?.dataset.tab ?? null,
    refresh() {
      if (destroyed) throw new Error('Tabs destroyed.');
      const next = selected && !disabled(selected) ? selected : tabs.find(tab => !disabled(tab));
      if (next) return select(next.dataset.tab);
      const restoreFocus = selected && panelFor(selected).contains(doc.activeElement);
      selected = null; roving = null; render();
      if (restoreFocus) { list.tabIndex = -1; list.focus(); }
      return false;
    },
    destroy() {
      if (destroyed) return; destroyed = true; list.removeEventListener('click', click); list.removeEventListener('keydown', keydown);
      for (const [node, attributes] of originals) for (const [name, value] of attributes) { if (value === null) node.removeAttribute(name); else node.setAttribute(name, value); }
      instances.delete(root);
    },
  };
}


export function initTabs(scope = document, options = {}) {
  const roots = [...(scope.matches?.('[data-tabs]') ? [scope] : []), ...scope.querySelectorAll('[data-tabs]')];
  const controllers = [];
  try { for (const root of roots) controllers.push(createTabs(root, options)); }
  catch (error) { controllers.reverse().forEach(controller => controller.destroy()); throw error; }
  return () => controllers.reverse().forEach(controller => controller.destroy());
}
