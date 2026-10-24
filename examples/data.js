import { loadComponent, configurePure } from '../dist/pure/js/lazy.js';

configurePure({ data: { pageSize: 10 } });
const initial = document.querySelector('#data-init');
try {
  const [{ createDataController }, { createTable }, { createList }, { createPagination }, { request }, { createSelect }] = await Promise.all(['data', 'table', 'list', 'pagination', 'ajax', 'select'].map(name => loadComponent(name)));
  createSelect(document.querySelector('#data-size'));
  const params = new URLSearchParams(location.search); const requestedPage = Number(params.get('page'));
  const controller = createDataController({
    page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    async load({ page, pageSize, query, sort, signal }) {
      // The demo fetches a local dataset. A real API performs filtering/sorting/paging server-side.
      const records = await request('./users.json', { type: 'json', signal });
      const filtered = records.filter(item => `${item.name} ${item.email}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
      if (sort) filtered.sort((a, b) => String(a[sort.key]).localeCompare(String(b[sort.key]), 'cs', { numeric: true }) * (sort.direction === 'desc' ? -1 : 1));
      return { items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length };
    },
  });
  const columns = [
    { key: 'name', label: 'Jméno', primary: true, sortable: true },
    { key: 'email', label: 'E-mail', sortable: true },
    { key: 'team', label: 'Tým', sortable: true },
    { key: 'status', label: 'Stav', render(value, item, doc) { const badge = doc.createElement('span'); badge.className = 'badge'; badge.textContent = value; return badge; } },
  ];
  createTable(document.querySelector('#data-table'), { controller, columns, caption: 'Uživatelé', responsive: 'stack' });
  createList(document.querySelector('#data-list'), { controller, layout: 'cards', pagination: false, renderItem(item, doc) {
    const block = doc.createElement('div'); const name = doc.createElement('strong'); name.textContent = item.name;
    const email = doc.createElement('p'); email.className = 'text-sm text-subtle'; email.textContent = item.email; block.append(name, email); return block;
  } });
  createTable(document.querySelector('#data-scroll'), { controller, columns, caption: 'Uživatelé ve sloupcích', pagination: false });
  createPagination(document.querySelector('#data-links'), { controller, href: page => `?page=${page}` });
  // With a controller, ordinary clicks use AJAX; Ctrl/Cmd-click keeps normal link navigation.
  document.querySelector('#data-filter').addEventListener('submit', event => { event.preventDefault(); void controller.setQuery(document.querySelector('#data-query').value); });
  document.querySelector('#data-size').addEventListener('change', event => { void controller.setPageSize(Number(event.target.value)); });
  initial.hidden = true; await controller.reload();
} catch { initial.textContent = 'Moduly se nepodařilo načíst. Obnov stránku.'; }
