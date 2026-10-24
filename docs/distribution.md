# Distribuce a načítání podle potřeby

Pure poskytuje lehký vstup `lazy.js`. Frontend určuje okamžik použití komponenty; Pure načte její JS, závislosti a CSS. Inicializace zůstává explicitní, žádný automatický průchod DOM se neprovádí.

```js
import { loadComponent } from './dist/js/lazy.js';
// V npm: import { loadComponent } from '@pure-ui/core/lazy';

button.addEventListener('click', async () => {
  const { createEditor } = await loadComponent('editor');
  const editor = createEditor(textarea, { features: { images: true } });
  await editor.ready;
});
```

`loadComponent(name, { document, styles = true })` vrací Promise s původním ESM modulem. Při výchozím nastavení je CSS před resolve připravené. Současné/opakované požadavky sdílejí nativní ESM cache a CSS linky; neprovádí se nová inicializace komponenty. Jména jsou explicitní, nejde o loader libovolných cest.

Podporované komponenty: `theme`, `disclosure`, `ajax`, `forms`, `select`, `picker`, `modal`, `upload`, `resize`, `editor`, `media-library`, `search`, `flash`, `activity`, `progress`, `drag-drop`.

AJAX načte HTML sanitizer až při `loader.load(url, { format: 'html' })`. Obyčejný request pro JSON/text jej nepotřebuje. Po asynchronním importu znovu kontroluje aktuálnost požadavku; pozdní výsledek nepřepíše novější obsah. Validace souborů je oddělená od upload UI, knihovna médií proto nemusí kvůli validaci načítat createUpload.

```js
const { createSearch } = await loadComponent('search');
const search = createSearch(input, { url: '/api/search' });
// Editor se kvůli search nenačítá.
search.destroy();
```

Pro přímé načtení konkrétních stylů je `ensureStyles('search', { document })` nebo pole názvů CSS modulů. Názvy odpovídají souborům v dist/css, včetně `utilities`; závislosti a vrstvy Pure doplní sám. Neznámé názvy se odmítají.

## CSS a bundlery

CSS se hledá relativně k distribuovanému JS (`dist/js` → `dist/css`); při nasazení zachovej tuto strukturu a související `dist/icons.svg`. Používej sestavenou distribuci. Každý dokument má samostatnou cache. Po destroy komponenty sdílené styly zůstávají, aby je další instance nemusela znovu načítat. Odebírání komponenty neodinstaluje ES moduly z prohlížeče.

Pokud je už připojený `pure.css`, nové komponentové CSS se neduplikuje. U vlastního kompletního bundlu přidej `<link rel="stylesheet" href="app.css" data-pure-styles="all">`; značka znamená, že obsahuje všechny styly Pure. Existující komponentové linky se poznají podle stejné absolutní URL. Pending stylesheet čeká na load, chyba/15s timeout odmítne Promise; neúspěšný link vytvořený Pure se odstraní a další volání umožní retry. Cizí link se nemaže.

Když styly řeší bundler aplikace:

```js
const { createEditor } = await loadComponent('editor', { styles: false });
const editor = createEditor(textarea, { styles: false });
```

Volby patří dvěma samostatným krokům: loaderu a komponentě. `styles: false` u editoru a knihovny vypne i jejich interní CSS požadavky. Aplikace pak musí dodat veškeré styly včetně modalů, uploadu a knihovny. Přímý import `js/editor.js` je dál možný; při inicializaci editor standardně zajistí své základní CSS. Ostatní přímé importy používej s ručně připojenými styly nebo přes `loadComponent`.

Společný `index.js` zůstává kompatibilní vstup se všemi statickými exporty. Browser z něj načte celý statický graf, i když použiješ jen jednu funkci. Pro úspornou distribuci importuj lazy.js přímo; import loadComponent přes index.js tento efekt nezruší. Deklarace sideEffects pomáhá bundlerům, sama v prohlížeči neprovádí tree shaking. `pure.css` nadále nabízí kompletní CSS v jednom souboru.

## Co si editor načítá sám

| Část | Okamžik |
| --- | --- |
| Model, text, statistiky, překlady, přesun bloků | Základ editor.js |
| Select stylu textu | Inicializace se zapnutými headings |
| Resize | První vykreslený obrázek se zapnutými images |
| Modal odkazu | První otevření odkazu, bez upload modulu |
| Obrázkový modal, selecty a upload | První otevření obrázkového modalu |
| Media library | Kliknutí na Knihovna médií; také její CSS |
| Fullscreen modal | První přepnutí fullscreen |

Samotné `features.images: true` u prázdného editoru nenačítá obrázkový modal ani resize. Knihovna není inicializovaná ani při otevření obrázkového modalu. Doplňky se sdílejí přes ESM cache, DOM a stav modalů zůstávají samostatné pro každou instanci editoru.

## Asynchronní připravenost a kompatibilita

`createEditor()` stále vrací instanci synchronně. JSON a textové příkazy fungují hned. `await editor.ready` čeká na základní CSS a právě požadované select/resize doplňky; po `setJSON()` s novým obrázkem můžeš čekat znovu. Nejde o přednačtení všech budoucích dialogů. Patička a JSON nejsou závislé na otevření modalu.

Otevření UI nyní může čekat na síť:

```js
await editor.openDialog('link');
await editor.openDialog('image'); // vložení nového obrázku
await editor.command('fullscreen');
```

`openDialog` vrací true po otevření, false pro vypnutou funkci nebo zrušenou/starou operaci. Metody práce s JSON, heading, bold, italic, image, moveBlock, removeBlock, undo a redo zůstávají synchronní. Pro přímé programové fullscreen volání nově čekej na Promise. Kliknutí a klávesové zkratky čekání řeší uvnitř Pure; po UI kliknutí nečti modal synchronně ve stejném JS průchodu.

Opakované kliknutí sdílí požadavek a otevře jen aktuální operaci. Změna JSON/reset/destroy zneplatní čekající otevření; po destroy se neobnoví DOM. Sdílené stahování se kvůli destroy jedné instance neruší. Chyba UI načítání se oznámí přeloženým stavem a událostí `pure:load-error` na textarea s původní chybou v detail. Promise z přímého API může odmítnout; frontend ji zachytí stejně jako `loadComponent` a může umožnit opakování.

Samostatná knihovna médií má `styles` a její `await library.open()` čeká na CSS a načtení položek. Zavření/destroy během čekání zabrání opožděnému otevření. Upload/load adaptéry zůstávají stejné.

## Ověření

- [Ukázka až po kliknutí](../examples/lazy.html): základní stránka nenačítá editor, jeho modaly ani jeho CSS.
- [Regresní testy UI](../test/browser.html): běžné funkce včetně async otevření.
- [Samostatné testy sítě](../test/lazy.html): bez index.js a full CSS, kontrolují reálně načtené zdroje přes Resource Timing a hotové stylesheets.
- Node testy ověřují sdílení CSS, oddělení dokumentů, chybu/retry, existující bundle a import bez DOM při styles:false.

Při měření této změny klesl počáteční statický graf editor.js z 13 souborů / 32 181 B gzip na 8 souborů / přibližně 20,5 kB gzip. Lazy vstup se styles loaderem má dva soubory / přibližně 1,7 kB gzip. Jde o součet samostatně komprimovaných statických závislostí, nikoli o velikost všech doplňků nebo HTTP overhead. Zapnutí funkcí si vyžádá další soubory; `npm run audit:size` umožní aktuální měření.
