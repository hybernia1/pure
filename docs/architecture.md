# Architektura

## Princip

Pure kombinuje malé utility a několik volitelných komponent. Nepoužívá kompilaci tříd z HTML, pluginy, runtime CSS ani automatickou inicializaci JS. Kompletní sada utilit se generuje při buildu. Třídy lze použít i v dynamicky tvořeném HTML.

## Soubory

| Cesta | Účel |
| --- | --- |
| `src/css/tokens.css` | Sémantické proměnné a témata |
| `src/css/base.css` | Reset, typografie, focus, reduced motion |
| `src/css/components.css` | Volitelné komponenty |
| `scripts/utilities.mjs` | Jediný zdroj utility API a breakpointu |
| `src/js/` | Nezávislé ES moduly |
| `src/js/editor-model.js` | Čistý JSON model, schéma a textové operace bez DOM |
| `src/js/editor.js` | Interaktivní editor a ikonová lišta nad JSON modelem |
| `src/js/editor-dialog.js` | Odkazy a obrázky v Pure modalech |
| `src/icons.svg` | SVG symboly |
| `src/css/states.css`, `flash.css`, `editor.css` | Volitelné komponentové moduly |
| `dist/` | Distribuce vytvořená buildem |
| `examples/` | Spustitelná dokumentace |

## Vrstvy a úpravy

Pořadí `tokens, base, components, utilities` je deklarováno v tokens.css. Utility tedy mohou přepsat komponentu. Vlastní vzhled měň přes `--p-*` tokeny; vlastní CSS vlož do samostatné pozdější vrstvy. Nepřidávej `!important` mimo skryté prvky a omezení pohybu.

Mobile je základ. Jediná media query pro rozvržení je `min-width: 960px`. Prefix `dt:` přepíše základní utility od tohoto bodu, například `flex-col dt:flex-row`. Dotazy na systémové téma a omezený pohyb nejsou další viewporty.

Každý JS inicializátor zavolej jednou pro daný scope; před opětovným připojením zavolej vrácený cleanup, u objektových modulů metodu destroy(). Žádná komponenta nevyžaduje JS, pokud není interaktivní.

## Aktuální rozsah

Pure obsahuje layout, spacing, typografii, tlačítka, formulářová pole, karty, badge, téma a disclosure. Navíc obsahuje sdílené stavy, flash zprávy, malý WYSIWYG editor, AJAX loader, validaci formulářů, modal a upload s drag & drop. Datum, čas a select mají vlastní UI nad původními poli, sdílený obal controls.js a top-layer popupy. Kalendářové výpočty jsou oddělené v calendar.js. Tooltipy zatím součástí nejsou. Viz [moduly](modules.md) a [formuláře](forms.md).
