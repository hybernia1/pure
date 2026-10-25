# Pure

[![CI](https://github.com/hybernia1/pure/actions/workflows/ci.yml/badge.svg)](https://github.com/hybernia1/pure/actions/workflows/ci.yml) [![Release](https://img.shields.io/github/v/release/hybernia1/pure)](https://github.com/hybernia1/pure/releases/latest) [![MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

[Live examples](https://hybernia1.github.io/pure/) - [Releases](https://github.com/hybernia1/pure/releases) - [Contributing](CONTRIBUTING.md) - [Issues](https://github.com/hybernia1/pure/issues)

A compact, modular CSS, JavaScript and SVG framework. Tailwind-style utilities, neutral colors, explicit initialization and no runtime dependencies.

## Use in your project - no Node.js required

Download the [v1.5.0 minified files](https://github.com/hybernia1/pure/releases/download/v1.5.0/pure-1.5.0.min.zip), [readable files](https://github.com/hybernia1/pure/releases/download/v1.5.0/pure-1.5.0.zip) or [source archive](https://github.com/hybernia1/pure/archive/refs/tags/v1.5.0.zip) and copy `dist/pure.min/` (minified) or `dist/pure/` (readable) into your project. The files are already built: **no Node.js, npm, bundler or build step is required to use Pure**.

Serve the files through your existing HTTP server (for example Apache, Nginx or your application's server). Pure's CSS and JavaScript run in the browser; ES modules and the external SVG sprite should be served over HTTP rather than opened through `file://`. The example paths below assume you copied the selected tree to `/assets/pure/`.

```html
<link rel="stylesheet" href="/assets/pure/pure.css">
<section class="container py-4 dt:py-8">
  <div class="grid grid-cols-1 dt:grid-cols-3 gap-4">
    <article class="card">Your content</article>
  </div>
</section>
```

## Distributions

```text
dist/
  pure/       readable CSS, ES modules and icons.svg
  pure.min/   minified CSS, ES modules and icons.svg
```

Both directories are self-contained. Each also includes an optional self-contained `compact/` profile with bundled, split ES modules. The original ESM profile remains the default; compact is an alternative, not a guaranteed reduction in request count. Choose one JavaScript profile per page. Production output has no source maps. Keep the selected directory structure when deploying; lazy imports, styles and icons resolve relative to it.

```js
import { loadComponent } from '/assets/pure/js/lazy.js';
const { createEditor } = await loadComponent('editor');
const editor = createEditor(document.querySelector('#content'));
await editor.ready;
```

Use a textarea as the editor source and put JavaScript imports inside a `<script type="module">` or an application ES module. Importing a module never initializes UI automatically. The lazy entry loads only requested components and their CSS; editor dialogs, uploads and the media library load when used. Direct module imports are also available. The shared `js/index.js` entry loads the complete static graph in a browser.

Package exports such as `@pure-ui/core/lazy`, `@pure-ui/core/min/lazy` and `@pure-ui/core/css/tokens.css` work when the package is installed locally or from Git. The package is currently private to prevent accidental npm publication; this GitHub repository is the distribution source.

## Performance and verification

Version 1.4.0 includes incremental editor work, generated preload manifests and an optional compact delivery profile. The selected local formatting task improved from **18.2 ms to 12.7 ms** for 1,000 paragraphs, about 30%. Quill remained faster in that task.

| Desktop formatting task | 100 paragraphs | 1,000 paragraphs |
| --- | ---: | ---: |
| Pure 1.3.1 | 2.7 ms | 18.2 ms |
| Pure optimized, included in 1.4.0 | 2.3 ms | 12.7 ms |
| Bootstrap 5.3.8 + Quill 2.0.3 | 2.1 ms | 9.4 ms |
| Tailwind 4.3.3 + Quill 2.0.3 | 2.1 ms | 9.6 ms |

Medians of five run medians, 800 measured bold toggles overall, foreground Chrome with CPU 1x. This times synchronous editor API work after initialization, not page loading, native typing or INP. Bootstrap and Tailwind supply styling; Quill supplies their editor. These development lab results do not establish a universal framework winner.

The recorded **v1.4.0** minified editor static JavaScript graph was **22,979 B gzip** in original ESM and **22,490 B gzip** in compact, excluding CSS, icons, loaders and optional addons. Compact does not always reduce request count or Brotli size. See the [methodology, raw samples, graph sizes and limitations](docs/benchmarks/README.md). Reproduce build sizes with `node scripts/distribution-metrics.mjs` after building.

**75 Node tests**, generated-output verification and documentation-link checks run in CI on Node 22/24. Browser UI checks run manually in Chrome, including both compact variants; they are not cross-browser CI results. The [release checklist](docs/releasing.md) describes coverage.

Preload hints are opt-in and do not initialize components. Generate HTML hints from the exact built graph:

```sh
npm run --silent preload -- --compact --base=/assets/pure/ editor modal tabs flash select
```

This assumes the contents of `dist/pure.min/compact/` are deployed at `/assets/pure/`. Keep hints and files from the same release. [Distribution guide](docs/distribution.md) - [compact example](examples/compact.html).

## Features

Version 1.5.0 adds [formatted clipboard conversion](docs/editor-clipboard.md), a lazy [Markdown/HTML import modal](docs/editor-import.md) and model-based multi-block keyboard deletion. [Try the example](examples/clipboard.html).

Included optional modules: [WordPress-style post tags](docs/tag-picker.md), [optional browser image preparation](docs/image-preparation.md) and token-based `sticky top-*` / `dt:sticky` utilities. [Runnable example](examples/enhancements.html).

- Two layout viewports: mobile by default, desktop at 960px with `dt:` utilities.
- CSS tokens for compact spacing, dimensions, colors and custom light/dark schemes; no box shadows.
- Shared `error`, `success` and `info` states, flash messages, activity indicators and progress bars.
- Forms with internal icons, password visibility, custom date/time pickers, select controls, search suggestions and file uploads.
- Accessible modals, tabs, navigation, responsive tables, lists and pagination.
- JSON-only block editor with headings, lists, images, links, fullscreen, statistics, undo/redo and media adapters.
- Reusable drag-and-drop and resize services, independent of the editor.
- English and Czech UI dictionaries, with locale selected from the document or configuration.

## Documentation

Optional modules: [SVG charts](docs/chart.md) and the [JSON content renderer](docs/renderer.md). Try the [combined example](examples/content-chart.html) or [browser checks](test/content-chart.html); both support `?min`.

[Segmented controls](docs/segmented.md) provide compact native radio groups without JavaScript.

[Scrollbars](docs/scrollbar.md) optionally style native scrolling areas with semantic theme colors.

[Named colors](docs/colors.md) define shared color keys; templates supply their actual values.

[Lazy placeholders](docs/placeholder.md) reserve layout space while optional components load.

| Topic | Guide |
| --- | --- |
| Structure and CSS | [Architecture](docs/architecture.md), [CSS API](docs/css.md), [icons](docs/icons.md) |
| Loading and defaults | [Distribution](docs/distribution.md), [configuration](docs/configuration.md), [JavaScript](docs/javascript.md) |
| Appearance | [Light/dark modes and custom schemes](docs/themes.md) |
| Components | [States, flash and AJAX](docs/modules.md), [forms and modals](docs/forms.md), [activity and progress](docs/activity.md), [search](docs/search.md) |
| Editor | [Editor](docs/editor.md), [list blocks](docs/editor-lists.md), [media and localization](docs/editor-media-i18n.md) |
| Data and navigation | [Tables, lists and pagination](docs/data.md), [tabs](docs/tabs.md), [navigation](docs/navigation.md) |
| Shared interactions | [Drag and drop](docs/drag-drop.md), [resize](docs/resize.md) |
| Measurements | [Performance audit](docs/release-1.0-audit.md), [minification](docs/minification.md), [earlier audit](docs/release-audit.md) |

Runnable examples: [basic UI](examples/index.html), [modules and editor](examples/modules.html), [forms](examples/forms.html), [lazy loading](examples/lazy.html), [minified distribution](examples/minified.html), [themes](examples/themes.html), [data](examples/data.html), [tabs](examples/tabs.html), [navigation](examples/navigation.html). Existing demos use Czech sample content to exercise localization; API documentation is English.

## Development and checks

**Node.js 22+ and npm are needed only to develop Pure, rebuild its distribution, run its tests or use its optional demo server.** They are not required by a website using the built files.

```sh
git clone https://github.com/hybernia1/pure.git
cd pure
npm ci
npm run dev
```

Open http://localhost:3000 for local examples. To rebuild and verify changes:

```sh
npm test
npm run build
npm run check:dist
npm run check:docs
npm run audit:size
npm run bench
```

After starting the server, open `/test/browser.html` and `/test/lazy.html`. Add `?min` to test the minified distribution. Other browser suites cover data views, tabs, navigation, editor lists and themes. `/test/performance.html` displays a reproducible local benchmark. Timing results are measurements, not performance guarantees.

The local upload endpoint stores demo files in ignored `.pure/uploads`. Production applications must provide storage, authentication, authorization and server-side validation. See [contributor rules](AGENTS.md) and the [release checklist](docs/releasing.md).

## License

[MIT](LICENSE). Copyright (c) 2026 hybernia1.
