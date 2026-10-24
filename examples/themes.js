import { initTheme } from '../dist/pure/js/theme.js';

initTheme({ storageKey: 'pure-example-theme', schemeStorageKey: 'pure-example-scheme' });
const root = document.documentElement; const status = document.querySelector('#theme-status');
const update = () => {
  status.textContent = `Režim: ${root.dataset.theme || 'system'} · schéma: ${root.dataset.scheme || 'default'}`;
  for (const button of document.querySelectorAll('[data-theme-set]')) button.setAttribute('aria-pressed', String(button.dataset.themeSet === (root.dataset.theme || 'system')));
  for (const button of document.querySelectorAll('[data-scheme-set]')) button.setAttribute('aria-pressed', String(button.dataset.schemeSet === (root.dataset.scheme || 'default')));
};
new MutationObserver(update).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-scheme'] });
update();
