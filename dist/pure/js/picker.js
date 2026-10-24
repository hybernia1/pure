import { uiI18n } from './i18n.js';
import { resolveLocale } from './config.js';
import { createFieldPopup, emitValue, iconButton } from './controls.js';
import { dateKey, parseDate, shiftDate, monthGrid, pad } from './calendar.js';
import { parsePickerText } from './picker-value.js';

export function createPicker(source, { locale } = {}) {
  locale = resolveLocale(source.ownerDocument, locale);
  const { t } = uiI18n(source.ownerDocument, { locale });
  if (!['date', 'time', 'datetime-local'].includes(source.type)) throw new TypeError('Picker vyžaduje date, time nebo datetime-local.');
  const doc = source.ownerDocument; const hasDate = source.type !== 'time'; const hasTime = source.type !== 'date';
  const dateHint = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(new Date(2006, 10, 22)).map(part => ({ day: 'DD', month: 'MM', year: 'YYYY' })[part.type] || part.value).join('');
  const ui = createFieldPopup(source, { glyph: hasDate ? 'calendar' : 'clock', kind: 'dialog', placeholder: hasDate ? `${dateHint}${hasTime ? ' HH:mm' : ''}` : 'HH:mm', editable: true });
  let manualError = false; let resetTimer; let destroyed = false;
  const probe = source.cloneNode(); probe.removeAttribute('id'); probe.removeAttribute('name'); probe.required = true;
  let day; let month; let hour = '00'; let minute = '00'; let second = '00'; let focusDay;
  const seconds = () => source.step === 'any' || (Number(source.step) > 0 && Number(source.step) % 60 !== 0) || /:\d{2}:\d{2}/.test(source.value);
  const candidate = () => `${hasDate ? day : ''}${hasDate && hasTime ? 'T' : ''}${hasTime ? `${hour}:${minute}${seconds() ? `:${second}` : ''}` : ''}`;
  const allowed = value => { for (const name of ['min', 'max', 'step']) { if (source.hasAttribute(name)) probe.setAttribute(name, source.getAttribute(name)); else probe.removeAttribute(name); } probe.value = value; return probe.validity.valid; };
  const allowedDay = value => {
    if (!parseDate(value)) return false;
    if (source.type === 'date') return allowed(value);
    return (!source.min || value >= source.min.slice(0, 10)) && (!source.max || value <= source.max.slice(0, 10));
  };
  const initial = () => {
    day = hasDate && source.value ? source.value.slice(0, 10) : dateKey(new Date());
    if (hasDate && source.min && day < source.min.slice(0, 10)) day = source.min.slice(0, 10);
    if (hasDate && source.max && day > source.max.slice(0, 10)) day = source.max.slice(0, 10);
    month = `${day.slice(0, 7)}-01`; focusDay = day;
    const time = (hasDate ? source.value.split('T')[1] : source.value) || (source.min.includes(':') ? source.min.split('T').at(-1) : '00:00');
    [hour, minute, second = '00'] = time.split(':');
  };
  const display = () => {
    if (!source.value) return '';
    if (!hasDate) return source.value;
    const date = parseDate(source.value.slice(0, 10));
    return date ? `${new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'numeric', year: 'numeric' }).format(date)}${hasTime ? ` · ${source.value.split('T')[1]}` : ''}` : '';
  };
  const commit = value => { if (value && !allowed(value)) return false; if (manualError) source.setCustomValidity(''); manualError = false; source.value = value; ui.entry.value = display(); emitValue(source); ui.close(true); return true; };
  ui.listen(ui.entry, 'input', () => {
    const parsed = parsePickerText(ui.entry.value, source.type, { locale });
    if (parsed === null) { source.value = ''; source.setCustomValidity(t(hasDate ? 'invalidDate' : 'invalidTime')); manualError = true; }
    else { if (manualError) source.setCustomValidity(''); manualError = false; source.value = parsed; }
    emitValue(source);
  });
  ui.listen(ui.entry, 'blur', () => { if (!manualError) ui.entry.value = display(); });
  if (source.form) ui.listen(source.form, 'reset', event => { clearTimeout(resetTimer); resetTimer = setTimeout(() => { if (!destroyed && !event.defaultPrevented && manualError) { source.setCustomValidity(''); manualError = false; ui.refresh(); } }, 0); });
  const element = (tag, className, text) => { const node = doc.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const button = (text, fn, className = 'button button-outline') => { const node = element('button', className, text); node.type = 'button'; node.addEventListener('click', fn); return node; };
  const focusCalendar = value => {
    ui.panel.querySelectorAll('[data-date]').forEach(button => { button.tabIndex = button.dataset.date === value ? 0 : -1; });
    ui.panel.querySelector(`[data-date="${value}"]`)?.focus();
  };
  const moveDay = value => {
    if (source.min && value < source.min.slice(0, 10)) value = source.min.slice(0, 10);
    if (source.max && value > source.max.slice(0, 10)) value = source.max.slice(0, 10);
    const direction = value < focusDay ? -1 : 1;
    for (let attempt = 0; !allowedDay(value) && attempt < 366; attempt++) value = shiftDate(value, direction);
    if (!allowedDay(value)) return;
    focusDay = value;
    if (month.slice(0, 7) !== value.slice(0, 7)) { month = `${value.slice(0, 7)}-01`; render(); }
    focusCalendar(value);
  };
  const render = () => {
    ui.panel.replaceChildren();
    const header = element('div', 'picker-header');
    const heading = element('span', 'picker-heading'); heading.id = `${ui.panel.id}-heading`; heading.setAttribute('aria-live', 'polite');
    if (hasDate) {
      heading.textContent = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(parseDate(month));
      for (const [delta, glyph, name] of [[-1, 'chevron-left', t('previousMonth')], [1, 'chevron-right', t('nextMonth')]]) {
        const nav = iconButton(doc, glyph, name); nav.dataset.monthDelta = String(delta);
        const target = shiftDate(month, 0, delta);
        nav.disabled = (source.min && target.slice(0, 7) < source.min.slice(0, 7)) || (source.max && target.slice(0, 7) > source.max.slice(0, 7));
        nav.addEventListener('click', () => { month = target; focusDay = month; render(); ui.panel.querySelector(`[data-month-delta="${delta}"]`)?.focus(); });
        if (delta < 0) header.append(nav, heading); else header.append(nav);
      }
    } else { heading.textContent = t('chooseTime'); header.append(heading); }
    const close = iconButton(doc, 'close', t('closePicker')); close.addEventListener('click', () => ui.close(true)); header.append(close); ui.panel.append(header);
    if (hasDate) {
      const table = element('table', 'picker-calendar'); table.setAttribute('role', 'grid'); table.setAttribute('aria-labelledby', heading.id);
      const head = element('thead'); const labels = element('tr');
      for (let i = 0; i < 7; i++) {
        const date = parseDate('2026-10-19'); date.setDate(date.getDate() + i);
        const th = element('th'); th.scope = 'col'; const abbr = element('abbr', '', new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date));
        abbr.title = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date); th.append(abbr); labels.append(th);
      }
      head.append(labels); table.append(head); const body = element('tbody');
      const cells = monthGrid(month); let row;
      cells.forEach((value, index) => {
        if (index % 7 === 0) { row = element('tr'); body.append(row); }
        const cell = element('td'); row.append(cell); if (!value) return;
        const dateButton = button(String(Number(value.slice(-2))), () => { day = value; focusDay = value; if (!hasTime) commit(day); else { render(); focusCalendar(value); } }, 'picker-day');
        dateButton.dataset.date = value; dateButton.disabled = !allowedDay(value); dateButton.tabIndex = value === focusDay && !dateButton.disabled ? 0 : -1;
        dateButton.setAttribute('aria-label', new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(parseDate(value)));
        cell.setAttribute('aria-selected', String(day === value)); dateButton.setAttribute('aria-pressed', String(day === value));
        if (value === dateKey(new Date())) dateButton.setAttribute('aria-current', 'date'); cell.append(dateButton);
      });
      table.append(body); ui.panel.append(table);
      if (!table.querySelector('[tabindex="0"]')) { const first = table.querySelector('button:not(:disabled)'); if (first) { first.tabIndex = 0; focusDay = first.dataset.date; } }
    }
    if (hasTime) {
      // Pro minutové kroky nabízej jen skutečně platné kombinace, např. 00/15/30/45.
      const feasible = [];
      if (!seconds()) {
        for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m++) {
          const hh = pad(h); const mm = pad(m);
          if (allowed(`${hasDate ? `${day}T` : ''}${hh}:${mm}`)) feasible.push({ hour: hh, minute: mm });
        }
        if (feasible.length && !feasible.some(time => time.hour === hour && time.minute === minute)) {
          const nearest = feasible.find(time => time.hour === hour) || feasible[0]; hour = nearest.hour; minute = nearest.minute;
        }
      }
      const columns = element('div', 'picker-time');
      for (const [part, title, count, selected] of [['hour', t('hours'), 24, hour], ['minute', t('minutes'), 60, minute], ...(seconds() ? [['second', t('seconds'), 60, second]] : [])]) {
        const column = element('div', 'picker-time-column'); const name = element('p', 'field-help', title); name.id = `${ui.panel.id}-${part}`;
        const list = element('div', 'picker-time-list'); list.setAttribute('role', 'listbox'); list.setAttribute('aria-labelledby', name.id);
        for (let index = 0; index < count; index++) {
          if (!seconds() && feasible.length && !feasible.some(time => time[part] === pad(index) && (part !== 'minute' || time.hour === hour))) continue;
          const item = button(pad(index), () => { if (part === 'hour') hour = pad(index); if (part === 'minute') minute = pad(index); if (part === 'second') second = pad(index); render(); ui.panel.querySelector(`[data-time-part="${part}"][aria-selected="true"]`)?.focus(); }, 'control-option');
          item.setAttribute('role', 'option'); item.dataset.timePart = part; item.dataset.timeValue = pad(index);
          item.setAttribute('aria-selected', String(pad(index) === selected)); item.tabIndex = pad(index) === selected ? 0 : -1; list.append(item);
        }
        column.append(name, list); columns.append(column);
      }
      ui.panel.append(columns);
      columns.querySelectorAll('[aria-selected="true"]').forEach(item => { item.parentElement.scrollTop = item.offsetTop - item.parentElement.clientHeight / 2 + item.offsetHeight / 2; });
      const valid = allowed(candidate()); const message = valid ? candidate().replace('T', ' · ') : probe.validationMessage;
      const status = element('p', 'picker-status', message); status.setAttribute('role', 'status'); ui.panel.append(status);
      const footer = element('div', 'picker-footer'); const apply = button(t('apply'), () => commit(candidate()), 'button'); apply.disabled = !valid;
      footer.append(button(t('clear'), () => commit('')), apply); ui.panel.append(footer);
    } else { const footer = element('div', 'picker-footer'); footer.append(button(t('clear'), () => commit(''))); ui.panel.append(footer); }
  };
  ui.listen(ui.panel, 'keydown', event => {
    const dateButton = event.target.closest('[data-date]');
    if (dateButton) {
      const date = dateButton.dataset.date; const weekday = (parseDate(date).getDay() + 6) % 7;
      let next;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) next = shiftDate(date, { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -weekday, End: 6 - weekday }[event.key]);
      if (event.key === 'PageUp' || event.key === 'PageDown') next = shiftDate(date, 0, (event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1));
      if (next) { event.preventDefault(); moveDay(next); }
    }
    const item = event.target.closest('[data-time-part]');
    if (item && ['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); const all = [...item.parentElement.children]; const at = all.indexOf(item);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? all.length - 1 : Math.max(0, Math.min(all.length - 1, at + (event.key === 'ArrowUp' ? -1 : 1)));
      all.forEach((node, index) => { node.tabIndex = index === next ? 0 : -1; }); all[next].focus();
    }
  });
  ui.configure({ onRefresh() { if (manualError && source.value) { source.setCustomValidity(''); manualError = false; } ui.setDisplay(display()); }, onOpen() { initial(); render(); if (hasDate) focusCalendar(focusDay); else ui.panel.querySelector('[data-time-part][aria-selected="true"]')?.focus(); } });
  return { open: ui.open, close: () => ui.close(true), refresh: ui.refresh, destroy() { destroyed = true; clearTimeout(resetTimer); if (manualError) source.setCustomValidity(''); ui.destroy(); } };
}

export function initPickers(scope = document) {
  const controllers = [...scope.querySelectorAll('input[data-picker]')].map(source => createPicker(source));
  return () => controllers.forEach(controller => controller.destroy());
}
