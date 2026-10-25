import {
  appendValue,
  createDataView
} from "./chunk-2OUCOSP5.js";
import "./chunk-2O6CB7JK.js";
import "./chunk-AABLCYM4.js";
import "./chunk-C6Z2H5Y3.js";
import "./chunk-VKBN75Z7.js";
import "./chunk-I2KQSOTD.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/list.js
function createList(target, options = {}) {
  const { renderItem, layout = "rows", label } = options;
  if (typeof renderItem !== "function" || !["rows", "cards"].includes(layout)) throw new TypeError("List requires renderItem and rows or cards layout.");
  return createDataView(target, options, ({ doc, root, t }) => {
    const list = doc.createElement("ul");
    list.className = `data-list data-list-${layout}`;
    list.setAttribute("aria-label", label || t("dataList"));
    root.append(list);
    return { render(state) {
      if (state.status !== "ready") return;
      const fragment = doc.createDocumentFragment();
      for (const item of state.items) {
        const row = doc.createElement("li");
        appendValue(row, renderItem(item, doc));
        fragment.append(row);
      }
      list.replaceChildren(fragment);
    } };
  });
}
__name(createList, "createList");
export {
  createList
};
