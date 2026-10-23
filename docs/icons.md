# SVG ikony

Sprite `dist/icons.svg` obsahuje symboly `home`, `user`, `menu`, `close`, `sun`, `moon`, `arrow-right`, `check`, `search`, `settings`, `bold`, `italic`, `link`, `unlink`, `undo`, `redo`, `mail`, `lock`, `eye`, `eye-off`, `calendar`, `clock`, `chevron-down`, `chevron-left`, `chevron-right`, `list`, `image`, `expand`, `shrink`.

```html
<svg class="icon" aria-hidden="true"><use href="/dist/icons.svg#home"></use></svg>
```

Ikony přebírají barvu textu. Velikost je 1.25em; změň ji pomocí vlastního CSS. Externí sprite servíruj ze stejného originu přes HTTP. Ikona u textu je dekorativní (`aria-hidden="true"`). Tlačítku pouze s ikonou dej přístupný název:

```html
<button class="button" type="button" aria-label="Uživatelský účet">
  <svg class="icon" aria-hidden="true"><use href="/dist/icons.svg#user"></use></svg>
</button>
```

Nový symbol přidej do `src/icons.svg`. ID musí být jedinečné, viewBox 0 0 24 24, geometrie bez pevných barev. `fill`, `stroke` a zakončení čar dědí `.icon`. Potom doplň tento seznam, ukázku a spusť build.
