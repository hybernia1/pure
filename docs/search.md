# Search a AJAX napovídání

```html
<label for="people">Uživatel</label>
<input id="people" name="query" type="search" class="input">
```

```js
import { createSearch } from './dist/js/index.js';
const search = createSearch(document.querySelector('#people'), {
  url: '/api/search', // GET /api/search?q=dotaz
  delay: 250, minLength: 2, limit: 8,
  onSelect(item) { console.log(item.value, item.id); },
});
await search.refresh(); // okamžitě načíst pro aktuální text
search.close();
search.destroy();
```

Endpoint vrací JSON pole `[{ label: 'Nikola Nováková', value: 'nikola', id: '1' }]`. `label` a `value` jsou řetězce; další data zůstávají dostupná v callbacku. Název query parametru lze změnit volbou `param` (výchozí `q`). Text dotazu se bezpečně zakóduje přes URLSearchParams. Pro jinou strukturu odpovědi, vlastní hlavičky nebo transport předej místo `url` funkci `fetch(query, { signal })`, která vrátí stejné pole. Signál předej svému fetch/request volání.

Psaní čeká `delay` ms, výchozí minimum jsou dva znaky. Každý nový vstup ihned ruší předchozí požadavek i návrhy. Pozdní odpovědi se ignorují i u transportu bez podpory abort. IME hledá po dokončení kompozice. Zobrazí se nejvýše `limit` výsledků. Stavový text oznamuje načítání, prázdný výsledek nebo chybu. Texty návrhů se vkládají jako text, nikdy HTML.

Focus zůstává v původním inputu (`combobox` + `aria-activedescendant`), šipky mění aktivní návrh, Enter jej potvrdí. Tab, Escape, ztráta focusu a reset formuláře zavírají nabídku a ruší načítání. Potvrzení nastaví input na `item.value`, vyvolá standardní `input` a `change`, callback `onSelect(item)` a událost `pure:search-select` s `detail: item`. Bez výběru se odešle původní napsaný text. Chyby oznamuje událost `pure:search-error` s `detail: Error`; aplikace může umožnit normální odeslání dotazu i při nedostupném napovídání.

Původní input zachovává label, name, validaci a FormData. Identifikátor výsledku lze z `onSelect` uložit do vlastního hidden inputu; po další editaci jej aplikace musí zneplatnit. `destroy()` odpojí události, abortuje požadavky, odstraní UI a obnoví původní ARIA/autocomplete atributy. Jedna instance na input. Ikonu search vytváří modul; na stejném inputu nepoužívej `data-input-icon`/`initInputs`.

CSS: `tokens`, `base`, `components`, `forms`, `controls`, `search` nebo celé `pure.css`. Nabídka používá Popover API a token `--p-search-height`. Ukázka [formuláře](../examples/forms.html#search-title) načítá lokální JSON přes AJAX a filtruje jej; skutečný endpoint se připojí volbou `url` nebo `fetch`.
