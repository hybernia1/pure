import { uiI18n } from './i18n.js';
/** Indikátor libovolné asynchronní činnosti; každé start() vlastní svůj cleanup. */
export function createActivity({ target = document.body, global = target === target.ownerDocument.body, label = uiI18n(target.ownerDocument).t('activity') } = {}) {
  const doc = target.ownerDocument;
  const element = doc.createElement('div'); element.className = `activity${global ? ' activity-global' : ''}`;
  element.setAttribute('role', 'status'); element.setAttribute('aria-live', 'polite'); element.setAttribute('aria-atomic', 'true'); element.hidden = true;
  const spinner = doc.createElement('span'); spinner.className = 'spinner'; spinner.setAttribute('aria-hidden', 'true');
  const text = doc.createElement('span'); element.append(spinner, text); target.append(element);
  const tasks = new Map(); let destroyed = false;
  const render = () => {
    element.hidden = !tasks.size; text.textContent = [...tasks.values()].at(-1) || '';
  };
  const start = (message = label) => {
    if (destroyed) throw new Error('Indikátor byl odpojen.');
    const token = Symbol(); tasks.set(token, String(message)); render();
    return () => { if (!destroyed && tasks.delete(token)) render(); };
  };
  return {
    start,
    async run(task, message = label) {
      if (typeof task !== 'function') throw new TypeError('run vyžaduje funkci.');
      const finish = start(message);
      try { return await task(); } finally { finish(); }
    },
    isActive: () => tasks.size > 0,
    destroy() { if (destroyed) return; destroyed = true; tasks.clear(); element.remove(); },
  };
}
