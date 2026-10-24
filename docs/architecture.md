# Architecture

Pure combines small utilities with optional components. It does not scan HTML to compile classes, generate runtime CSS or initialize JavaScript automatically. The complete utility set is generated at build time and can be used in dynamically created HTML.

## Files

| Path | Purpose |
| --- | --- |
| `src/css/tokens.css` | Semantic variables, palettes and layer order |
| `src/css/base.css` | Reset, typography, focus and reduced motion |
| `src/css/components.css` | Optional base components |
| `scripts/utilities.mjs` | Single source for utility classes and the layout breakpoint |
| `src/js/` | Independent ES modules |
| `src/js/editor-model.js` | DOM-independent JSON schema and text operations |
| `src/js/editor.js` | Editor UI over the JSON model |
| `src/js/editor-dialog.js` | Link and image modals |
| `src/icons.svg` | SVG symbols |
| `dist/pure/` | Generated readable distribution |
| `dist/pure.min/` | Generated minified distribution, without source maps |
| `examples/` | Runnable documentation |

## Layers and customization

`tokens.css` declares `tokens, base, components, utilities` in that order. Utilities can override components. Customize appearance through `--p-*` tokens or a later application layer. Avoid `!important` except for hidden elements and reduced-motion rules.

Mobile is the default. The only layout breakpoint is `min-width: 960px`; `dt:` utilities apply from that width, for example `flex-col dt:flex-row`. System theme and reduced-motion queries do not introduce extra layout viewports.

Initialize a JavaScript module once per scope. Before reattaching it, call the returned cleanup function or the instance's `destroy()` method. Static components do not require JavaScript.

## Scope

Pure includes layout, spacing, typography, buttons, inputs, cards, badges, themes, disclosure, shared states, flash, a JSON editor, AJAX, forms, modals and uploads. Date/time and select controls use custom top-layer UI over original form fields; calendar calculations live in `calendar.js`. Data controllers, tables, lists, pagination, tabs, navigation, search, activity, progress, drag-and-drop and resize are separate modules. Tooltips are not included. See [modules](modules.md) and [forms](forms.md).
