# Tabulky, seznamy a stránkování

Tři pohledy sdílejí malý datový controller. Pure spravuje požadavek, stav a UI; aplikace vlastní API, autorizaci a význam jednotlivých polí. Bez automatického procházení DOM, bez závislostí, bez HTML šablon.

[Živá ukázka](../examples/data.html) · [Integrační a responzivní testy](../test/data.html)

## Rychlý start

```js
import { loadComponent } from '@pure-ui/core/lazy';
const { createTable } = await loadComponent('table');

const table = createTable(document.querySelector('#users'), {
  caption: 'Uživatelé',
  responsive: 'stack',
  columns: [
    { key: 'name', label: 'Jméno', sortable: true, primary: true },
    { key: 'email', label: 'E-mail' },
  ],
  pageSize: 20,
  async load({ page, pageSize, query, sort, signal }) {
    const params = new URLSearchParams({ page, pageSize, query });
    if (sort) { params.set('sort', sort.key); params.set('direction', sort.direction); }
    const response = await fetch(`/api/users?${params}`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json(); // { items: [...], total: 123 }
  },
});
await table.ready;
await table.controller.setQuery('Anna');
// table.destroy();
```

`table.ready` čeká na první načtení vlastního controlleru; vrátí `true` při úspěchu a `false` při chybě nebo zrušení. Chyba se zobrazí s možností opakování. Programové chyby ve vstupních volbách vyhodí výjimku.

Při přímém importu `@pure-ui/core/js/table.js` připoj `css/data.css` se závislostmi tokens → base → components, nebo celý `pure.css`. Lazy názvy jsou `data` (bez CSS), `table`, `list`, `pagination` (společné `data.css`).

## Datový controller

`createDataController({ load, page = 1, pageSize = 20, query = '', sort = null })` nevyžaduje DOM a sám nezačne načítat. Výchozí `pageSize` přebírá z globální konfigurace.

`load({ page, pageSize, query, sort, signal })` vrací Promise nebo objekt `{ items, total }`. Stránky jsou od 1, `total` je počet všech vyhovujících záznamů, nikoli počet stránek. `items` musí být pole s nejvýše `pageSize` prvky. `sort` je `null` nebo `{ key, direction: 'asc' | 'desc' }`.

| Metoda | Chování |
| --- | --- |
| `reload()` | Načte aktuální stav; Promise vrátí boolean úspěchu. |
| `setPage(number)` | Změní stránku a načte data. |
| `setPageSize(number)` | Změní kladnou celočíselnou velikost, vrátí se na stranu 1 a načte data. |
| `setQuery(string)` | Změní hledání, vrátí se na stranu 1 a načte data. |
| `setSort(sort)` | Změní nebo zruší řazení, vrátí se na stranu 1 a načte data. |
| `getState()` | Snapshot `{ items, total, page, pages, pageSize, query, sort, status, error }`. |
| `subscribe(listener)` | Ihned předá stav a následné změny; vrací odhlášení. |
| `destroy()` | Přeruší transport, odhlásí odběratele a ignoruje pozdní odpovědi. |

Stavy jsou `idle`, `loading`, `ready`, `error`. Pole položek a objekt řazení ve snapshotu jsou oddělené kopie; samotné záznamy jsou data aplikace a neměly by se měnit během vykreslování. Listener ani render callback by neměl měnit controller rekurzivně.

Každý nový požadavek přeruší předchozí. Sekvenční kontrola chrání i transport, který abort ignoruje. Při chybě zůstávají předchozí položky. Pokud se počet stránek zmenší, controller jednou opraví stránku a znovu načte data; další nestabilní změna skončí chybou s možností retry. Prázdná sada má jednu prázdnou stránku.

Hledání nemá zabudovaný debounce: aplikace může reagovat na submit formuláře, vlastní časovač nebo search modul. Na serveru validuj povolené sort klíče a limity; controller nevyhodnocuje sloupce jako SQL ani jiný dotaz.

Pro kompaktní formulář filtru lze použít `.data-filter`: na mobilu první label zabere celý řádek, na desktopu vyplní zbývající prostor; tlačítka a pole se zarovnají spodní hranou. Události formuláře aplikace explicitně napojí na controller.

## Tabulka

`createTable(target, options)` připojí vlastní sekci do cíle. Vrátí `{ controller, ready, reload, destroy }`. Vlastní controller začne načítat při vytvoření. Při dodaném `controller` se pouze přihlásí k jeho stavu a `ready` nečeká na jeho externí požadavek.

| Volba | Význam |
| --- | --- |
| `columns` | Neprázdné pole unikátních `{ key, label, sortable?, primary?, render? }`. |
| `caption` | Viditelný název tabulky a dostupný název posuvné oblasti. |
| `responsive` | `'scroll'` (výchozí) nebo `'stack'`. |
| `pagination` | `true` (výchozí), `false`, nebo volby samostatné paginace. |
| `locale`, `messages` | Lokální jazyk a překlady se stejnou prioritou jako ostatní Pure UI. |
| `controller` | Existující sdílený controller; jinak se použijí `load/page/pageSize/query/sort`. |

`primary: true` vytvoří záhlaví řádku (`th scope="row"`). Řaditelný sloupec má skutečné tlačítko a `aria-sort`; kliknutí střídá asc/desc. Zrušit řazení lze přes `controller.setSort(null)`.

`render(value, item, document)` vrací text, číslo, `null` nebo DOM uzel. Řetězce jsou vždy text, nikdy HTML. Každé vykreslení musí vrátit nový uzel; jedna DOM instance se mezi řádky ani pohledy nesdílí. Callback může vytvořit odkazy nebo akční tlačítka aplikace.

### Mobil a desktop

- `scroll`: zachová skutečné sloupce. Široký obsah posouvá pouze pojmenovaný, klávesnicí dosažitelný obal.
- `stack`: pod 960 px vykreslí řádky jako kompaktní bloky s názvy polí z `columns`. Hlavičky zůstanou dostupné asistivním technologiím. Řazení má samostatná mobilní tlačítka. Od 960 px se obnoví klasická tabulka a řazení v hlavičce.

Data ani pořadí buněk se při změně viewportu nepřestavují. Nejde o virtuální grid a nepřidává se vlastní šipková navigace. Šířku sloupců řídí token `--p-table-cell-min` (výchozí 8rem); řádkování a paddingy používají společné control tokeny.

## Seznam a sdílené pohledy

`createList(target, { renderItem, layout = 'rows', label, ...options })` má stejné datové volby, návratové API, stavy a stránkování jako tabulka. `renderItem(item, document)` vrací text nebo nový DOM uzel. Výsledkem je sémantický `ul` s `li`.

`layout: 'cards'` zobrazí jednu kartu na mobilu a od 960 px počet sloupců podle `--p-list-columns` (výchozí 3). Žádné stíny ani pevné lokální paddingy.

```js
const { createDataController } = await loadComponent('data');
const { createList } = await loadComponent('list');
const data = createDataController({ load: loadUsers });
const table = createTable(tableTarget, { controller: data, columns });
const list = createList(listTarget, {
  controller: data,
  pagination: false,
  renderItem: item => `${item.name} · ${item.email}`,
});
await data.reload(); // Jeden požadavek pro oba pohledy.
// table.destroy(); list.destroy(); data.destroy();
```

Pohled zničí pouze controller, který sám vytvořil. Sdílený controller vlastní aplikace. Každé `destroy()` odstraní jen DOM daného pohledu a jeho listenery.

## Samostatná paginace

```js
const { createPagination } = await loadComponent('pagination');
const pagination = createPagination(target, {
  page: 2, pages: 12, total: 230,
  href: page => `/users?page=${page}`,
});
// Pro čisté odkazy není JS callback potřeba.
pagination.update({ page: 3, pages: 12, total: 230 });
```

Volby: `controller`, `page = 1`, `pages = 1`, `total = 0`, `siblings = 1`, `href(page)`, `onChange(page)`, `locale`, `messages`. Je nutný controller, href nebo callback. `siblings` je počet sousedních stránek na každé straně (0–10).

Bez controlleru volá tlačítko `onChange(page)` a aplikace následně použije `update(state)`. Samotné `href` zachovává standardní navigaci. Pokud je vedle href dodaný controller nebo callback, běžný klik používá JS, Ctrl/Cmd/Shift/Alt klik ponechává nativnímu odkazu. Při dodaném controlleru jsou změny i vykreslení automatické; `onChange` se nepoužije.

Desktop ukazuje první, poslední a sousední stránky s výpustkou. Mobil ukazuje předchozí / aktuální / další. Aktuální stránka má `aria-current="page"`, krajní akce jsou zakázané. Focus zůstává na stejné akci, nebo po dosažení hranice přejde na souhrn.

`paginationPages(page, pages, siblings = 1)` je samostatný čistý export z `data.js`. Vrací čísla stránek a `null` pro výpustky. Vhodný i pro serverové generování odkazů.

Globální volby: `configurePure({ data: { pageSize: 20 }, pagination: { siblings: 1 } })`. Překlady používají klíče `pagination`, `pageSummary`, `goPage`, `previousPage`, `nextPage`, `dataTable`, `dataList`, `dataLoading`, `dataEmpty`, `dataError`, `dataCount`, `retry`, `sortRecords`.
