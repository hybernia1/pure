import { componentOptions } from './config.js';

const positive = value => Number.isSafeInteger(value) && value > 0;
const sortValue = sort => {
  if (sort === null) return null;
  if (!sort || typeof sort.key !== 'string' || !sort.key || !['asc', 'desc'].includes(sort.direction)) throw new TypeError('Invalid sort.');
  return { key: sort.key, direction: sort.direction };
};
/** DOM-independent data source. Loading is explicit; newest request wins. */
export function createDataController(options = {}) {
  const { load, page = 1, pageSize = 20, query = '', sort = null } = componentOptions('data', options);
  if (typeof load !== 'function' || !positive(page) || !positive(pageSize) || typeof query !== 'string') throw new TypeError('Invalid data controller options.');
  let state = { page, pageSize, query, sort: sortValue(sort), items: [], total: 0, pages: page, status: 'idle', error: null };
  let sequence = 0; let abort; let destroyed = false;
  const listeners = new Set();
  const snapshot = () => ({ ...state, items: [...state.items], sort: state.sort && { ...state.sort } });
  const notify = () => { for (const listener of listeners) listener(snapshot()); };
  const check = () => { if (destroyed) throw new Error('Data controller destroyed.'); };
  async function reload() {
    check(); const current = ++sequence; abort?.abort(); abort = new AbortController();
    const signal = abort.signal;
    state = { ...state, status: 'loading', error: null }; notify();
    try {
      // A filtered/deleted last page can disappear. Correct it once, never loop indefinitely.
      for (let attempt = 0; attempt < 2; attempt++) {
        const { page, pageSize, query, sort } = snapshot();
        const result = await load({ page, pageSize, query, sort, signal });
        if (destroyed || current !== sequence || signal.aborted) return false;
        if (!result || !Array.isArray(result.items) || !Number.isSafeInteger(result.total) || result.total < 0 || result.items.length > pageSize || result.items.length > result.total) throw new TypeError('Data API must return { items, total }.');
        const pages = Math.max(1, Math.ceil(result.total / pageSize));
        if (page > pages) {
          if (attempt) throw new RangeError('Data page changed repeatedly. Retry the request.');
          state = { ...state, page: pages }; continue;
        }
        state = { ...state, items: [...result.items], total: result.total, pages, status: 'ready', error: null }; notify(); return true;
      }
    } catch (error) {
      if (destroyed || current !== sequence || signal.aborted) return false;
      state = { ...state, status: 'error', error }; notify(); return false;
    }
  }
  return {
    getState: snapshot, reload,
    subscribe(listener) { check(); if (typeof listener !== 'function') throw new TypeError('Listener required.'); listeners.add(listener); try { listener(snapshot()); } catch (error) { listeners.delete(listener); throw error; } return () => listeners.delete(listener); },
    setPage(page) { check(); if (!positive(page)) throw new TypeError('Invalid page.'); state = { ...state, page, pages: Math.max(page, state.pages) }; return reload(); },
    setPageSize(pageSize) { check(); if (!positive(pageSize)) throw new TypeError('Invalid pageSize.'); state = { ...state, pageSize, page: 1 }; return reload(); },
    setQuery(query) { check(); if (typeof query !== 'string') throw new TypeError('Invalid query.'); state = { ...state, query, page: 1 }; return reload(); },
    setSort(sort) { check(); state = { ...state, sort: sortValue(sort), page: 1 }; return reload(); },
    destroy() { if (destroyed) return; destroyed = true; sequence++; abort?.abort(); listeners.clear(); },
  };
}

/** Pure window calculation shared by link and AJAX pagination. */
export function paginationPages(page, pages, siblings = 1) {
  if (!positive(page) || !positive(pages) || page > pages || !Number.isSafeInteger(siblings) || siblings < 0 || siblings > 10) throw new TypeError('Invalid pagination.');
  const selected = new Set([1, pages]);
  for (let value = Math.max(1, page - siblings); value <= Math.min(pages, page + siblings); value++) selected.add(value);
  const result = []; let previous = 0;
  for (const value of [...selected].sort((a, b) => a - b)) {
    if (value - previous === 2) result.push(previous + 1);
    else if (value - previous > 2) result.push(null);
    result.push(value); previous = value;
  }
  return result;
}
