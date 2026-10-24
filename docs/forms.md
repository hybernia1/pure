# Formuláře, datum a čas, modal, upload

Spustitelná ukázka: [examples/forms.html](../examples/forms.html). CSS moduly `forms.css`, `controls.css`, `modal.css`, `upload.css` jsou volitelné, komplet `pure.css` je obsahuje. Importuj je po základních komponentách a před utilities.css.

## Pole a výběry

Pure používá inputy, textarea a select jako nositele dat. Jejich vzhled a nabídky spravují malé volitelné moduly. `.input` sdílí výšku, padding a radius. `.field` definuje malou mezeru mezi labelem, polem a popisem. `.field-label`, `.field-help`, `.field-error` sjednocují typografii. `.control` je obal pro vnitřní ikony a akce. `.choice` slouží pro checkbox a radio.

```html
<div class="field" data-field>
  <label class="field-label" for="email">E-mail</label>
  <input class="input" data-input-icon="mail" id="email" name="email" type="email" autocomplete="email" required>
  <p class="field-error" data-field-error hidden></p>
</div>
```

Username je běžný text input s `autocomplete="username"`. Omezení vyjadřuje konkrétní aplikace pomocí `pattern`, `minlength`, `maxlength` a `required`. Ukázka používá `[a-zA-Z0-9_]{3,24}`; nejde o povinné pravidlo frameworku. E-mail používá `type="email"`. Ověření dostupnosti jména ani vlastnictví adresy není součástí klientské validace.

```html
<label for="role">Role</label>
<select class="input" data-select id="role" name="role" required>
  <option value="">Vyber roli</option>
  <optgroup label="Tým"><option value="author">Autor</option></optgroup>
  <option value="admin" disabled>Správce</option>
</select>
```

`initInputs(scope = document)` obalí inputy s `data-input-icon="id-symbolu"`, vloží dekorativní ikonu vlevo a u hesla také oko vpravo. Email typicky používá `mail`, username `user`, password `lock`. Input zůstává původní, včetně labelu, autocomplete a validity. Heslo musí mít id. Inicializátor vrací cleanup, který obnoví původní DOM. Volej jednou na scope.

`initSelects(scope = document)` vylepší `select[data-select]` a vrátí cleanup. `createSelect(source, { placeholder = 'Vyber možnost' })` je individuální varianta s metodami `open()`, `close()`, `refresh()`, `destroy()`. Nekombinuj obě na stejném selectu. Vlastní nabídka zobrazuje všechny optiony, skupiny a disabled položky, bez systémového select popupu. Multiple přepíná položky kliknutím či mezerníkem a zůstává otevřený. Single výběr se po potvrzení zavře. Šipky, Home/End a hledání psaním mění focus, Enter/Space potvrzuje. Escape vrátí focus na pole; Tab nabídku zavře a pokračuje formulářem.

Původní select je skrytý a stále nese hodnotu pro `new FormData(form).getAll('role')`, required i disabled. Každý výběr vyvolá input a change. `size` už neřídí výšku vlastního popupu. Při programové změně selectedIndex/value zavolej refresh() nebo vyvolej change; změny atributů a option uzlů se sledují automaticky. Reset obnoví výchozí výběr. Destroy odstraní vlastní UI a zviditelní select s aktuální hodnotou.

## Datum a čas

```html
<label for="date">Datum</label>
<input class="input" data-picker id="date" name="date" type="date" min="2026-01-01" max="2027-12-31">
<label for="time">Čas</label>
<input class="input" data-picker id="time" name="time" type="time" step="900">
<label for="meeting">Datum a čas</label>
<input class="input" data-picker id="meeting" name="meeting" type="datetime-local">
```

`initPickers(scope = document)` vylepší `input[data-picker]` a vrací cleanup. `createPicker(source, { locale })` nabízí individuální `open()`, `close()`, `refresh()`, `destroy()`. Jazyk přebírá z [globální konfigurace](configuration.md), ve výchozím stavu z `html lang`. Typ musí být date, time nebo datetime-local. Po inicializaci se systémový picker nepoužívá: Pure vykreslí vlastní kalendář a sloupce času. Data nadále nese původní input.

Vedle ikony zůstává editovatelné textové pole. Datum můžeš zadat jako 23.10.2026, 23. 10. 2026 nebo 2026-10-23; přijímá se také číselný formát locale. Čas jako 14:30 nebo 14:30:15, datum s časem jako 23.10.2026 14:30 nebo 2026-10-23T14:30. Po opuštění pole se platná hodnota sjednotí. Alt+šipka dolů otevře picker, samotné psaní jej neotevírá.

Chybný nebo neúplný zápis zůstává viditelný, původní hodnota se vyprázdní a customValidity zabrání odeslání. Platný zápis dál podléhá min/max/step a required. Není zde tichá oprava neexistujícího data. Výběr v panelu, správný zápis nebo reset vlastní chybu odstraní. Viditelný textový input nemá name; FormData obsahuje pouze původní kanonickou hodnotu. createForm() proxy vynechává a chybový focus přesune na editovatelné pole.

Kalendář začíná pondělím. Šipky pohybují focusem po dnech/týdnech, Home/End po týdnu a PageUp/PageDown po měsících (se Shift po letech). Kliknutí či Enter vybere datum; samotný pohyb focusem hodnotu nemění. Date se potvrdí ihned. Time a datetime mají tlačítko Použít, které je aktivní jen pro platnou kombinaci. Čas vybíráš ve sloupcích hodin, minut a případně sekund; šipky a Home/End pohybují focusem, Enter/Space vybírá. Pro minutové kroky se nabízejí jen platné časy, například při step=900 minuty 00/15/30/45. Min/max/step vyhodnocuje validita původního typu; nedostupné dny jsou disabled, neplatná sekundová kombinace má vysvětlení a nelze ji potvrdit. Vymazat uloží prázdnou hodnotu, kterou required následně označí jako chybu.

Datum se ukládá jako YYYY-MM-DD, čas HH:mm (případně HH:mm:ss) a datetime-local YYYY-MM-DDTHH:mm. Formát data ve viditelném poli řídí locale. Datetime-local neobsahuje časové pásmo; pro plánované události pošli zamýšlené pásmo zvlášť. Modul podporuje celé sekundy, nikoli zlomky sekund. Po programové změně value zavolej refresh() nebo change. Po resetu se popup zavře; destroy vrátí původní input. Podrobnosti datových typů: [date](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date), [datetime-local](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/datetime-local).

Vlastní popupy používají Popover API pro top layer a kliknutí mimo nabídku. Nejsou modální: Tab pokračuje obsahem, Escape zavře jen nabídku. Vyžadují prohlížeč s Popover API. Bez JS zůstávají vstupní HTML prvky použitelné nativně. Na required formuláři je inicializuj společně s createForm(), který přesměruje chybový focus na viditelné pole a kopíruje ARIA popisy. Panely sdílejí controls.css, stejné tokeny a žádné stíny; `--p-picker-width` určuje minimální šířku, `--p-time-list-height` výšku časových sloupců.

```js
import { initInputs, initPickers, initSelects, createForm } from '/dist/js/index.js';
const stopInputs = initInputs();
const stopPickers = initPickers();
const stopSelects = initSelects();
const form = createForm(document.querySelector('form'));
// Při odpojení: form.destroy(); stopSelects(); stopPickers(); stopInputs();
```

Klávesnice vychází z doporučení [WAI pro kalendáře](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/) a [listboxy](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/); vlastní popup kalendáře je nemodální, proto neuzamyká Tab.

## Validace

```js
import { createForm } from '/dist/js/forms.js';
const controller = createForm(document.querySelector('form'));
const valid = controller.validate({ focus: true });
// controller.destroy();
```

Inicializuj jednou na form. Modul dočasně nastaví noValidate a místo nativních popupů zobrazí textové chyby v `[data-field-error]` uvnitř wrapperu `[data-field]` pro jednotlivá pole. Pravidla dál vyhodnocuje nativní `validity`. První kontrola proběhne při opuštění pole nebo submitu; poté se chyba aktualizuje při input/change. Zprávy přebírá z lokalizovaného `validationMessage`; `data-error-message` na inputu může text přepsat. Bez chybového uzlu pole stále dostane aria-invalid.

Neplatný submit se zastaví a focus přejde na první chybu. Platný submit modul neposílá ani nezastavuje. Při vlastním AJAX handleru nejprve zkontroluj `event.defaultPrevented`; handler registruj až po createForm. Potom preventDefault a vlastní request. `validate({ focus = true })` vrací boolean. Reset vyčistí chyby. Destroy obnoví původní noValidate a ARIA atributy a odpojí listenery. Existující `aria-describedby` se zachovává a doplní o ID chyby. Každé pole má mít vlastní data-field; checkboxy a radio skupiny lze dále pojmenovat přes fieldset/legend. Server validuje znovu.

## Heslo

```html
<label for="password">Heslo</label>
<input class="input" data-input-icon="lock" id="password" name="password" type="password" autocomplete="new-password">
```

`initInputs()` přidá ikonový přepínač uvnitř pole automaticky. Má ikony eye / eye-off, dynamický aria-label, title a aria-pressed. Pro vlastní markup lze dál použít initPasswords(scope = document) s button[data-password-toggle][aria-controls="id-hesla"]; inicializátor nyní obsah tlačítka nahradí ikonou a cleanup jej obnoví. Nekombinuj obě inicializace na stejném přepínači. Reset i cleanup heslo skryjí. Pro přihlášení použij autocomplete="current-password". Modul neblokuje schránku ani správce hesel a neodesílá hodnotu.

## Modal

```html
<button type="button" data-modal-open="details">Otevřít</button>
<dialog class="modal" id="details" data-modal aria-labelledby="details-title">
  <div class="modal-header"><h2 id="details-title">Podrobnosti</h2></div>
  <div class="modal-body">Obsah</div>
  <div class="modal-actions"><button type="button" class="icon-button" data-modal-close aria-label="Zavřít dialog" autofocus><svg class="icon" aria-hidden="true"><use href="/dist/icons.svg#close"></use></svg></button></div>
</dialog>
```

`initModals(scope = document)` spojí `[data-modal-open="id"]` s `dialog[data-modal]` ve scope a vrátí cleanup. `data-modal-close="hodnota"` zavře dialog a nastaví jeho returnValue. Pro programové ovládání importuj `createModal(dialog, { closeOnBackdrop = true })`, který vrací `open(trigger = document.activeElement)`, `close(value = '')`, `destroy()`. Vyber jednu z těchto inicializací, nekombinuj obě na stejném dialogu.

Prázdné data-modal-close se automaticky převede na ikonové zavření s close ze sprite a přístupným názvem. Tlačítko s explicitní návratovou hodnotou (např. data-modal-close="done") zůstane obsahovou akcí. Destroy vrátí původní obsah i atributy zavíracího tlačítka.

Nativní [showModal()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) zajistí top layer, focus uvnitř a inertní okolí. Escape funguje nativně; close listener vrací focus na opener, pokud je stále v dokumentu. Kliknutí na pozadí zavře dialog jen tehdy, pokud tam začal i pointerdown; kliknutí do paddingu dialog nezavře. Volba closeOnBackdrop=false tuto možnost vypne. Používej přístupný nadpis a vhodné autofocus. Nativní form method="dialog" je také podporovaný. Dialog neotevírej atributem open, pokud má být modální.

Tokeny: `--p-modal-width` (32rem), `--p-backdrop` (neutrální černá s 50% opacity), `--p-panel-padding`, `--p-gutter`. Bez stínu. Destroy zavře otevřený dialog a odpojí listenery.

## Upload a drag & drop

```html
<div class="upload" data-upload>
  <label for="files">Přílohy</label>
  <input class="input" id="files" name="files" type="file" accept=".pdf,.txt" multiple aria-describedby="files-status">
  <p id="files-status" class="state-text text-xs" role="status" aria-atomic="true" data-upload-status></p>
  <ul class="upload-list" data-upload-list></ul>
</div>
```

```js
import { createUpload } from '/dist/js/upload.js';
const upload = createUpload(document.querySelector('#files'), {
  maxFiles: 3,
  maxSize: 5 * 1024 * 1024,
  onChange(files) { /* aktuální File[] */ },
});
// upload.getFiles(); upload.setFiles(fileArray); upload.clear(); upload.destroy();
```

Jeden modul na file input. Z DOM odvodí dropzone, list a status; stejnojmenné options je mohou předat explicitně. List a status jsou určeny pouze pro obsah modulu. `maxFiles` je kladné celé číslo nebo Infinity (výchozí pro multiple), pro single input je limit vždy nejvýše 1. `maxSize` je kladný limit v bajtech na soubor, výchozí Infinity. `accept` přebírá přímo z inputu a podporuje přípony, MIME i wildcard (`image/*`). Omezení platí pro picker, drop i setFiles.

Nový výběr nahrazuje starý; odmítnutý výběr ho nezmění a oznámí chybu. `setFiles(files)` vrací boolean, případně přijme `{ emit: false }`. Úspěch synchronizuje FileList, seznam a při výchozím emit vyvolá bublající change a onChange(File[]). `getFiles()` vrací kopii pole. Odebrání položky a clear také synchronizují input. Nativní reset vyprázdní seznam. Disabled input nepřijímá nový výběr ani drop.

Náhledy se vytvářejí pouze pro PNG, JPEG, GIF, WebP a AVIF přes lokální object URL; SVG náhled se nevytváří. `--p-upload-preview` určuje jejich rozměr. URL se uvolní při změně výběru i destroy. Destroy ponechá soubory v nativním inputu a odstraní generovaný seznam a listenery. Bez JS stále funguje běžný file picker. Drop je alternativou, nikdy jedinou cestou. Pro stav dropu modul používá `data-drag-active`.

Modul **neodesílá soubory automaticky**. Odešli je explicitně:

```js
import { request } from '/dist/js/ajax.js';
await request('/api/upload', { method: 'POST', body: new FormData(form), type: 'json' });
```

Content-Type pro FormData nenastavuj ručně — boundary doplní prohlížeč. Endpoint a jeho autorizaci řeší aplikace. Kontrola MIME, názvu a velikosti v prohlížeči je pouze pomocná; server musí ověřit skutečný obsah. `validateFiles(files, { accept = '', maxFiles = Infinity, maxSize = Infinity })` lze importovat samostatně; vrací pole chybových textů a při neplatném limitu vyhodí TypeError.
