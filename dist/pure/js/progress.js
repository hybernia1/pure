import { uiI18n } from './i18n.js';
import { assertState } from './states.js';

const instances = new WeakSet();
export function createProgress(target, { max = 100, value = 0, label = uiI18n(target.ownerDocument).t('progress') } = {}) {
  if (instances.has(target)) throw new Error('Progress už je inicializovaný.');
  if (!Number.isFinite(max) || max <= 0) throw new TypeError('Maximum musí být kladné číslo.');
  const normalize = number => {
    if (number === null) return null;
    if (!Number.isFinite(number)) throw new TypeError('Průběh musí být číslo nebo null.');
    return Math.max(0, Math.min(max, number));
  };
  let current = normalize(value); let destroyed = false;
  const doc = target.ownerDocument;
  const { t } = uiI18n(doc);
  const element = doc.createElement('div'); element.className = 'progress';
  const description = doc.createElement('div'); description.className = 'progress-description';
  const text = doc.createElement('span'); text.textContent = label;
  const amount = doc.createElement('span'); amount.setAttribute('aria-hidden', 'true'); description.append(text, amount);
  const track = doc.createElement('div'); track.className = 'progress-track'; track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-valuemin', '0'); track.setAttribute('aria-valuemax', max);
  const fill = doc.createElement('span'); fill.className = 'progress-fill'; track.append(fill);
  const status = doc.createElement('span'); status.className = 'sr-only'; status.setAttribute('role', 'status');
  element.append(description, track, status); target.append(element); instances.add(target);
  const check = () => { if (destroyed) throw new Error('Progress byl odpojen.'); };
  const render = () => {
    const percent = current === null ? null : Math.round(current / max * 100);
    element.dataset.indeterminate = String(current === null);
    track.setAttribute('aria-label', text.textContent);
    if (current === null) track.removeAttribute('aria-valuenow'); else track.setAttribute('aria-valuenow', current);
    amount.textContent = percent === null ? t('pending') : `${percent} %`;
    fill.style.width = percent === null ? '' : `${current / max * 100}%`;
  };
  render();
  return {
    set(number) { check(); current = normalize(number); render(); },
    getValue: () => current,
    setState(state, message) {
      check(); if (state !== null) assertState(state);
      if (state === null) element.removeAttribute('data-state'); else element.dataset.state = state;
      const defaults = { error: t('error'), success: t('success'), info: t('info') };
      text.textContent = message ?? (state === null ? label : defaults[state]); status.textContent = state === null ? '' : text.textContent; render();
    },
    destroy() { if (destroyed) return; destroyed = true; element.remove(); instances.delete(target); },
  };
}
