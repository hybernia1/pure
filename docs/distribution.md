# Distribution and on-demand loading

## Partial application CSS bundles

Applications may concatenate the styles required by their initial layout and declare their exact contents:

```html
<link rel="stylesheet" href="/assets/shell.css"
      data-pure-styles="tokens base components navigation forms controls">
```

`ensureStyles` waits for that bundle and skips separate requests for the declared names. Missing components still load individually. Include every declared file and its dependencies in the actual bundle; the attribute is a contract, not CSS inspection. Preserve Pure's layer order, put layout-critical CSS in the head, and do not mark a partial bundle as `all`. Failed partial bundles can fall back to individual component files on retry. JavaScript module boundaries and lazy initialization remain unchanged. HTTP compression and appropriate production cache headers belong to the application's asset server.

## Readable and minified output

Using either prebuilt tree requires no Node.js, npm or build tool. Copy it into your application and serve it over HTTP using your existing web server. The Node commands below apply only when developing Pure or rebuilding its files.

`npm ci` installs build tooling. `npm run build` generates two self-contained variants using esbuild transform API without bundling. There are no runtime dependencies. Minification preserves ESM exports, function names, object properties, dynamic imports and import.meta.url. JavaScript syntax targets ES2022 without polyfills; the SVG sprite is copied with symbol IDs intact.

```text
dist/
  pure/         readable distribution
    css/
    js/
    icons.svg
    pure.css
  pure.min/     same structure, minified, no source maps
```

The root contains only these two trees. Package imports stay stable through package.json exports. Deploy the selected complete tree.

```js
import { loadComponent } from '/dist/pure.min/js/lazy.js';
// Package: import { loadComponent } from '@pure-ui/core/min/lazy';
const { createEditor } = await loadComponent('editor');
const editor = createEditor(document.querySelector('#content'));
await editor.ready;
```

CSS and icons resolve inside the same variant. Direct production paths include `/dist/pure.min/pure.css`, `/dist/pure.min/css/forms.css` and `/dist/pure.min/icons.svg`. Package equivalents include `@pure-ui/core/min/pure.css` and `@pure-ui/core/min/js/editor.js`; the static main entry is `@pure-ui/core/min`. [Example](../examples/minified.html).

Choose one JS variant per application: mixing readable/minified graphs creates separate configuration instances and CSS registries. Applications with their own bundler can use readable exports and minify their final chunks.

Production dist has no .map files or sourceMappingURL comments. Build does not generate them and check:dist rejects them. Debug using dist/pure or src. Minification complements gzip/Brotli, caching and lazy loading rather than replacing them. [Measured sizes](minification.md).

## Loading components

Additional lazy names: `tag-picker` (its CSS and search/control dependencies) and `image` (standalone browser preparation, no CSS). Image processing is not imported by ordinary upload/editor modules; request it explicitly inside an optional prepareFile callback. [Tag picker](tag-picker.md) - [Image preparation](image-preparation.md).

The frontend chooses when a component is needed. Pure's lightweight lazy.js loads its JavaScript, dependencies and CSS. Initialization remains explicit, without automatic DOM scanning.

```js
import { loadComponent } from './dist/pure/js/lazy.js';
// Package: @pure-ui/core/lazy
button.addEventListener('click', async () => {
  const { createEditor } = await loadComponent('editor');
  const editor = createEditor(textarea, { features: { images: true } });
  await editor.ready;
});
```

`loadComponent(name, { document, styles = true })` resolves to the original ESM module after required CSS is ready. Concurrent/repeated loads share native module caching and CSS links; they do not initialize another instance. Names are explicit, not arbitrary paths.

Supported names: theme, disclosure, ajax, forms, select, picker, modal, upload, resize, editor, media-library, search, flash, activity, progress, drag-drop, data, table, list, pagination, tabs, navigation. Data needs no DOM/CSS. Table/list/pagination share data.css.

AJAX imports its HTML sanitizer only for explicit HTML loads; JSON/text requests do not need it. It rechecks request freshness after import. File validation is separate from upload UI, so libraries need not load createUpload just to validate files. Search does not load the editor.

`ensureStyles('search', { document })` also accepts an array of CSS module names, including utilities. It adds dependencies and layers automatically and rejects unknown names.

## CSS and bundlers

CSS resolves from the selected tree's js/ to css/; preserve the sibling icons.svg. Each document has a separate CSS cache. Shared styles remain after component destroy. Removing UI does not unload browser ES modules.

A linked pure.css suppresses duplicate component CSS. Mark a custom complete bundle with `<link rel="stylesheet" href="app.css" data-pure-styles="all">` only if it includes all Pure styles. Individual links are recognized by absolute URL. Pending CSS waits for load; errors or a 15s timeout reject. Failed links owned by Pure are removed so a later call can retry; foreign links are retained.

When the application bundles CSS itself:

```js
const { createEditor } = await loadComponent('editor', { styles: false });
const editor = createEditor(textarea, { styles: false });
```

These are separate loader and component options. Editor/library styles:false also disables their internal CSS requests. Supply all addon styles yourself, including modal, upload and library CSS. Direct editor imports still ensure base CSS by default; other direct modules require manually linked styles or loadComponent.

The shared index.js exposes every static export. Browsers load its entire static graph even if only one function is used. Importing loadComponent through index.js does not avoid that. sideEffects metadata helps bundlers but does not tree-shake browser modules. Full pure.css remains available as one file.

## Editor addon boundaries

| Part | First loaded |
| --- | --- |
| Model, text, statistics, translations, block dragging | Core editor.js |
| Heading style select | Initialization with headings enabled |
| Resize | First rendered image with images enabled |
| Link modal | First link opening, without upload UI |
| Image modal, selects, upload | First image modal opening |
| Media library and its CSS | Library button activation |
| Fullscreen modal | First fullscreen activation |

images:true on an empty editor does not load the image modal or resize. Opening an image modal does not initialize the library. Module code is shared via ESM cache; each editor owns its DOM and dialog state.

## Asynchronous readiness

createEditor returns synchronously. JSON/text commands work immediately. `await editor.ready` waits for base CSS and currently requested select/resize addons; it can be awaited again after setJSON adds an image. It does not preload future dialogs. Footer statistics and JSON do not depend on opening a modal.

```js
await editor.openDialog('link');
await editor.openDialog('image');
await editor.command('fullscreen');
```

openDialog returns true when opened, false for disabled features or canceled/stale operations. JSON, heading, bold, italic, image, moveBlock, removeBlock, undo and redo stay synchronous. Await programmatic fullscreen. Pure handles waiting for clicks/shortcuts internally; do not inspect a dialog synchronously in the same turn as a UI click.

Repeated clicks share loading and open only the latest operation. setJSON/reset/destroy invalidate pending openings; destroyed UI cannot reappear. Destroying one instance does not cancel shared module downloads. UI loading failure emits a translated status and `pure:load-error` on the textarea with the original error in detail. Direct API Promises may reject; catch them and offer retry as with loadComponent.

Standalone libraries accept styles, and `await library.open()` waits for CSS and items. Closing/destroying during loading prevents late opening. Upload/load adapter contracts are unchanged.

## Verification

[Lazy example](../examples/lazy.html), [UI tests](../test/browser.html), [network tests](../test/lazy.html). Add ?min to browser suite URLs to test the minified graph. Resource Timing checks actual loaded assets and ready stylesheets. Node tests cover CSS deduplication, document isolation, failure/retry, existing bundles and DOM-free imports with styles:false.

Historical loading measurements are in the release audits. Run npm run audit:size for current static-graph sizes; these are sums of individually compressed files, not all addons or HTTP overhead. check:dist verifies both trees, exports and the absence of source maps.

See [delivery experiments](performance-experiments.md) for the recorded equal-preload application comparison and its limitations. Experimental preload hints are not an automatic feature of the current release.
