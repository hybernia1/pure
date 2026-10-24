# SVG icons

The sprite is `dist/pure/icons.svg` (or `dist/pure.min/icons.svg`). Symbol IDs include home, user, menu, close, sun, moon, arrow-right, check, search, settings, bold, italic, link, unlink, undo, redo, mail, lock, eye, eye-off, calendar, clock, chevron-down, chevron-left, chevron-right, list, list-bullet, list-ordered, image, expand, shrink and resize. `src/icons.svg` is the complete source of available IDs.

```html
<svg class="icon" aria-hidden="true"><use href="/dist/pure/icons.svg#home"></use></svg>
```

Icons inherit text color and default to 1.25em. Customize size with CSS. Serve the external sprite from the same origin over HTTP. An icon next to text is decorative (`aria-hidden="true"`). Give icon-only buttons an accessible name:

```html
<button class="button" type="button" aria-label="User account">
  <svg class="icon" aria-hidden="true"><use href="/dist/pure/icons.svg#user"></use></svg>
</button>
```

Add new symbols to `src/icons.svg`: unique ID, `viewBox="0 0 24 24"`, no fixed colors. Fill, stroke and line endings inherit from `.icon`. Update documentation and examples, then rebuild.
