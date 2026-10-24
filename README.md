# Pure

[Načítání podle potřeby](docs/distribution.md): lehký `@pure-ui/core/lazy` načte komponentu i CSS. Editor své modaly, upload a knihovnu načítá až při použití. [Ukázka po kliknutí](examples/lazy.html), [síťové testy](test/lazy.html). JSON API zůstává synchronní; pro připravenost UI použij `await editor.ready`, pro dialog `await editor.openDialog('image')` a pro fullscreen `await editor.command('fullscreen')`.

[Audit před prvním vydáním](docs/release-audit.md) obsahuje opravy, měření a otevřené kroky. `npm run check:dist` ověří distribuci, `npm run audit:size` změří velikosti a statistiky. `prepack` sestaví a zkontroluje balíček; zůstává private.

Pro lehké stránky importuj konkrétní modul, například `import { initTheme } from './dist/js/theme.js'`. Společný `index.js` načítá v prohlížeči celý graf. V npm jsou dostupné exporty `@pure-ui/core/js/theme.js`, `@pure-ui/core/css/tokens.css`, `@pure-ui/core/pure.css` a `@pure-ui/core/icons.svg`; JS je bez automatických DOM efektů, CSS se zachovává jako side effect.

Editor má [statistiky, i18n a napojitelnou knihovnu médií](docs/editor-media-i18n.md). Přímý upload funguje samostatně přes vlastní API; obrázky zachovávají `mediaId`.

[Drag & drop služba](docs/drag-drop.md) řadí bloky editoru i samostatné seznamy. Textové úchyty a mazání, klávesnice, dotyk a undo/redo v editoru.

Editor má kompaktní blokové UI. [Search input s AJAX napovídáním](docs/search.md) podporuje vlastní API, debounce, rušení požadavků a klávesnici.

Globální i lokální loader libovolné činnosti a klasický progress bar: [API a použití](docs/activity.md), [ukázka](examples/modules.html#activity-title).

Obrázky v editoru mají přímé akce pro velikost a zarovnání. Samostatný [resize modul](docs/resize.md) funguje i mimo editor; [živá ukázka](examples/modules.html#resize-title).

Čistý, modulární CSS / JS / SVG framework. Utility ve stylu Tailwindu, neutrální vzhled, žádné závislosti.

```sh
npm run build
npm run dev
```

Otevři http://localhost:3000. Vyžaduje Node.js 22+. Ukázka funguje přes HTTP, protože používá ES moduly a externí SVG sprite.

```html
<link rel="stylesheet" href="/dist/pure.css">
<section class="container py-8 dt:py-16">
  <div class="grid grid-cols-1 dt:grid-cols-3 gap-6">
    <article class="card">Vlastní obsah</article>
  </div>
</section>
```

- **Dva viewporty:** mobile pod 960 px, desktop od 960 px (`dt:`).
- **Dvě témata:** light / dark, standardně podle systému.
- **Moduly:** tokeny, reset, komponenty, utility; JS se inicializuje explicitně.
- **Ikony:** vlastní `icons.svg`, bez fontu a knihovny.

Dokumentace: [základy a architektura](docs/architecture.md), [CSS API](docs/css.md), [JavaScript](docs/javascript.md), [ikony](docs/icons.md), [stavy, flash, editor a AJAX](docs/modules.md), [formuláře, modal a upload](docs/forms.md). Funkční ukázky: [základ](examples/index.html), [moduly](examples/modules.html), [formuláře](examples/forms.html). Pravidla příspěvků: [AGENTS.md](AGENTS.md).

Editor ukládá pouze verzovaný JSON a používá ikonovou lištu. Jeho API: `getJSON()`, `setJSON(object)`, `getText()`. HTML import ani export nemá; schéma a migrace z v0.3 jsou v [dokumentaci editoru](docs/modules.md#editor).

Editor má fullscreen a volitelné nadpisy a obrázky přes features. Odkazy a obrázky se upravují v Pure modalech. Obrázkový modal používá file upload s náhledem a drag & drop; ukázka soubory ukládá lokálně do .pure/uploads přes npm run dev. [Nastavení, JSON schéma a upload callback](docs/editor.md).

Formuláře mají ikony uvnitř polí, ruční zápis data a času, vlastní kalendář, časové sloupce a select nabídky. Aktivace: `initInputs()`, `initPickers()`, `initSelects()`; hodnoty zůstávají v původních formulářových prvcích. Modal zavírá ikonový křížek.

`npm test` ověřuje generátor, témata, disclosure, JSON model editoru, ruční zápis data a času, kalendář, AJAX, bezpečné adresy, pravidla souborů a lokální upload endpoint. Po buildu a spuštění serveru otevři [integrační testy prohlížeče](http://localhost:3000/test/browser.html), které ověří editor včetně obrázků, fullscreen a modalů, HTML allowlist AJAXu, flash, načítání, vlastní pole, formuláře a upload. `npm run build` obnoví distribuční soubory. Verze 0.6.1 je výchozí základ; balíček zatím není určený k publikaci do npm.
