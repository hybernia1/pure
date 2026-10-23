# JSON editor: volitelné moduly

[Patička, statistiky, i18n, upload API, media library a mediaId](editor-media-i18n.md).

Bloky lze přesouvat tažením za text typu v záhlaví, nebo klávesnicí (mezerník, šipky, mezerník). Textové „Smazat“ odstraní konkrétní blok; přesun i mazání podporují undo/redo. Implementaci sdílí samostatná [služba drag & drop](drag-drop.md), použitelná i mimo editor. Záhlaví a jeho tlačítka se do JSON ani textových pozic nepočítají.

UI tvoří samostatné textové, nadpisové a obrázkové bloky s jednotným rámečkem a kompaktními rozestupy. Aktivní blok zvýrazňuje focus. Obrázkový blok sdružuje záhlaví s šířkou, plochu s resize úchytem a spodní lištu se skupinami velikost / zarovnání / správa. Kliknutí na plochu vybere blok; modal otevírá akce Upravit nebo Enter na focusovaném bloku. Rámečky a lišty jsou pouze UI, JSON schéma se nemění.

Obrázek má přímé ikonové akce: zmenšit/zvětšit po 25 %, zarovnat vlevo/na střed/vpravo a upravit. Mazání je textové „Smazat“ v záhlaví. Šířku lze měnit také tažením za úchyt nebo klávesnicí (šipky, Home/End). Escape ruší tažení. Dokončená změna se uloží do JSON a vrátí jedním undo. Používá samostatný [modul resize](resize.md); při modulárním CSS připoj také `resize.css`.

Ukázka: [examples/modules.html](../examples/modules.html#editor-title). Editor nadále ukládá výhradně JSON. Existující dokumenty version: 1 s odstavci zůstávají platné; schéma nově obsahuje i nadpisy a obrázky.

```js
import { createEditor } from '/dist/js/editor.js';
const editor = createEditor(document.querySelector('#article'), {
  features: { headings: true, images: true, fullscreen: true },
  // Volitelné napojení na vlastní server:
  // async uploadImage(file, { signal }) {
  //   const result = await request('/api/images', {
  //     method: 'POST', headers: { 'Content-Type': file.type }, body: file, type: 'json', signal,
  //   });
  //   return { id: result.id, src: result.url };
  // },
});
```

Výchozí features: headings=false, images=false, fullscreen=true. Vypnutí funkce skryje její ovládání; platná data nadpisů i obrázků se při načtení zachovají. Propojení JS: editor-model.js je čistý model, editor.js UI, editor-dialog.js formuláře v Pure modalech. Samostatné CSS potřebuje tokens, base, components, forms, controls, modal, editor, drag-drop, resize a upload; pro knihovnu také media-library. Komplet pure.css obsahuje vše. Každý inicializátor volej jednou.

## Nadpisy

Styl textu nabízí Odstavec a Nadpis 2/3/4. Mění blok pod kurzorem nebo textové bloky ve výběru. Enter v nadpisu pokračuje novým odstavcem. Obrázkové bloky změna stylu přeskočí. API: `editor.command('heading', 2)` nebo 0 pro odstavec. Vyžaduje features.headings=true.

## Odkazy

Řetízek nebo Ctrl/Cmd+K otevře Pure modal. Uložený výběr se zachová při přesunu focusu do dialogu. Použít upraví vybraný text či odkaz pod kurzorem; bez výběru mimo odkaz vloží URL jako text. Zrušit, křížek, Escape a pozadí obsah nemění. Povolené jsou HTTP(S), mailto a relativní adresy. Odkaz v editoru neodvádí na jinou stránku. `command('link', url)` a `command('unlink')` fungují i programově.

## Obrázky

Ikona obrázku otevře Pure modal s klasickým výběrem souboru a drag & drop. Pole pro URL v modalu není. Vybraný soubor má náhled, název a možnost odebrání. Modal dále nabízí alternativní text, popisek, šířku, zarovnání a volitelně připojenou knihovnu médií. Nový obrázek se vloží jako samostatný blok za aktuální blok. Za obrázkem zůstává textový odstavec pro pokračování psaní. Kliknutí na obrázek vybere blok; ikona nastavení nebo Enter na bloku otevře úpravy. Nový soubor nahradí původní obrázek i mediaId; bez nového souboru se upraví pouze vlastnosti. Odebrat lze v modalu nebo textem „Smazat“ v záhlaví bloku. Všechny obsahové změny včetně obrázků patří do undo/redo.

Šířky jsou 25/50/75/100 procent dostupného obsahu, zarovnání left/center/right. Popisek je čistý text. `alt` je povinný řetězec v JSON; prázdný použij vědomě pro dekorativní obrázek. Obrázek je v textové ploše needitovatelný blok; jeho vlastnosti mění modal. Nejde o bitmapový editor: ořezávání, filtry a otáčení nejsou součástí tohoto modulu.

```json
{
  "version": 1,
  "blocks": [
    { "type": "heading", "level": 2, "children": [{ "text": "Nadpis" }] },
    { "type": "image", "src": "/media/photo.webp", "mediaId": "photo-1", "alt": "Pohled na krajinu", "caption": "Podzim", "width": 75, "align": "center" },
    { "type": "paragraph", "children": [{ "text": "Další obsah." }] }
  ]
}
```

Schema obrázku přijímá jen type, src, mediaId, alt, caption, width a align. Výchozí width je 100, align center; prázdný caption se vynechá. MediaId je neprázdný řetězec, konečné číslo nebo null; starší data se doplní na null. Src přijímá HTTP(S) nebo relativní cestu, odmítá mailto, data, blob a spustitelné protokoly. URL zadej vzhledem k dokumentu, kde se editor zobrazuje. Server znovu validuje schéma a obrázky. `getText()` nahrazuje obrázky alternativním textem. Interní documentText() pro práci s výběrem používá jeden znak U+FFFC za obrázek; odstavce odděluje jedním novým řádkem.

Vložení a nahrazení souboru vyžaduje uploadImage callback; bez něj se zobrazí srozumitelná chyba. Pole pro soubor je dostupné vždy. Podporované typy jsou PNG, JPEG, WebP, GIF, AVIF, limit 10 MiB. Callback dostane File a AbortSignal a vrátí `{ id, src }` s trvalou URL; starší URL string je podporovaný s mediaId null. JSON dál ukládá src a mediaId, nikoli binární obsah nebo dočasnou blob URL. Selhání zobrazí chybu v modalu a dokument nezmění. Během uploadu jsou vstupní pole zamknutá, zavření zůstává dostupné. Zrušení, zavření nebo destroy přeruší signál a pozdní výsledek se nevloží. Pokud se dokument během uploadu změní, výsledek se odmítne. Náhledové object URL se uvolní při zavření či změně souboru.

Ukázka má funkční lokální endpoint POST /api/images ve vývojovém serveru npm run dev. Přijímá binární tělo File s odpovídajícím Content-Type, základně ověřuje signaturu formátu a limit 10 MiB a uloží soubor pod náhodným názvem do .pure/uploads. Odpoví `{ "url": "/uploads/…" }`; GET na tuto adresu vrátí uložený obrázek. .pure je v gitignore. Restart serveru soubory nemaže. Endpoint slouží lokální ukázce; pro nasazení aplikace dodá vlastní ukládání, autorizaci a úplné ověření obrázků. Callback může používat i FormData endpoint, pokud to server aplikace očekává.

API pro obrázek: `command('image', { src, mediaId, alt, caption, width, align })` vloží blok, nebo upraví obrázek právě otevřený v modalu. `command('removeImage')` odebere aktuálně vybraný obrázek. Tyto příkazy vyžadují features.images=true.

## Celá obrazovka

Ikona roztažení nebo `command('fullscreen')` přepne editor přes celý viewport. Používá dialog v top layer, zachovává focus uvnitř a umožňuje otevřít nad ním modal odkazu či obrázku. Escape zavře nejvyšší otevřený dialog; po zavření fullscreen režimu se editor vrátí na původní místo a zachová obsah i výběr. Jde o aplikační režim přes viewport; nepřepíná OS ani prohlížeč do vlastního fullscreen režimu. Destroy zavře dialogy, zruší upload a obnoví textarea.

Tokeny: `--p-editor-height`, `--p-editor-style-width`, společné paddingy `--p-panel-padding` a `--p-space-*`. Toolbar zůstává dostupný, obsah ve fullscreen režimu scrolluje.
