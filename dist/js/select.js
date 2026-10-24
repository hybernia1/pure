import { uiI18n } from './i18n.js';
import { createFieldPopup, emitValue, icon } from './controls.js';

export function createSelect(source, { placeholder = uiI18n(source.ownerDocument).t('selectPlaceholder') } = {}) {
  if (source.tagName !== 'SELECT') throw new TypeError('createSelect vyžaduje select.');
  const doc = source.ownerDocument;
  const ui = createFieldPopup(source, { glyph: 'list', kind: 'listbox', placeholder });
  let current = -1; let search = ''; let searchTimer;
  const options = () => [...source.options];
  const enabled = option => !option.disabled && !option.closest('optgroup')?.disabled;
  const rows = () => [...ui.panel.querySelectorAll('[role="option"]')];
  const focus = index => {
    const all = rows();
    if (!all[index] || all[index].disabled) return;
    current = index; all.forEach((row, at) => { row.tabIndex = at === current ? 0 : -1; }); all[index].focus(); all[index].scrollIntoView({ block: 'nearest' });
  };
  const choose = index => {
    const option = options()[index]; if (!option || !enabled(option) || source.matches(':disabled')) return;
    if (source.multiple) option.selected = !option.selected;
    else source.selectedIndex = index;
    emitValue(source); if (!source.multiple) ui.close(true); else focus(index);
  };
  const render = () => {
    const focused = ui.panel.contains(doc.activeElement);
    const selected = options().filter(option => option.selected && option.value !== '').map(option => option.label);
    ui.setDisplay(selected.join(', '));
    ui.panel.setAttribute('aria-multiselectable', String(source.multiple));
    ui.panel.replaceChildren();
    let group; let container = ui.panel;
    options().forEach((option, index) => {
      const parent = option.closest('optgroup');
      if (parent !== group) {
        group = parent;
        container = ui.panel;
        if (group) {
          container = doc.createElement('div'); container.setAttribute('role', 'group'); container.setAttribute('aria-label', group.label); ui.panel.append(container);
          const title = doc.createElement('div'); title.className = 'control-group-label'; title.textContent = group.label; title.setAttribute('aria-hidden', 'true'); container.append(title);
        }
      }
      const row = doc.createElement('button'); row.type = 'button'; row.className = 'control-option'; row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(option.selected)); row.disabled = !enabled(option); row.tabIndex = -1; row.dataset.optionIndex = String(index);
      const label = doc.createElement('span'); label.textContent = option.label; row.append(label);
      if (option.selected) row.append(icon(doc, 'check')); container.append(row);
    });
    if (focused && current >= 0) focus(current);
  };
  ui.listen(ui.panel, 'click', event => { const row = event.target.closest('[data-option-index]'); if (row) choose(Number(row.dataset.optionIndex)); });
  ui.listen(ui.panel, 'keydown', event => {
    const available = options().map((option, index) => enabled(option) ? index : -1).filter(index => index >= 0);
    if (!available.length) return;
    const at = Math.max(0, available.indexOf(current));
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      focus(event.key === 'Home' ? available[0] : event.key === 'End' ? available.at(-1) : available[Math.max(0, Math.min(available.length - 1, at + (event.key === 'ArrowDown' ? 1 : -1)))]);
    } else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(current); }
    else if (event.key === 'Tab') ui.close(true);
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault(); clearTimeout(searchTimer); search += event.key.toLocaleLowerCase();
      const ordered = [...available.filter(index => index > current), ...available.filter(index => index <= current)];
      const match = ordered.find(index => options()[index].label.toLocaleLowerCase().startsWith(search)); if (match !== undefined) focus(match);
      searchTimer = setTimeout(() => { search = ''; }, 700);
    }
  });
  ui.configure({ onRefresh: render, onOpen() {
    render(); const all = options(); const index = all.findIndex(option => option.selected && enabled(option));
    focus(index >= 0 ? index : all.findIndex(enabled));
  } });
  return { open: ui.open, close: () => ui.close(true), refresh: ui.refresh, destroy() { clearTimeout(searchTimer); ui.destroy(); } };
}

export function initSelects(scope = document) {
  const controllers = [...scope.querySelectorAll('select[data-select]')].map(source => createSelect(source));
  return () => controllers.forEach(controller => controller.destroy());
}
