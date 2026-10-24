# CSS API

## Loading

Use `dist/pure/pure.css`, or load individual files in this order:

```html
<link rel="stylesheet" href="/dist/pure/css/tokens.css">
<link rel="stylesheet" href="/dist/pure/css/base.css">
<link rel="stylesheet" href="/dist/pure/css/components.css">
<link rel="stylesheet" href="/dist/pure/css/utilities.css">
```

`components.css` is optional. `tokens.css` declares layer order and must come first. Component styles go before utilities. The minified tree has the same structure under `dist/pure.min/`.

## Utilities

Position helpers: `static`, `relative`, `sticky`, `top-{step}`, `bottom-{step}`, `z-auto`, `z-sticky`, all with `dt:` variants. Insets use spacing tokens; z-sticky uses `--p-sticky-z` (10). Example: `<header class="sticky top-0 z-sticky bg-surface">...</header>`. Sticky requires a non-auto inset and is constrained by its containing/scrolling ancestors; parent overflow can change the scroll root. It does not need JavaScript and does not automatically add an is-sticky state. Keep focus/anchor targets visible below sticky headers. See [example](../examples/enhancements.html).

Every utility also has a desktop `dt:` variant, such as `hidden dt:flex` or `p-4 dt:p-8`. Mobile has no prefix. Desktop starts at exactly 960px.

| Area | Classes |
| --- | --- |
| Display | `block`, `flex`, `inline-flex`, `grid`, `hidden` |
| Flex | `flex-col`, `flex-row`, `flex-wrap`, `flex-1` |
| Alignment | `items-center`, `items-start`, `justify-between`, `justify-center` |
| Grid | `grid-cols-1` through `grid-cols-4` |
| Size | `w-full`, `min-w-0`, `mx-auto` |
| Text | `text-left`, `text-center`, `font-medium`, `font-semibold`, `leading-tight`, `no-underline` |
| Font size | `text-xs` (.75rem), `text-sm` (.875rem), `text-base` (1rem), `text-lg` (1.125rem), `text-xl` (1.5rem), `text-2xl` (2rem), `text-3xl` (3rem), `text-4xl` (4.5rem) |
| Colors | `text-default`, `text-subtle`, `bg-default`, `bg-surface`, `bg-muted` |
| Borders | `border`, `border-b`, `rounded`, `rounded-full` |

Spacing uses `--p-space-{step}` tokens, shared by utilities and components. Prefixes are `p`, `px`, `py`, `pt`, `pb`, `m`, `mx`, `my`, `mt`, `mb`, `gap`, followed by `-{step}`. Axes use logical inline/block properties.

| Step | rem | Step | rem |
| --- | --- | --- | --- |
| 0 | 0 | 8 | 2 |
| 1 | .25 | 10 | 2.5 |
| 2 | .5 | 12 | 3 |
| 3 | .75 | 16 | 4 |
| 4 | 1 | 20 | 5 |
| 5 | 1.25 | 24 | 6 |
| 6 | 1.5 | | |

Do not combine conflicting utilities at the same level (`p-4 p-8`). HTML class order does not control the CSS cascade.

## Components

| Class | Usage |
| --- | --- |
| `container` | Centered content constrained by `--p-container`, with `--p-gutter` |
| `button` | Button or link, minimum height 2.75rem |
| `button button-outline` | Secondary action |
| `card` | Bordered surface with compact padding and no shadow |
| `input` | Input, select or textarea; provide an explicit label |
| `badge` | Short text label |
| `icon` | SVG using currentColor |
| `sr-only` | Visually hidden accessible text |

## Themes and tokens

Use `<html data-theme="light">` or `<html data-theme="dark">`. Without the attribute, CSS follows the system. Define custom values through `--p-light-*` and `--p-dark-*`; independent `data-scheme` selects a named palette. Themes apply to the document root. See [themes](themes.md).

Semantic colors: `--p-bg`, `--p-surface`, `--p-muted`, `--p-text`, `--p-subtle`, `--p-border`, `--p-action`, `--p-on-action`, `--p-focus`, `--p-backdrop`. Other tokens include `--p-font`, `--p-radius`, `--p-radius-sm`, `--p-container`, `--p-space-*`, `--p-gutter`, `--p-panel-padding`, `--p-control-px`, `--p-control-py` and `--p-control-height`.

Cards and editors use `--p-panel-padding` (1rem); fields and buttons use `--p-control-px` (.75rem) and `--p-control-py` (.5rem). Touch controls remain at least 2.75rem high. Pure has no box shadows.

Optional styles include states, flash, editor, forms, controls, modal, upload, resize, activity, progress, search, drag-drop, media-library, data, tabs and navigation. The full `pure.css` includes them all.

Each of `error`, `success` and `info` has three tokens, such as `--p-error`, `--p-error-bg` and `--p-error-border`. Additional dimensions include `--p-editor-height` (10rem), `--p-editor-style-width` (11rem), `--p-select-height` (7rem), `--p-modal-width` (32rem), `--p-upload-preview` (3rem), `--p-picker-width` (18rem) and `--p-time-list-height` (10rem). Internal icons reserve space using the shared control height rather than individual padding values.
