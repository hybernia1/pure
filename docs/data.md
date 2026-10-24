# Tables, lists and pagination

Views share a small data controller. Pure manages request state and UI; the application owns API authorization and field meanings. No automatic DOM scan, dependencies or HTML templates.

[Example](../examples/data.html) - [Integration/responsive tests](../test/data.html)

## Quick start

```js
import { loadComponent } from '@pure-ui/core/lazy';
const { createTable } = await loadComponent('table');
const table = createTable(document.querySelector('#users'), {
  caption: 'Users', responsive: 'stack',
  columns: [
    { key: 'name', label: 'Name', sortable: true, primary: true },
    { key: 'email', label: 'Email' },
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

ready waits for an owned controller's first load and returns true for success, false for error/cancellation. Errors show retry UI. Invalid options throw. Direct table imports require data.css and tokens/base/components, or pure.css. Lazy names: data (no CSS), table, list, pagination (shared data.css).

## Data controller

`createDataController({load,page=1,pageSize=20,query='',sort=null})` needs no DOM and does not start loading automatically. pageSize inherits global defaults. load receives page/pageSize/query/sort/signal and returns `{items,total}` synchronously or asynchronously. Pages are one-based; total is matching records, not pages. items is an array of at most pageSize entries. sort is null or `{key,direction:'asc'|'desc'}`.

| Method | Behavior |
| --- | --- |
| reload() | Load current state; Promise<boolean> success. |
| setPage(number) | Set page and load. |
| setPageSize(number) | Positive integer size; reset to page 1 and load. |
| setQuery(string) | Reset to page 1 and load. |
| setSort(sort) | Set/clear sorting, reset to page 1 and load. |
| getState() | Snapshot: items,total,page,pages,pageSize,query,sort,status,error. |
| subscribe(listener) | Immediately emit state and future changes; return unsubscribe. |
| destroy() | Abort, remove subscribers and ignore late responses. |

Statuses: idle/loading/ready/error. Snapshot items arrays and sort objects are detached, but records remain application-owned data: do not mutate during rendering. Listeners/render callbacks should not recursively change the controller.

New requests abort previous ones; sequence checks also protect against transports ignoring abort. Errors retain previous items. If pages shrink, the controller clamps/reloads once; further unstable responses become retryable errors. Empty datasets have one empty page.

Query changes have no built-in debounce: use form submission, a timer or search UI. Validate sort allowlists and limits on the server. The controller does not interpret fields as SQL. `.data-filter` gives a compact filter form, with a full-width first label on mobile and flexible remaining width on desktop; wire events explicitly.

## Table

createTable(target,options) appends its own section and returns controller, ready, reload, destroy. An owned controller loads immediately; a supplied controller is only subscribed to and ready does not wait for an external request.

| Option | Meaning |
| --- | --- |
| columns | Nonempty unique `{key,label,sortable?,primary?,render?}` entries. |
| caption | Visible caption and accessible scroll-region name. |
| responsive | scroll (default) or stack. |
| pagination | true (default), false, or pagination options. |
| locale/messages | Local language and dictionary overrides. |
| controller | Existing shared controller; otherwise load/page/pageSize/query/sort construct one. |

primary:true creates th scope=row. Sortable headers use buttons and aria-sort, toggling asc/desc; setSort(null) clears sorting. `render(value,item,document)` returns text, number, null or a new DOM node. Strings are never HTML. Do not share one node between rows/views. Render callbacks may create application links/actions.

### Responsive behavior

scroll retains columns and confines horizontal overflow to a named keyboard-reachable region. stack presents compact labeled rows below 960px, keeps headers available to assistive technology and adds mobile sort buttons. At 960px the conventional table/header sorting returns. Resizing does not rebuild data/cell order. This is not a virtual grid and adds no custom arrow navigation. --p-table-cell-min defaults to 8rem; spacing uses shared control tokens.

## Lists and shared views

`createList(target,{renderItem,layout='rows',label,...options})` shares data options, lifecycle, states and pagination. renderItem(item,document) returns text or a new DOM node; output is semantic ul/li. cards layout is one column on mobile and --p-list-columns (default 3) from 960px.

```js
const { createDataController } = await loadComponent('data');
const { createList } = await loadComponent('list');
const data = createDataController({ load: loadUsers });
const table = createTable(tableTarget, { controller: data, columns });
const list = createList(listTarget, {
  controller: data, pagination: false,
  renderItem: item => `${item.name} - ${item.email}`,
});
await data.reload(); // One request for both views.
// table.destroy(); list.destroy(); data.destroy();
```

A view destroys only controllers it created. The application owns shared controllers. Each destroy removes only that view's DOM/listeners.

## Standalone pagination

```js
const { createPagination } = await loadComponent('pagination');
const pagination = createPagination(target, {
  page: 2, pages: 12, total: 230,
  href: page => `/users?page=${page}`,
});
pagination.update({ page: 3, pages: 12, total: 230 });
```

Options: controller, page=1, pages=1, total=0, siblings=1, href(page), onChange(page), locale, messages. Supply a controller, href or callback. siblings is 0..10 neighbors per side.

Without a controller, buttons call onChange and the application calls update. href alone retains normal navigation. With href plus a controller/callback, regular clicks use JS while Ctrl/Cmd/Shift/Alt clicks stay native. With a controller, state/rendering are automatic and onChange is unused.

Desktop shows first/last/neighbor pages with ellipses; mobile shows previous/current/next. Current page uses aria-current=page; boundary actions are disabled. Focus stays on the corresponding action or moves to the summary at a boundary.

Pure `paginationPages(page,pages,siblings=1)` from data.js returns page numbers and null ellipses, useful for server-rendered links. Defaults: configurePure({data:{pageSize:20},pagination:{siblings:1}}). Translation keys: pagination, pageSummary, goPage, previousPage, nextPage, dataTable, dataList, dataLoading, dataEmpty, dataError, dataCount, retry, sortRecords.
