import {
  appendValue,
  createDataView
} from "./chunk-FNG3MRT7.js";
import "./chunk-OPQZJKKI.js";
import "./chunk-COAQMNDY.js";
import "./chunk-VSLZ2EFS.js";
import "./chunk-JK5BIUAQ.js";
import "./chunk-I2KQSOTD.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/table.js
function createTable(target, options = {}) {
  const { columns, caption, responsive = "scroll" } = options;
  if (!Array.isArray(columns) || !columns.length || !["scroll", "stack"].includes(responsive) || columns.some((column) => !column || typeof column.key !== "string" || !column.key || typeof column.label !== "string" || column.render !== void 0 && typeof column.render !== "function") || new Set(columns.map((column) => column.key)).size !== columns.length) throw new TypeError("Table requires unique columns and scroll or stack layout.");
  return createDataView(target, options, ({ doc, root, controller, t }) => {
    const sortbar = doc.createElement("div");
    sortbar.className = "table-mobile-sort";
    sortbar.setAttribute("role", "group");
    sortbar.setAttribute("aria-label", t("sortRecords"));
    if (responsive === "stack") {
      for (const column of columns.filter((column2) => column2.sortable)) {
        const button = doc.createElement("button");
        button.type = "button";
        button.className = "button button-outline";
        button.textContent = column.label;
        button.dataset.sort = column.key;
        sortbar.append(button);
      }
      if (sortbar.childNodes.length) root.append(sortbar);
    }
    const region = doc.createElement("div");
    region.className = "table-region";
    region.tabIndex = 0;
    region.setAttribute("role", "region");
    region.setAttribute("aria-label", caption || t("dataTable"));
    const table = doc.createElement("table");
    table.className = "table";
    if (responsive === "stack") table.classList.add("table-stack");
    table.setAttribute("role", "table");
    const title = doc.createElement("caption");
    title.textContent = caption || t("dataTable");
    table.append(title);
    const head = doc.createElement("thead");
    const row = doc.createElement("tr");
    row.setAttribute("role", "row");
    const headers = columns.map((column) => {
      const th = doc.createElement("th");
      th.scope = "col";
      th.setAttribute("role", "columnheader");
      if (column.sortable) {
        const button = doc.createElement("button");
        button.type = "button";
        button.className = "table-sort";
        button.textContent = column.label;
        button.dataset.sort = column.key;
        const label = doc.createElement("span");
        label.className = "table-head-label";
        label.textContent = column.label;
        th.append(button, label);
      } else th.textContent = column.label;
      row.append(th);
      return th;
    });
    head.append(row);
    const body = doc.createElement("tbody");
    body.setAttribute("role", "rowgroup");
    table.append(head, body);
    region.append(table);
    root.append(region);
    const click = /* @__PURE__ */ __name((event) => {
      const button = event.target.closest("[data-sort]");
      if (!button || !head.contains(button) && !sortbar.contains(button)) return;
      const sort = controller.getState().sort;
      void controller.setSort({ key: button.dataset.sort, direction: sort?.key === button.dataset.sort && sort.direction === "asc" ? "desc" : "asc" });
    }, "click");
    head.addEventListener("click", click);
    sortbar.addEventListener("click", click);
    return {
      render(state) {
        columns.forEach((column, index) => {
          if (column.sortable) headers[index].setAttribute("aria-sort", state.sort?.key === column.key ? state.sort.direction === "asc" ? "ascending" : "descending" : "none");
        });
        for (const button of sortbar.children) {
          const active = state.sort?.key === button.dataset.sort;
          button.setAttribute("aria-pressed", String(active));
          button.textContent = `${columns.find((column) => column.key === button.dataset.sort).label}${active ? state.sort.direction === "asc" ? " \u2191" : " \u2193" : ""}`;
        }
        if (state.status !== "ready") return;
        const fragment = doc.createDocumentFragment();
        for (const item of state.items) {
          const row2 = doc.createElement("tr");
          row2.setAttribute("role", "row");
          columns.forEach((column) => {
            const cell = doc.createElement(column.primary ? "th" : "td");
            cell.setAttribute("role", column.primary ? "rowheader" : "cell");
            if (column.primary) cell.scope = "row";
            const label = doc.createElement("span");
            label.className = "table-label";
            label.textContent = column.label;
            label.setAttribute("aria-hidden", "true");
            const value = doc.createElement("span");
            value.className = "table-value";
            appendValue(value, column.render ? column.render(item[column.key], item, doc) : item[column.key]);
            cell.append(label, value);
            row2.append(cell);
          });
          fragment.append(row2);
        }
        body.replaceChildren(fragment);
      },
      destroy() {
        head.removeEventListener("click", click);
        sortbar.removeEventListener("click", click);
      }
    };
  });
}
__name(createTable, "createTable");
export {
  createTable
};
