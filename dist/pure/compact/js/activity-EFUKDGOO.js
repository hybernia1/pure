import {
  uiI18n
} from "./chunk-VSLZ2EFS.js";
import "./chunk-JK5BIUAQ.js";
import "./chunk-I2KQSOTD.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/activity.js
function createActivity({ target = document.body, global = target === target.ownerDocument.body, label = uiI18n(target.ownerDocument).t("activity") } = {}) {
  const doc = target.ownerDocument;
  const element = doc.createElement("div");
  element.className = `activity${global ? " activity-global" : ""}`;
  element.setAttribute("role", "status");
  element.setAttribute("aria-live", "polite");
  element.setAttribute("aria-atomic", "true");
  element.hidden = true;
  const spinner = doc.createElement("span");
  spinner.className = "spinner";
  spinner.setAttribute("aria-hidden", "true");
  const text = doc.createElement("span");
  element.append(spinner, text);
  target.append(element);
  const tasks = /* @__PURE__ */ new Map();
  let destroyed = false;
  const render = /* @__PURE__ */ __name(() => {
    element.hidden = !tasks.size;
    text.textContent = [...tasks.values()].at(-1) || "";
  }, "render");
  const start = /* @__PURE__ */ __name((message = label) => {
    if (destroyed) throw new Error("Indik\xE1tor byl odpojen.");
    const token = /* @__PURE__ */ Symbol();
    tasks.set(token, String(message));
    render();
    return () => {
      if (!destroyed && tasks.delete(token)) render();
    };
  }, "start");
  return {
    start,
    async run(task, message = label) {
      if (typeof task !== "function") throw new TypeError("run vy\u017Eaduje funkci.");
      const finish = start(message);
      try {
        return await task();
      } finally {
        finish();
      }
    },
    isActive: /* @__PURE__ */ __name(() => tasks.size > 0, "isActive"),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      tasks.clear();
      element.remove();
    }
  };
}
__name(createActivity, "createActivity");
export {
  createActivity
};
