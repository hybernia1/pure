# Colors, modes and custom schemes

Pure separates **mode** (light, dark, system) from **scheme** (default or an application name). Each scheme can define light and dark palettes. Components read the same semantic variables; colors are not duplicated in JavaScript configuration.

[Example](../examples/themes.html) - [Scheme CSS](../examples/themes.css) - [Computed-color tests](../test/themes.html)

## Override default palettes

Load your own CSS after Pure instead of editing distribution files:

```css
:root {
  --p-light-bg: #f5f4f1;
  --p-light-surface: #ffffff;
  --p-light-text: #292722;
  --p-dark-bg: #1c1b18;
  --p-dark-surface: #26241f;
  --p-dark-text: #efebe2;
}
```

Pure maps the active palette to --p-bg, --p-surface, --p-text and other semantic tokens. data-theme="light" or "dark" forces a mode; without the attribute, prefers-color-scheme controls it. Native inputs and scrollbars use the corresponding CSS color-scheme.

## Named schemes

```css
:root[data-scheme="stone"] {
  --p-light-bg: #f4f1eb;
  --p-light-surface: #fffdf8;
  --p-light-text: #302b25;
  --p-light-action: #504537;
  --p-light-on-action: #fffdf8;
  --p-dark-bg: #201d18;
  --p-dark-surface: #29251f;
  --p-dark-text: #f1e9dd;
  --p-dark-action: #e7d7bf;
  --p-dark-on-action: #29251f;
}
```

```html
<html data-scheme="stone" data-theme="dark">
```

Do not duplicate component definitions, media queries or every token. Omitted colors inherit defaults. Schemes apply to the document root, not nested themed islands. Direct semantic overrides remain possible; use palette tokens for separate light/dark values.

Every name below exists with both --p-light- and --p-dark- prefixes:

| Names | Meaning |
| --- | --- |
| bg, surface, muted | Page, primary and secondary surfaces |
| text, subtle, border | Primary text, secondary text and borders |
| action, on-action, focus | Action surface, its text and visible focus |
| backdrop | Modal backdrop |
| error, error-bg, error-border | Error state |
| success, success-bg, success-border | Success state |
| info, info-bg, info-border | Information state |

Spacing, fonts, dimensions and radii keep their existing independent tokens. Match text/surface and action/on-action contrast. States must include text as well as color.

## JavaScript and persistence

```js
import { initTheme, setTheme, setScheme } from '@pure-ui/core/js/theme.js';
const cleanup = initTheme();
setScheme('stone');
setTheme('dark');
setTheme('system'); // Keep stone, follow the system mode.
setScheme('default'); // Remove data-scheme, keep the mode.
```

`setScheme(name, options = {})` updates only the attribute and stored name. Names match `[a-z][a-z0-9-]{0,63}`. Reserved default removes the attribute. There is no JS registry: applications provide CSS for any number of schemes. Missing scheme CSS falls back to defaults; the API neither validates stylesheet existence nor downloads it.

Both setters accept root, storage, persist and storage keys, like global theme defaults. initTheme restores both choices, attaches delegated buttons and returns listener cleanup; cleanup does not restore original appearance. System preference changes are handled by CSS without another JS listener.

```js
configurePure({ theme: {
  default: 'system', scheme: 'stone', persist: true,
  storageKey: 'app-mode', schemeStorageKey: 'app-scheme',
} });
```

Configuration itself does not load CSS or initialize UI. Valid stored values win over defaults. persist:false disables both reads and writes; blocked storage does not break UI. Keep keys distinct. Pass consistent options to standalone setters when using a local root.

```html
<button type="button" data-theme-toggle>Toggle light/dark</button>
<button type="button" data-theme-set="system">System</button>
<button type="button" data-scheme-set="stone">Stone</button>
<button type="button" data-scheme-set="default">Pure</button>
```

The light/dark toggle preserves the scheme. These attributes attach behavior to existing buttons; the application can display current state from root attributes. Importing the module has no DOM effects.

## First paint

For server-selected appearance, put both attributes in HTML before CSS loads and configure matching defaults if calling initTheme afterward. To restore localStorage before styles and avoid flashing, use a small application script with your storage keys and an appropriate CSP nonce:

```html
<script>
  try {
    const root = document.documentElement;
    const mode = localStorage.getItem('pure-theme');
    const scheme = localStorage.getItem('pure-scheme');
    if (mode === 'light' || mode === 'dark') root.dataset.theme = mode;
    else if (mode === 'system') root.removeAttribute('data-theme');
    if (scheme && scheme !== 'default' && /^[a-z][a-z0-9-]{0,63}$/.test(scheme)) root.dataset.scheme = scheme;
    else if (scheme === 'default') root.removeAttribute('data-scheme');
  } catch {}
</script>
```

The same palette definitions work without JavaScript, with individual styles or with full pure.css.
