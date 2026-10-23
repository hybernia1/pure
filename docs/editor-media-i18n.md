# Editor: počty, jazyky a média

Samostatný export `editorStats(documentJSON, locale)` vrací stejné počty jako metoda editoru pro již normalizovaný dokument. `createUpload` a `validateFiles` nově přijímají volitelný callback `translate(key, values)` pro souborové zprávy; klíče jsou `uploadRemove`, `uploadRemoveFile`, `uploadSelected`, `uploadEmpty`, `uploadError`, `maxFiles`, `maxSize`, `invalidType` ze slovníku `editorLocales`. Bez callbacku zachovávají původní češtinu.

Editor má patičku se statistikami `blocks`, `words`, `images`; stejné hodnoty vrací `editor.getStats()`. Počítají se všechny bloky (včetně prázdného odstavce), slova pouze z odstavců a nadpisů. Alt texty a popisky obrázků ani ovládání nejsou slova dokumentu. Používá se `Intl.Segmenter`, bez něj Unicode rozdělení podle písmen a číslic. Patička se aktualizuje při psaní, změně JSON, resetu i undo/redo; zůstává viditelná i ve fullscreenu.

## i18n

```js
createEditor(textarea, {
  // Bez locale: jazyk <html lang>, bez lang angličtina.
  locale: 'en',
  messages: { words: 'Word count: {count}', remove: 'Remove' },
});
```

Dodané slovníky jsou `cs` a `en`. Regionální varianty jako `cs-CZ` používají základní jazyk. Nepodporovaný jazyk použije anglické texty; aplikace může dodat vlastní `messages` pro libovolný jazyk. Nastavení je samostatné pro každou instanci a vybírá se při inicializaci. Změna jazyka dokumentu za běhu existující instanci nepřekládá. Obsah JSON se nepřekládá.

Export `editorLocales` obsahuje úplné slovníky a klíče. `messages` je plochý objekt řetězců; parametry používají `{count}`, `{index}`, `{title}`, `{level}`, `{page}`, `{name}`, `{size}`, `{errors}`. Chybějící klíče mají fallback. Lokalizují se lišty, bloky, patička, modaly, souborové stavy, resize a drag & drop oznámení. Chyby a texty z vlastního serveru/callbacku překládá aplikace; programátorské chyby nejsou součástí UI slovníku. Statické formátové značky a procenta zůstávají stejné.

## Přímý upload bez knihovny

```js
const editor = createEditor(textarea, {
  features: { images: true },
  async uploadImage(file, { signal }) {
    const data = new FormData(); data.append('file', file);
    const response = await fetch('/my-api/media', { method: 'POST', body: data, signal });
    if (!response.ok) throw new Error('Upload se nezdařil.');
    const item = await response.json();
    return { id: item.id, src: item.url, alt: item.alt || '', name: file.name };
  },
});
```

Upload je klasický file picker s náhledem a drag & drop, bez URL pole. Není závislý na media library. Způsob přenosu, endpoint, hlavičky, autorizaci a strukturu odpovědi řeší callback; výše je jen adaptér. Aplikace může stejně použít `request` s raw tělem File. Signál abort předávej transportu. Zrušený modal ignoruje opožděný výsledek. PNG/JPEG/WebP/GIF/AVIF mají limit 10 MiB; server musí soubor také ověřit. Jde o obrázky, nikoli obecné přílohové bloky.

Nový callback vrací `{ id, src, alt?, name? }`. Pro kompatibilitu lze stále vrátit URL řetězec, potom je `mediaId: null`. Při úpravě alt/popisku/velikosti se znovu nenahrává a ID zůstane. Nový soubor nebo výběr z knihovny nahradí ID původního média.

## Knihovna médií v editoru

```js
createEditor(textarea, {
  features: { images: true },
  uploadImage: myUpload,
  mediaLibrary: {
    async load({ query, page, pageSize, signal }) {
      const url = new URL('/my-api/media', location.origin);
      url.search = new URLSearchParams({ q: query, page, limit: pageSize });
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error('Load failed');
      return response.json(); // { items: [{ id, src, alt?, name? }], hasMore: boolean }
    },
    upload: myUpload, // volitelné nahrávání přímo v knihovně
    pageSize: 12,
  },
});
```

V modalu obrázku se objeví „Knihovna médií“. Její modal umožňuje hledání, stránkování a výběr. Návrat vyplní náhled a alt text v modalu obrázku; do dokumentu se médium vloží až tlačítkem Použít. Otevření knihovny tedy samo dokument nezmění. Změněný dokument během otevření odmítne zastaralý výběr. Upload v knihovně je volitelný a nezávislý na přímém `uploadImage`.

`load` přijímá stránku od 1 a vrací uvedený objekt, nebo prosté pole (pak není další stránka). Položky vyžadují bezpečné trvalé `src` a `id`: neprázdný řetězec nebo konečné číslo, včetně nuly. `blob:`, `data:`, `javascript:` se odmítají. `name` je text názvu v knihovně, do obrázkového JSON se neukládá. Požadavky se ruší při zavření a staré odpovědi se ignorují. Chyba se zobrazí v modalu a lze znovu hledat; načítání a upload nemění dokument před potvrzením.

## Samostatný modal

```js
import { createMediaLibrary } from './dist/js/index.js';
const library = createMediaLibrary({
  load: myLoad, upload: myUpload, locale: 'cs', messages: {}, pageSize: 12,
  onSelect(media, { signal }) { console.log(media.id, media.src); },
});
await library.open(button); // vrací dokončení načtení, nikoli výběr
await library.refresh();
library.close();
library.destroy();
```

`onSelect` může být async; po úspěchu se modal zavře, při chybě ukáže zprávu. `document` lze předat pro konkrétní DOM dokument. Vlastní `load` je povinný; `upload` a `onSelect` jsou volitelné. `normalizeMedia(item)` je veřejný validátor stejného kontraktu. CSS: `tokens`, `base`, `components`, `forms`, `controls`, `modal`, `media-library`; editor potřebuje navíc své běžné moduly. Vše obsahuje i `pure.css`.

## JSON a kompatibilita

```json
{"type":"image","src":"/media/42.webp","mediaId":42,"alt":"Krajina","width":50,"align":"center"}
```

Verze dokumentu zůstává 1; jde o doplňující metadata. Normalizace starších obrázků doplní `mediaId: null`, nevytváří falešná ID. ID přežije textové úpravy, resize, přesun, undo/redo i `getJSON`/`setJSON`. Aplikace musí při ukládání na server znovu ověřit existenci média a oprávnění k ID i src. Framework média automaticky nemaže ze serveru po odstranění bloku.

Ukázky: [český editor s knihovnou a uploadem](../examples/modules.html#editor-title), [anglický editor s vlastním překladem](../examples/modules.html#editor-i18n-title).
