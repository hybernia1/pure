# CSS API

## Zapojení

Použij `dist/pure.css`, nebo jednotlivé soubory v tomto pořadí:

```html
<link rel="stylesheet" href="/dist/css/tokens.css">
<link rel="stylesheet" href="/dist/css/base.css">
<link rel="stylesheet" href="/dist/css/components.css">
<link rel="stylesheet" href="/dist/css/utilities.css">
```

`components.css` můžeš vynechat. `tokens.css` deklaruje pořadí vrstev a musí být první.

## Utility

Každá utility má i desktop variantu `dt:`, například `hidden dt:flex` nebo `p-4 dt:p-8`. Mobile nemá prefix. Desktop začíná přesně na 960 px.

| Oblast | Třídy |
| --- | --- |
| Display | `block`, `flex`, `inline-flex`, `grid`, `hidden` |
| Flex | `flex-col`, `flex-row`, `flex-wrap`, `flex-1` |
| Zarovnání | `items-center`, `items-start`, `justify-between`, `justify-center` |
| Grid | `grid-cols-1` až `grid-cols-4` |
| Velikost | `w-full`, `min-w-0`, `mx-auto` |
| Text | `text-left`, `text-center`, `font-medium`, `font-semibold`, `leading-tight`, `no-underline` |
| Písmo | `text-xs` (.75rem), `text-sm` (.875rem), `text-base` (1rem), `text-lg` (1.125rem), `text-xl` (1.5rem), `text-2xl` (2rem), `text-3xl` (3rem), `text-4xl` (4.5rem) |
| Barvy | `text-default`, `text-subtle`, `bg-default`, `bg-surface`, `bg-muted` |
| Okraje | `border`, `border-b`, `rounded`, `rounded-full` |

Spacing čerpá z tokenů `--p-space-{krok}`; tabulka uvádí výchozí hodnoty. Přepsání tokenu ovlivní utility i komponenty.

Spacing: `p`, `px`, `py`, `pt`, `pb`, `m`, `mx`, `my`, `mt`, `mb`, `gap` + `-{krok}`. Osy používají logické inline/block vlastnosti.

| Krok | rem | Krok | rem |
| --- | --- | --- | --- |
| 0 | 0 | 8 | 2 |
| 1 | .25 | 10 | 2.5 |
| 2 | .5 | 12 | 3 |
| 3 | .75 | 16 | 4 |
| 4 | 1 | 20 | 5 |
| 5 | 1.25 | 24 | 6 |
| 6 | 1.5 | | |

Nekombinuj protichůdné utility stejné úrovně (`p-4 p-8`); pořadí tříd v HTML nerozhoduje o CSS kaskádě.

## Komponenty

| Třída | Použití |
| --- | --- |
| `container` | Centrovaný obsah do --p-container s okrajem --p-gutter |
| `button` | Odkaz nebo tlačítko, výška alespoň 2.75rem |
| `button button-outline` | Sekundární tlačítko |
| `card` | Povrch, ohraničení a kompaktní padding bez stínu |
| `input` | Input, select nebo textarea; label přidej explicitně |
| `badge` | Krátký textový štítek |
| `icon` | SVG kreslené přes currentColor |
| `sr-only` | Vizuálně skrytý přístupný text |

## Témata a tokeny

`<html data-theme="light">` / `<html data-theme="dark">`. Bez atributu rozhoduje systém. Témata jsou určena pro kořen dokumentu.

Barvy: `--p-bg`, `--p-surface`, `--p-muted`, `--p-text`, `--p-subtle`, `--p-border`, `--p-action`, `--p-on-action`, `--p-focus`. Ostatní: `--p-font`, `--p-radius`, `--p-container`, `--p-space-*`, `--p-gutter`, `--p-panel-padding`, `--p-control-px`, `--p-control-py`, `--p-control-height`, `--p-radius-sm`. Přepisuj sémantické tokeny místo přidávání barevných odstínů do komponent.

## Kompaktní výchozí rozestupy

Karta a editor používají `--p-panel-padding` (1rem), pole a tlačítka `--p-control-px` (.75rem) a `--p-control-py` (.5rem). Mezery patří do společné škály, žádný komponentový padding není zapečený. Dotyková výška ovladačů zůstává alespoň 2.75rem. Stíny nejsou součástí Pure.

Volitelné moduly připoj po components.css: `states.css`, `flash.css`, `editor.css`; před utilities.css. Kompletní pure.css je obsahuje automaticky. API: [stavy a moduly](modules.md).

Editor má samostatný token `--p-editor-height` (10rem). Stavové barvy mají pro každý z `error`, `success`, `info` trojici tokenů: `--p-error`, `--p-error-bg`, `--p-error-border` (analogicky pro ostatní stavy).

Formulářové moduly: `forms.css`, `modal.css`, `upload.css` se připojují stejným způsobem před utilities.css. Tokeny: `--p-select-height` (7rem), `--p-modal-width` (32rem), `--p-upload-preview` (3rem), `--p-backdrop`. Komponenty a příklady: [formuláře](forms.md).

`controls.css` přidává jednotné vnitřní ikony (`control`, `control-icon`, `control-action`), `icon-button`, vlastní nabídky a kalendář. Tokeny `--p-picker-width` (18rem) a `--p-time-list-height` (10rem) řídí rozměry. Ikony mají prostor podle stejného `--p-control-height`, nikoli individuálních paddingů.

Editor nově používá `--p-editor-style-width` (11rem) pro ovládání nadpisů, procentní šířky obrázků a `.editor-fullscreen` pro celý viewport. Moduly a schéma: [editor](editor.md).
