# Barvy, režimy a vlastní schémata

Pure odděluje **režim** (`light`, `dark`, `system`) od **barevného schématu** (`default` nebo vlastní název). Každé schéma může definovat svou světlou i tmavou paletu. Všechny komponenty dál čtou stejné sémantické proměnné; barvy se neukládají podruhé do JS konfigurace.

[Živá ukázka](../examples/themes.html) · [CSS ukázkových schémat](../examples/themes.css) · [Testy skutečných barev](../test/themes.html)

## Přepsání výchozích light/dark barev

Za Pure připoj vlastní CSS. Nepřepisuj distribuční soubory:

```css
:root {
  --p-light-bg: #f5f4f1;
  --p-light-surface: #ffffff;
  --p-light-text: #292722;
  --p-dark-bg: #1c1b18;
  --p-dark-surface: #26241f;
  --p-dark-text: #efebe2;
}
```

Pure podle režimu připojí paletu na `--p-bg`, `--p-surface`, `--p-text` a ostatní sémantické tokeny. `data-theme="light"` vynutí světlou variantu, `data-theme="dark"` tmavou; bez atributu rozhoduje `prefers-color-scheme`. Nativní inputy a scrollbary mají odpovídající CSS `color-scheme`.

## Pojmenované schéma

```css
:root[data-scheme="stone"] {
  --p-light-bg: #f4f1eb;
  --p-light-surface: #fffdf8;
  --p-light-text: #302b25;
  --p-light-action: #504537;
  --p-light-on-action: #fffdf8;

  --p-dark-bg: #201d18;
  --p-dark-surface: #29251f;
  --p-dark-text: #f1e9dd;
  --p-dark-action: #e7d7bf;
  --p-dark-on-action: #29251f;
}
```

```html
<html data-scheme="stone" data-theme="dark">
```

Není potřeba kopírovat definice komponent, media query ani všechny tokeny. Neuvedené barvy zdědí výchozí paletu. Schémata jsou určená pro kořen dokumentu, nikoli vnořené barevné ostrůvky. Přímé přepsání sémantického `--p-bg` apod. zůstává možné; pro samostatné light/dark hodnoty používej paletové tokeny.

## Paletové tokeny

Každý název existuje s prefixem `--p-light-` i `--p-dark-`:

| Název | Význam |
| --- | --- |
| `bg`, `surface`, `muted` | Pozadí stránky, hlavní a doplňkový povrch. |
| `text`, `subtle`, `border` | Hlavní text, vedlejší text a ohraničení. |
| `action`, `on-action`, `focus` | Akční plocha, její text a viditelný focus. |
| `backdrop` | Pozadí modalů. |
| `error`, `error-bg`, `error-border` | Chybový stav. |
| `success`, `success-bg`, `success-border` | Úspěch. |
| `info`, `info-bg`, `info-border` | Informace. |

Rozestupy, fonty, rozměry a rádiusy zůstávají samostatné původní tokeny. Při vlastní paletě slaď text a povrchy i `action`/`on-action`; všechny tři stavy mají vedle barvy i text.

## JS API a ukládání

```js
import { initTheme, setTheme, setScheme } from '@pure-ui/core/js/theme.js';
// Nebo const { initTheme, setTheme, setScheme } = await loadComponent('theme');

const cleanup = initTheme();
setScheme('stone');
setTheme('dark');
setTheme('system'); // Schéma zůstává stone, režim sleduje systém.
setScheme('default'); // Odstraní data-scheme, zachová režim.
```

`setScheme(name, options = {})` mění pouze atribut a uložený název. Název musí odpovídat `[a-z][a-z0-9-]{0,63}`. `default` je rezervovaný návrat k základní paletě a odstraní atribut. Neexistuje JS registr: aplikace dodává CSS a může v něm mít libovolný počet schémat. Pokud CSS pro jméno chybí, prohlížeč použije výchozí paletu; API existenci stylového souboru neověřuje ani ho automaticky nestahuje.

`setTheme` i `setScheme` přijímají `root`, `storage`, `persist` a klíče úložiště, stejně jako globální theme konfigurace. `initTheme` obnoví obě volby a připojí delegovaná tlačítka; vrací cleanup listenerů. Nevrací původní vzhled. Změna systémové preference se provádí čistě přes CSS, bez dalšího JS listeneru.

```js
configurePure({
  theme: {
    default: 'system',
    scheme: 'stone',
    persist: true,
    storageKey: 'app-mode',
    schemeStorageKey: 'app-scheme',
  },
});
```

Globální nastavení samo nepřipojuje CSS ani neinicializuje UI. `initTheme` použije uloženou platnou volbu, jinak nakonfigurovaný výchozí režim a schéma. `persist:false` vypne čtení i zápis obou klíčů; blokované úložiště UI nezastaví. Klíče mají být rozdílné. Při lokálním `root` předávej stejné options i samostatným setterům.

```html
<button type="button" data-theme-toggle>Přepnout light/dark</button>
<button type="button" data-theme-set="system">Podle systému</button>
<button type="button" data-scheme-set="stone">Stone</button>
<button type="button" data-scheme-set="default">Pure</button>
```

Přepínač light/dark zachovává schéma. Přímé volby nevytvářejí vlastní ovládací komponentu; aplikace může zobrazit aktuální stav podle atributů, jako v ukázce. Import modulu nemá DOM efekty.

## První vykreslení

Pro serverově vybraný vzhled stačí oba atributy v HTML před připojením CSS. Pokud následně voláš initTheme, předej stejné výchozí hodnoty i v konfiguraci. Pokud používáš localStorage a chceš předejít bliknutí, obnov názvy před styly malým skriptem s odpovídajícími klíči a CSP nonce dle aplikace:

```html
<script>
  try {
    const root = document.documentElement;
    const mode = localStorage.getItem('pure-theme');
    const scheme = localStorage.getItem('pure-scheme');
    if (mode === 'light' || mode === 'dark') root.dataset.theme = mode;
    else if (mode === 'system') root.removeAttribute('data-theme');
    if (scheme && scheme !== 'default' && /^[a-z][a-z0-9-]{0,63}$/.test(scheme)) root.dataset.scheme = scheme;
    else if (scheme === 'default') root.removeAttribute('data-scheme');
  } catch {}
</script>
```

Stejná definice palet funguje bez JS, se samostatnými moduly i s celým `pure.css`.
