const themes = ['light', 'dark', 'system'];

/** Nastaví téma; system ponechá rozhodnutí na CSS media query. */
export function setTheme(theme, { root = document.documentElement, storage } = {}) {
  if (!themes.includes(theme)) throw new TypeError(`Neznámé téma: ${theme}`);
  if (storage === undefined) { try { storage = globalThis.localStorage; } catch { storage = null; } }
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  try { storage?.setItem('pure-theme', theme); } catch { /* Storage může být blokované. */ }
}

export function initTheme({ root = document.documentElement, scope = document, storage } = {}) {
  // Přístup k localStorage může v omezeném prostředí vyhodit výjimku.
  if (storage === undefined) { try { storage = globalThis.localStorage; } catch { storage = null; } }
  let saved;
  try { saved = storage?.getItem('pure-theme'); } catch { /* Použij systémové téma. */ }
  setTheme(themes.includes(saved) ? saved : 'system', { root, storage });
  const onClick = (event) => {
    const button = event.target.closest('[data-theme-toggle]');
    if (!button || !scope.contains(button)) return;
    const dark = root.getAttribute('data-theme') === 'dark' ||
      (!root.hasAttribute('data-theme') && globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches);
    setTheme(dark ? 'light' : 'dark', { root, storage });
  };
  scope.addEventListener('click', onClick);
  return () => scope.removeEventListener('click', onClick);
}
