# JavaScript API

```js
import { initTheme, setTheme, initDisclosures } from '/dist/pure/js/index.js';
const destroyTheme = initTheme();
const destroyDisclosures = initDisclosures();
// When removing the screen:
// destroyTheme(); destroyDisclosures();
```

For lightweight pages, import the relevant module directly or use [lazy loading](distribution.md). The shared index loads every static dependency in a browser.

## Theme

Colors stay in CSS. [Custom palettes](themes.md) provide independent `setScheme(name, options)` and `theme.scheme` / `theme.schemeStorageKey` defaults. `initTheme()` restores both choices and supports `[data-theme-toggle]`, `[data-theme-set]` and `[data-scheme-set]` buttons.

`initTheme({ root, scope, storage } = {})` restores a valid stored mode from `pure-theme`, otherwise uses the configured default/system mode, and attaches a delegated click listener. It returns cleanup. Defaults are `document.documentElement` and `document`. Blocked storage does not prevent interaction.

```html
<button class="button button-outline" data-theme-toggle type="button">Toggle light/dark</button>
```

`setTheme('light' | 'dark' | 'system', { root, storage } = {})` sets and persists a mode. `system` removes the attribute so CSS controls appearance. Invalid values throw TypeError. The toggle alternates between light and dark based on current appearance; call `setTheme('system')` to return to the system preference.

## Disclosure

`initDisclosures(scope = document)` connects `[data-disclosure]` buttons to panels through `aria-controls`. `aria-expanded="true"` sets the initial open state; otherwise the panel starts closed. Missing panels are skipped. Returned cleanup removes listeners and keeps the current panel state.

```html
<button type="button" data-disclosure aria-controls="details" aria-expanded="false">Details</button>
<div id="details" hidden>Panel content</div>
```

Use a native button for Enter/Space support. Escape inside an open panel closes it and returns focus to the trigger. This is disclosure content, not an ARIA menu; focus is not trapped. Initializers are not idempotent: clean up before reinitializing.

## Other modules

`createFlash`, `createEditor`, `request`, `createLoader`, `HttpError` and `states` are exported by index.js and their modules. See [states, editor and AJAX](modules.md).

Form APIs include `createForm`, `initInputs`, `initPasswords`, `createPicker`, `initPickers`, `createSelect`, `initSelects`, `createModal`, `initModals`, `createUpload` and `validateFiles`. Custom date/time/select controls require explicit initialization; without it, source fields remain native. See [forms](forms.md) for FormData and cleanup behavior.
