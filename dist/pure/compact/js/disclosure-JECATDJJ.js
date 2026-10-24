import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/disclosure.js
function initDisclosures(scope = document) {
  const cleanups = [];
  scope.querySelectorAll("[data-disclosure]").forEach((button) => {
    const panel = button.ownerDocument.getElementById(button.getAttribute("aria-controls"));
    if (!panel) return;
    const update = /* @__PURE__ */ __name((open) => {
      button.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
    }, "update");
    update(button.getAttribute("aria-expanded") === "true");
    const click = /* @__PURE__ */ __name(() => update(button.getAttribute("aria-expanded") !== "true"), "click");
    const keydown = /* @__PURE__ */ __name((event) => {
      if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
        update(false);
        button.focus();
      }
    }, "keydown");
    button.addEventListener("click", click);
    panel.addEventListener("keydown", keydown);
    cleanups.push(() => {
      button.removeEventListener("click", click);
      panel.removeEventListener("keydown", keydown);
    });
  });
  return () => cleanups.forEach((cleanup) => cleanup());
}
__name(initDisclosures, "initDisclosures");
export {
  initDisclosures
};
