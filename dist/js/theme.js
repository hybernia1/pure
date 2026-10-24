import { componentOptions } from './config.js';
const themes = ['light', 'dark', 'system'];
const validScheme = scheme => typeof scheme === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(scheme);

/** Palette definitions stay in CSS; default removes the scheme override. */
export function setScheme(scheme, options = {}) {
  return applyScheme(scheme, componentOptions('theme', options));
}
function applyScheme(scheme, { root = document.documentElement, storage, ...config }) {
  if (!validScheme(scheme)) throw new TypeError('Invalid color scheme name.');
  if (!config.persist) storage = null;
  if (storage === undefined) { try { storage = globalThis.localStorage; } catch { storage = null; } }
  if (scheme === 'default') root.removeAttribute('data-scheme'); else root.setAttribute('data-scheme', scheme);
  try { storage?.setItem(config.schemeStorageKey, scheme); } catch { /* Storage may be blocked. */ }
}

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
  let saved; let savedScheme;
  try { saved = storage?.getItem(config.storageKey); } catch { /* Použij systémové téma. */ }
  try { savedScheme = storage?.getItem(config.schemeStorageKey); } catch { /* Use the configured scheme. */ }
  if (!validScheme(config.scheme)) throw new TypeError('Invalid color scheme name.');
  applyTheme(themes.includes(saved) ? saved : config.default, { root, storage, ...config });
  applyScheme(validScheme(savedScheme) ? savedScheme : config.scheme, { root, storage, ...config });
  const onClick = (event) => {
    const button = event.target.closest('[data-theme-toggle], [data-theme-set], [data-scheme-set]');
    if (!button || !scope.contains(button)) return;
    if (button.hasAttribute?.('data-scheme-set')) { applyScheme(button.getAttribute('data-scheme-set'), { root, storage, ...config }); return; }
    if (button.hasAttribute?.('data-theme-set')) { applyTheme(button.getAttribute('data-theme-set'), { root, storage, ...config }); return; }
    const dark = root.getAttribute('data-theme') === 'dark' ||
      (!root.hasAttribute('data-theme') && (root.ownerDocument?.defaultView || globalThis).matchMedia?.('(prefers-color-scheme: dark)').matches);
    applyTheme(dark ? 'light' : 'dark', { root, storage, ...config });
  };
  scope.addEventListener('click', onClick);
  return () => scope.removeEventListener('click', onClick);
}
