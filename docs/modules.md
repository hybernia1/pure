# Stavy, flash, editor a AJAX

Všechny moduly jsou volitelné a bez závislostí. Spustitelná ukázka: [examples/modules.html](../examples/modules.html).

## Společné stavy

Používáme právě `error`, `success`, `info`. Barvy jsou tlumené a mají light/dark tokeny. `data-state` pouze nastavuje lokální proměnné; vzhled vybírá třída. Stav vždy vysvětli i textem.

```html
<article class="card state" data-state="success">Hotovo: změny uložené.</article>
<input class="input state-border" data-state="error" aria-invalid="true" aria-describedby="error">
<p id="error" class="state-text" data-state="error">Chyba: vyplň jméno.</p>
<span class="badge state" data-state="info">Informace: koncept</span>
```

`state` použije barvu textu, pozadí a okraje; `state-text` jen text; `state-border` jen okraj. Na formulářovém poli přidej správné `aria-invalid` a popis chyby. Statický stav sám o sobě nevyhlašuje oznámení čtečce. Export `states` poskytuje neměnné pole povolených hodnot.

## Flash

```html
<div id="notifications" class="flash-region" aria-label="Oznámení"></div>
```

```js
import { createFlash } from '/dist/js/flash.js';
const flash = createFlash(document.querySelector('#notifications'));
const dismiss = flash.show('Hotovo: uloženo.', { state: 'success' });
// dismiss(); flash.clear(); flash.destroy();
```

`show(message, { state = 'info', duration = 0 })` vloží textovou zprávu a tlačítko zavření. HTML se neinterpretuje. Vrací funkci pro odstranění jedné zprávy. `duration` je nezáporný počet milisekund; 0 ponechá zprávu až do zavření. Vypršení počká, pokud je zpráva pod kurzorem nebo má focus. Chyby oznamuje persistentní `alert`, ostatní stavy `status`. Při zavření právě ovládané zprávy focus přejde na region. Automatické zavírání používej jen pro nepodstatné informace.

`clear()` odstraní všechny zprávy, `destroy()` navíc odpojí oznamovací uzly. Inicializuj jednou na region. Po destroy už nelze volat show. Vzhled je běžný tok dokumentu, žádné pevně umístěné toast okno.

## Editor

```html
<label for="body">Text příspěvku</label>
<textarea id="body" name="body">{"version":1,"blocks":[{"type":"paragraph","children":[{"text":"Ahoj."}]}]}</textarea>
```

```js
import { createEditor } from '/dist/js/editor.js';
const editor = createEditor(document.querySelector('#body'));
editor.setJSON({
  version: 1,
  blocks: [{ type: 'paragraph', children: [
    { text: 'Nový ' },
    { text: 'obsah', bold: true },
    { text: '.', italic: true, link: '/docs' },
  ] }],
});
const json = editor.getJSON(); // nezávislý objekt
const text = editor.getText(); // čistý text, odstavce oddělené \n
// editor.command('bold'); // použije uložený výběr v editoru
// editor.command('italic');
// editor.command('link', 'https://example.com');
// editor.command('unlink');
// editor.command('undo'); editor.command('redo');
// editor.destroy();
```

Editor má výhradně JSON datový model. `createEditor(source, { label, iconsUrl })` převezme z textarea serializovaný JSON; prázdná hodnota vytvoří jeden prázdný odstavec. Neplatný JSON nebo schéma vyhodí chybu ještě před vytvořením UI. Přístupný název přebírá z labelu. Textarea zůstává nositelem JSON řetězce pro FormData a submit; změny vyvolávají její input událost. Před inicializací je viditelná jako JSON zdroj. Reset načte její defaultValue. Destroy obnoví viditelnou textarea s aktuálním JSON a odstraní listenery.

Schéma verze 1 obsahuje textové bloky paragraph, heading (level 2/3/4), list (style bullet/ordered, items: [{children}]), dále samostatný blok image. Základní odstavec má `{ type: 'paragraph', children: [...] }`. Každý textový úsek má povinné text a volitelné bold, italic a link. Prázdný odstavec má children: []. Nové řádky patří do dalších odstavců či položek seznamu. Nepovolené klíče, chybné hodnoty a nebezpečné URL se odmítají. Sousední stejně formátované úseky se slučují. getJSON() vrací nezávislou kopii, setJSON(object) ověří data, getText() vrací prostý text včetně alt obrázků. Přímá změna textarea po inicializaci není podporovaná. Úplné schéma a volby: [rozšířený editor](editor.md), [seznamy](editor-lists.md).

Ikonová lišta používá symboly `bold`, `italic`, `link`, `unlink`, `undo`, `redo` z icons.svg. Každé tlačítko má přístupný název a title; aktivní formátování má aria-pressed a zvýraznění, nedostupné undo/redo jsou disabled. Výchozí cesta ke sprite se odvodí relativně k modulu editor.js; `iconsUrl` ji může přepsat.

Tučný text a kurzíva jsou přepínače. S výběrem mění jen vybraný text, bez výběru nastaví formát budoucího psaní. Lišta sleduje výběr, i přes více odstavců. Řetízek otevře Pure modal s adresou a tlačítky Použít/Zrušit. Výběr dostane odkaz; kurzor v existujícím odkazu ho upraví, kurzor mimo odkaz vloží URL jako nový text. Unlink odstraní odkaz z výběru nebo z celého odkazu pod kurzorem. Adresa může být HTTP(S), mailto či relativní cesta. Kliknutí na odkaz uvnitř editoru nenaviguje pryč.

Klávesy Ctrl/Cmd+B, I, K, Z, Shift+Z a Y obsluhuje modul. Enter i Shift+Enter vytvoří odstavec. Historie uchovává do 100 obsahových změn s výběrem; po undo/redo se výběr obnoví. Schránka vkládá pouze text, drop je zakázaný. IME kompozice se zpracuje po dokončení. Fullscreen je zapnutý výchozím nastavením; nadpisy a obrázky jsou volitelné přes features. Obrázky používají Pure modal a mají velikost, zarovnání, alt i popisek. Tabulky, seznamy a spolupráce více uživatelů zatím součástí nejsou. Viz [volitelné funkce](editor.md).

Textarea nesmí být required, disabled ani readonly. Validuj obsah přes getJSON()/getText() a znovu na serveru. Inicializuj jednou na textarea. Pomocné čisté funkce `emptyDocument`, `normalizeDocument`, `documentText` jsou exportované z index.js i editor-model.js; `replaceText`, `formatText`, `selectionMarks` z editor-model.js pracují s UTF-16 offsety, kde oddělovač odstavců má délku jedna.

**Změna API ve v0.4:** getHTML/setHTML byly odstraněny. Existující HTML hodnoty musí aplikace migrovat mimo editor. JSON řetězec nejprve parsuj a předávej setJSON objekt; data v textových úsecích se zobrazují doslova, nikdy jako HTML. UI vytváří DOM uzly bez innerHTML, JSON neobsahuje markup a editor nemá HTML import ani export.

## HTML režim AJAX loaderu

Pouze explicitní HTML loader používá úzký allowlist: `p`, `div`, `br`, `strong`, `em`, `b`, `i`, `a`, `ul`, `ol`, `li`, `blockquote`, `h2`, `h3`, `code`, `pre`. S editorem nesdílí datový formát. Všechny atributy se odstraní kromě ověřeného `href` na odkazu. Povolené adresy: HTTP(S), mailto a relativní cesty; bez řídicích znaků, zpětných lomítek a protocol-relative URL. Skripty, styly, vložená média, SVG, MathML a template se zahodí včetně obsahu. Ostatní nepovolené elementy se rozbalí na text / povolené potomky.

Jde o záměrně omezené textové HTML; loader nenačítá interaktivní šablony s třídami nebo formuláři. Server musí HTML při ukládání a zobrazování znovu validovat. Import `cleanHTML`, `htmlFragment`, `safeHref` z `/dist/js/html.js` je dostupný i samostatně.

## AJAX

```js
import { request, createLoader, HttpError } from '/dist/js/ajax.js';
const data = await request('/api/items', { type: 'json' });
const loader = createLoader(document.querySelector('#content'));
try {
  await loader.load('/partial', { format: 'html' });
} catch (error) {
  // HTTP chyby: error instanceof HttpError, error.status
  // Zde zobraz vlastní chybový stav nebo flash.
}
// loader.cancel(); loader.destroy();
```

`request(url, { type = 'text', ...fetchOptions })` vrátí text nebo JSON; HTTP mimo 2xx vyhodí HttpError s `status` a `response`. Síťové chyby a chyby JSON nezakrývá. Podporuje standardní fetch options včetně metody, těla, hlaviček a AbortSignal. Credentials se řídí výchozím chováním fetch; modul je sám nerozšiřuje.

`createLoader(target)` vrátí `load`, `cancel`, `destroy`. Jeden loader patří jednomu cíli. `load(url, { format = 'text', ...fetchOptions })` nastaví aria-busy a nahradí obsah pouze při úspěchu. Text je výchozí; HTML musí být explicitní a projde allowlistem. Nový požadavek zruší starý. Starší odpověď nikdy nepřepíše novější výsledek. Volitelný signal může načítání zrušit i zvenčí. Zrušení nebo překonaný požadavek vrací null, úspěch původní text odpovědi. Původní obsah a původní aria-busy se zachovají při chybě. Destroy zruší rozpracovanou operaci a zablokuje další load. Stavové hlášky a retry tlačítka řídí aplikace, loader sám nic globálně neoznamuje.

Implementace používá standardní [Fetch API a AbortController](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) a [DOM Range](https://developer.mozilla.org/en-US/docs/Web/API/Range). Nevyužívá zastaralé execCommand.
