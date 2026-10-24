# Global configuration

`configurePure(patch)` sets defaults for future components. The lightweight entry has no DOM effects and does not load component implementations:

```js
import { configurePure, getPureConfig } from '@pure-ui/core/config';
// Direct file: ../dist/pure/js/config.js
configurePure({
  locale: 'auto', iconsUrl: '/assets/pure/icons.svg',
  theme: { default: 'system', persist: true, storageKey: 'app-theme' },
  search: { delay: 250, minLength: 2, limit: 8 },
  upload: { maxSize: 5 * 1024 * 1024 },
  editor: { features: { headings: true, images: true } },
});
```

Also exported by the lazy and main entries. The main entry loads all static modules; use config or lazy for a lightweight start.

## Priority and lifetime

Pure defaults < global settings < instance options. Nested objects merge; undefined preserves the previous value. null disables an editor adapter. Repeated calls update only supplied settings. Unknown keys or invalid values throw; invalid patches leave configuration unchanged.

Both functions return detached copies. Configuration does not rebuild existing UI. Set defaults at startup, before constructing components or opening addons. Standalone calls such as setTheme() and ensureStyles() use current configuration.

Defaults are shared within one ESM instance. On a server, do not change them per HTTP request: pass user-specific options to each instance. Editor content, field values, DOM targets and CSS tokens are not configuration settings.

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `locale` | `'auto'` | html lang, or en if absent; may be an explicit supported locale tag. |
| `messages` | `{}` | Flat string dictionary. Built-in UI has cs/en, otherwise English fallback. |
| `iconsUrl` | Sprite beside distributed modules | Shared icon URL; editor and resize allow local overrides. |
| `styles.auto` | `true` | Automatic CSS in lazy loader, editor and library; instance styles takes priority. |
| `styles.baseUrl` | Distributed css/ directory | Relative URLs resolve against the document at configuration time. |
| `theme.default` | `'system'` | initTheme fallback when no valid stored choice exists. |
| `theme.scheme` | `'default'` | Named palette defined by application CSS. |
| `theme.persist` | `true` | Read/write mode and scheme storage. |
| `theme.storageKey` | `'pure-theme'` | Mode storage key; theme APIs also accept local options. |
| `theme.schemeStorageKey` | `'pure-scheme'` | Separate scheme key, distinct from storageKey. |
| `search.delay`, `minLength`, `limit` | `250`, `2`, `8` | Delay in ms, minimum query length and maximum suggestions. |
| `upload.accept` | `''` | Default accepted files; a nonempty input accept attribute wins. |
| `upload.maxFiles`, `maxSize` | `Infinity`, `Infinity` | Count and bytes per file. Single inputs always allow at most one file. |
| `upload.prepareFile` | `null` | Optional async `(file,{signal}) => File` before upload output validation; inherited by upload, editor and library. Use separate input/pixel bounds in the preparation implementation. [Details](image-preparation.md). |
| `editor.features` | `{headings:false, images:false, fullscreen:true, lists:true}` | Available editor features. |
| `editor.uploadImage` | `null` | Upload callback with the same contract as local options. |
| `editor.mediaLibrary` | `null` | Library adapter object; local objects merge. |
| `mediaLibrary.pageSize` | `12` | Media per page. |
| `flash.duration` | `0` | Milliseconds; zero disables automatic dismissal. |
| `modal.closeOnBackdrop` | `true` | Backdrop dismissal; editor fullscreen forces false. |
| `data.pageSize` | `20` | Default data-controller/table/list page size. |
| `pagination.siblings` | `1` | Neighboring pages on each side, 0..10. |
| `tabs.activation`, `orientation` | `'auto'`, `'horizontal'` | auto/manual activation and horizontal/vertical direction. |
| `navigation.match`, `closeOnSelect` | `'path'`, `true` | path/exact active URL match and close after selection. |

Editor/library image uploads keep their supported image types and single-file behavior. They use upload.maxSize; Infinity retains their 10 MiB default. Standalone validateFiles() remains a pure function with explicit limits.

## Instance overrides and adapters

```js
configurePure({ editor: {
  uploadImage: async (file, { signal }) => {
    const response = await fetch('/api/media', { method: 'POST', body: file, signal });
    if (!response.ok) throw new Error('Upload failed');
    return response.json(); // { id, src }
  },
  mediaLibrary: { load: async ({ query, page, pageSize, signal }) => { /* Your API */ } },
} });
const { createEditor } = await loadComponent('editor');
const editor = createEditor(textarea, { locale: 'en', features: { images: false }, mediaLibrary: null });
await editor.ready;
```

A CSS base URL changes styles only: JavaScript still resolves relative to its ESM entry. styles.auto:false does not disable explicit ensureStyles(). A manually linked full bundle is still recognized. Set padding, colors and dimensions through CSS tokens. [Example](../examples/lazy.html).
