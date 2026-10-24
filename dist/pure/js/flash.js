import { uiI18n } from './i18n.js';
import { getPureConfig } from './config.js';
import { assertState } from './states.js';

/** Notifikace jsou textové a zůstávají viditelné, pokud nezadáš duration. */
export function createFlash(region) {
  const defaults = getPureConfig().flash;
  const doc = region.ownerDocument;
  const { t } = uiI18n(doc);
  const active = new Set();
  const owners = new Map();
  let destroyed = false;
  const announcers = ['status', 'alert'].map((role) => {
    const node = doc.createElement('div');
    node.className = 'sr-only'; node.setAttribute('role', role); node.setAttribute('aria-atomic', 'true');
    region.append(node);
    return node;
  });
  return {
    show(message, { state = 'info', duration = defaults.duration } = {}) {
      if (destroyed) throw new Error('Flash modul byl odpojen.');
      assertState(state);
      if (!Number.isFinite(duration) || duration < 0) throw new TypeError('duration musí být nezáporné číslo.');
      const item = doc.createElement('div');
      item.className = 'flash'; item.dataset.state = state;
      const text = doc.createElement('div'); text.className = 'flash-message';
      text.textContent = String(message);
      const close = doc.createElement('button'); close.type = 'button'; close.className = 'flash-close';
      close.textContent = '×'; close.setAttribute('aria-label', t('closeFlash'));
      item.append(text, close); region.append(item);
      let timer;
      const announcer = announcers[state === 'error' ? 1 : 0];
      const owner = {}; let dismissed = false;
      owners.set(announcer, owner);
      announcer.textContent = '';
      const announce = setTimeout(() => { if (owners.get(announcer) === owner) announcer.textContent = String(message); }, 0);
      const dismiss = () => {
        if (dismissed) return;
        dismissed = true;
        clearTimeout(timer); clearTimeout(announce);
        if (owners.get(announcer) === owner) { announcer.textContent = ''; owners.delete(announcer); }
        if (item.contains(doc.activeElement)) {
          region.setAttribute('tabindex', '-1'); region.focus();
        }
        close.removeEventListener('click', dismiss); item.remove(); active.delete(dismiss);
      };
      close.addEventListener('click', dismiss);
      active.add(dismiss);
      // Automatické odstranění neodebere právě ovládanou nebo čtenou zprávu.
      const expire = () => {
        if (dismissed) return;
        if (item.matches(':hover, :focus-within')) timer = setTimeout(expire, 1000);
        else dismiss();
      };
      if (duration) timer = setTimeout(expire, duration);
      return dismiss;
    },
    clear() { [...active].forEach((dismiss) => dismiss()); announcers.forEach((node) => { node.textContent = ''; }); },
    destroy() { this.clear(); announcers.forEach((node) => node.remove()); destroyed = true; },
  };
}
