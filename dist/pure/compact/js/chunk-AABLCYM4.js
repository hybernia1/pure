import {
  componentOptions
} from "./chunk-VKBN75Z7.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/data.js
var positive = /* @__PURE__ */ __name((value) => Number.isSafeInteger(value) && value > 0, "positive");
var sortValue = /* @__PURE__ */ __name((sort) => {
  if (sort === null) return null;
  if (!sort || typeof sort.key !== "string" || !sort.key || !["asc", "desc"].includes(sort.direction)) throw new TypeError("Invalid sort.");
  return { key: sort.key, direction: sort.direction };
}, "sortValue");
function createDataController(options = {}) {
  const { load, page = 1, pageSize = 20, query = "", sort = null } = componentOptions("data", options);
  if (typeof load !== "function" || !positive(page) || !positive(pageSize) || typeof query !== "string") throw new TypeError("Invalid data controller options.");
  let state = { page, pageSize, query, sort: sortValue(sort), items: [], total: 0, pages: page, status: "idle", error: null };
  let sequence = 0;
  let abort;
  let destroyed = false;
  const listeners = /* @__PURE__ */ new Set();
  const snapshot = /* @__PURE__ */ __name(() => ({ ...state, items: [...state.items], sort: state.sort && { ...state.sort } }), "snapshot");
  const notify = /* @__PURE__ */ __name(() => {
    for (const listener of listeners) listener(snapshot());
  }, "notify");
  const check = /* @__PURE__ */ __name(() => {
    if (destroyed) throw new Error("Data controller destroyed.");
  }, "check");
  async function reload() {
    check();
    const current = ++sequence;
    abort?.abort();
    abort = new AbortController();
    const signal = abort.signal;
    state = { ...state, status: "loading", error: null };
    notify();
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const { page: page2, pageSize: pageSize2, query: query2, sort: sort2 } = snapshot();
        const result = await load({ page: page2, pageSize: pageSize2, query: query2, sort: sort2, signal });
        if (destroyed || current !== sequence || signal.aborted) return false;
        if (!result || !Array.isArray(result.items) || !Number.isSafeInteger(result.total) || result.total < 0 || result.items.length > pageSize2 || result.items.length > result.total) throw new TypeError("Data API must return { items, total }.");
        const pages = Math.max(1, Math.ceil(result.total / pageSize2));
        if (page2 > pages) {
          if (attempt) throw new RangeError("Data page changed repeatedly. Retry the request.");
          state = { ...state, page: pages };
          continue;
        }
        state = { ...state, items: [...result.items], total: result.total, pages, status: "ready", error: null };
        notify();
        return true;
      }
    } catch (error) {
      if (destroyed || current !== sequence || signal.aborted) return false;
      state = { ...state, status: "error", error };
      notify();
      return false;
    }
  }
  __name(reload, "reload");
  return {
    getState: snapshot,
    reload,
    subscribe(listener) {
      check();
      if (typeof listener !== "function") throw new TypeError("Listener required.");
      listeners.add(listener);
      try {
        listener(snapshot());
      } catch (error) {
        listeners.delete(listener);
        throw error;
      }
      return () => listeners.delete(listener);
    },
    setPage(page2) {
      check();
      if (!positive(page2)) throw new TypeError("Invalid page.");
      state = { ...state, page: page2, pages: Math.max(page2, state.pages) };
      return reload();
    },
    setPageSize(pageSize2) {
      check();
      if (!positive(pageSize2)) throw new TypeError("Invalid pageSize.");
      state = { ...state, pageSize: pageSize2, page: 1 };
      return reload();
    },
    setQuery(query2) {
      check();
      if (typeof query2 !== "string") throw new TypeError("Invalid query.");
      state = { ...state, query: query2, page: 1 };
      return reload();
    },
    setSort(sort2) {
      check();
      state = { ...state, sort: sortValue(sort2), page: 1 };
      return reload();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      sequence++;
      abort?.abort();
      listeners.clear();
    }
  };
}
__name(createDataController, "createDataController");
function paginationPages(page, pages, siblings = 1) {
  if (!positive(page) || !positive(pages) || page > pages || !Number.isSafeInteger(siblings) || siblings < 0 || siblings > 10) throw new TypeError("Invalid pagination.");
  const selected = /* @__PURE__ */ new Set([1, pages]);
  for (let value = Math.max(1, page - siblings); value <= Math.min(pages, page + siblings); value++) selected.add(value);
  const result = [];
  let previous = 0;
  for (const value of [...selected].sort((a, b) => a - b)) {
    if (value - previous === 2) result.push(previous + 1);
    else if (value - previous > 2) result.push(null);
    result.push(value);
    previous = value;
  }
  return result;
}
__name(paginationPages, "paginationPages");

export {
  createDataController,
  paginationPages
};
