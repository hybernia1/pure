import { componentOptions } from './config.js';
const themes = ['light', 'dark', 'system'];

/** Nastaví téma; system ponechá rozhodnutí na CSS media query. */
export function setTheme(theme, options = {}) {
  return applyTheme(theme, componentOptions('theme', options));
}
function applyTheme(theme, { root = document.documentElement, storage, ...config }) {
  if (!config.persist) storage = null;
  if (!themes.includes(theme)) throw new TypeError(`Neznámé téma: ${theme}`);
  if (storage === undefined) { try { storage = globalThis.localStorage; } catch { storage = null; } }
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  try { storage?.setItem(config.storageKey, theme); } catch { /* Storage může být blokované. */ }
}

export function initTheme(options = {}) {
  const { root = document.documentElement, scope = document, storage: configuredStorage, ...config } = componentOptions('theme', options);
  let storage = configuredStorage;
  if (!config.persist) storage = null;
  // Přístup k localStorage může v omezeném prostředí vyhodit výjimku.
  if (storage === undefined) { try { storage = globalThis.localStorage; } catch { storage = null; } }
  let saved;
  try { saved = storage?.getItem(config.storageKey); } catch { /* Použij systémové téma. */ }
  applyTheme(themes.includes(saved) ? saved : config.default, { root, storage, ...config });
  const onClick = (event) => {
    const button = event.target.closest('[data-theme-toggle]');
    if (!button || !scope.contains(button)) return;
    const dark = root.getAttribute('data-theme') === 'dark' ||
      (!root.hasAttribute('data-theme') && globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches);
    applyTheme(dark ? 'light' : 'dark', { root, storage, ...config });
  };
  scope.addEventListener('click', onClick);
  return () => scope.removeEventListener('click', onClick);
}
