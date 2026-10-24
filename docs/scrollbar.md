# Scrollbars

Optional CSS styling of native vertical and horizontal scrollbars. No replacement tracks, pointer handlers or JavaScript scrolling: wheel, touch, keyboard and browser behavior remain native.

Load tokens/base and `css/scrollbar.css`, include the complete `pure.css`, or load on demand:

```js
import { ensureStyles } from './pure/js/lazy.js';
await ensureStyles('scrollbar');
```

Apply `.scrollbar` to one scrolling element:

```html
<div class="scrollbar scrollbar-stable" tabindex="0" role="region" aria-label="Activity"
     style="max-height:16rem;overflow:auto">
  <!-- Content -->
</div>
```

Apply `.scrollbars` to a container to style it and all its descendants. For the page and all nested areas, use `<html class="scrollbars">`. Loading CSS alone does not opt in. `.scrollbar-stable` separately reserves space for classic scrollbars to reduce layout shifts; overlay scrollbars may reserve no space. The classes do not set overflow or dimensions.

Native `scrollbar-color` and `scrollbar-width:thin` are preferred, with WebKit pseudo-element fallback for engines lacking scrollbar-width. Platform settings control overlay visibility, exact dimensions and whether styling is shown. Touch devices may show only system scroll indicators. Forced-colors mode restores automatic width/colors and system fallback colors.

Optional inherited CSS properties:

| Property | Default | Purpose |
| --- | --- | --- |
| `--p-scrollbar-thumb` | `--p-subtle` | Thumb color |
| `--p-scrollbar-track` | `--p-muted` | Track and corner color |
| `--p-scrollbar-hover` | `--p-text` | Thumb hover color in WebKit fallback only |
| `--p-scrollbar-size` | `--p-space-3` | Thickness in WebKit fallback only |

Semantic tokens follow light/dark and custom schemes. Browsers supporting the standard API choose the thickness of `thin` and manage hover themselves. Avoid low-contrast overrides or hiding scrollbars. Give noninteractive scrolling areas a descriptive accessible name and `tabindex="0"` when keyboard access is needed; do not add redundant tab stops to textareas or existing interactive controls.

See the [live example](../examples/scrollbar.html), including nested areas, a textarea and horizontal overflow. Add `?min` to test the minified distribution.
