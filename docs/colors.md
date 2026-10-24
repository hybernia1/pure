# Template-defined named colors

Pure defines sixteen shared names: `gray`, `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `pink`. **Core supplies no color values for these names.** The consuming template owns the corresponding `--p-gray`, `--p-red`, etc. CSS properties.

The [example palette](../examples/palette.css) defines all sixteen in light and dark modes, including system mode. [Palette labels](../examples/palette.js) supply the same sixteen choices to the example editor. Copy or adapt these template files; they are not part of core defaults. Ensure both files cover the colors you want to offer.

```css
/* Application / template CSS, not Pure defaults */
:root {
  --p-blue: #5279a8;
  --p-red: #b85c57;
  --p-green: #62815a;
}
:root[data-scheme="journal"] {
  --p-blue: #476a80;
}
```

Named colors have no automatic light/dark mapping. A template may keep values constant or override them by mode, scheme or local scope. Define only the names you use. Contrast and readable foreground/background combinations remain the template's responsibility.

Utilities are available in `css/utilities.css` and the complete bundle:

| Utility | Declaration | Missing template value |
| --- | --- | --- |
| `text-blue` | `color:var(--p-blue,var(--p-text))` | Semantic text color |
| `bg-blue` | `background:var(--p-blue,transparent)` | Transparent |
| `border-blue` | `border-color:var(--p-blue,var(--p-border))` | Semantic border color |

The same utilities exist for every shared name and their `dt:` desktop variants. `border-*` only changes color; add `border` to create a border.

```html
<span class="text-blue">A template-colored label</span>
<div class="border border-red">A template-colored border</div>
```

Semantic UI properties such as `--p-error`, `--p-action`, `--p-text` and `--p-bg` remain independent. `red` does not automatically mean an error, and no semantic token is replaced by a named color.

JavaScript can read the immutable list for application UI such as palette selectors:

```js
import { colorNames } from './pure/js/colors.js';
// Or: const { colorNames } = await loadComponent('colors');
// Sixteen immutable keys, without color values.
```

This list has no DOM effects, color values or scheme registry. A palette selector should explicitly offer the names its template supports, using translated labels supplied by the application. It is not necessary to scan stylesheets. The [editor color picker](editor.md#text-colors) uses these names as validated JSON text marks.

See [themes](themes.md) and the [named colors example](../examples/colors.html).
