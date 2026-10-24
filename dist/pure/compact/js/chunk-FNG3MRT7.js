import {
  createPagination
} from "./chunk-OPQZJKKI.js";
import {
  createDataController
} from "./chunk-COAQMNDY.js";
import {
  uiI18n
} from "./chunk-VSLZ2EFS.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/data-view.js
function appendValue(node, value) {
  if (value && typeof value === "object" && typeof value.nodeType === "number") node.append(value);
  else node.textContent = value == null ? "" : String(value);
}
__name(appendValue, "appendValue");
function createDataView(target, options, setup) {
  const { controller: external, pagination = true, locale, messages } = options;
  const controller = external || createDataController(options);
  const doc = target.ownerDocument;
  const { t } = uiI18n(doc, { locale, messages });
  const root = doc.createElement("section");
  root.className = "data-view";
  const status = doc.createElement("p");
  status.className = "data-status";
  status.setAttribute("role", "status");
  const retry = doc.createElement("button");
  retry.type = "button";
  retry.className = "button button-outline";
  retry.textContent = t("retry");
  retry.hidden = true;
  root.append(status, retry);
  target.append(root);
  let unsubscribe;
  let pager;
  let view;
  let destroyed = false;
  const reload = /* @__PURE__ */ __name(() => {
    void controller.reload();
  }, "reload");
  retry.addEventListener("click", reload);
  try {
    view = setup({ doc, root, controller, t });
    unsubscribe = controller.subscribe((state) => {
      root.setAttribute("aria-busy", String(state.status === "loading"));
      root.dataset.state = state.status === "error" ? "error" : "info";
      status.textContent = t(state.status === "loading" ? "dataLoading" : state.status === "error" ? "dataError" : state.status === "ready" && !state.items.length ? "dataEmpty" : "dataCount", { count: state.total });
      retry.hidden = state.status !== "error";
      view.render(state);
    });
    if (pagination) pager = createPagination(root, { ...typeof pagination === "object" ? pagination : {}, controller, locale, messages });
  } catch (error) {
    unsubscribe?.();
    view?.destroy?.();
    root.remove();
    if (!external) controller.destroy();
    throw error;
  }
  const ready = external ? Promise.resolve() : controller.reload();
  return { controller, ready, reload: controller.reload, destroy() {
    if (destroyed) return;
    destroyed = true;
    unsubscribe();
    pager?.destroy();
    view.destroy?.();
    retry.removeEventListener("click", reload);
    root.remove();
    if (!external) controller.destroy();
  } };
}
__name(createDataView, "createDataView");

export {
  appendValue,
  createDataView
};
