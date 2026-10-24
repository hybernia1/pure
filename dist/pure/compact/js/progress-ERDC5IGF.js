import {
  assertState
} from "./chunk-ZIRF3LQT.js";
import {
  uiI18n
} from "./chunk-VSLZ2EFS.js";
import "./chunk-JK5BIUAQ.js";
import "./chunk-I2KQSOTD.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/progress.js
var instances = /* @__PURE__ */ new WeakSet();
function createProgress(target, { max = 100, value = 0, label = uiI18n(target.ownerDocument).t("progress") } = {}) {
  if (instances.has(target)) throw new Error("Progress u\u017E je inicializovan\xFD.");
  if (!Number.isFinite(max) || max <= 0) throw new TypeError("Maximum mus\xED b\xFDt kladn\xE9 \u010D\xEDslo.");
  const normalize = /* @__PURE__ */ __name((number) => {
    if (number === null) return null;
    if (!Number.isFinite(number)) throw new TypeError("Pr\u016Fb\u011Bh mus\xED b\xFDt \u010D\xEDslo nebo null.");
    return Math.max(0, Math.min(max, number));
  }, "normalize");
  let current = normalize(value);
  let destroyed = false;
  const doc = target.ownerDocument;
  const { t } = uiI18n(doc);
  const element = doc.createElement("div");
  element.className = "progress";
  const description = doc.createElement("div");
  description.className = "progress-description";
  const text = doc.createElement("span");
  text.textContent = label;
  const amount = doc.createElement("span");
  amount.setAttribute("aria-hidden", "true");
  description.append(text, amount);
  const track = doc.createElement("div");
  track.className = "progress-track";
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", max);
  const fill = doc.createElement("span");
  fill.className = "progress-fill";
  track.append(fill);
  const status = doc.createElement("span");
  status.className = "sr-only";
  status.setAttribute("role", "status");
  element.append(description, track, status);
  target.append(element);
  instances.add(target);
  const check = /* @__PURE__ */ __name(() => {
    if (destroyed) throw new Error("Progress byl odpojen.");
  }, "check");
  const render = /* @__PURE__ */ __name(() => {
    const percent = current === null ? null : Math.round(current / max * 100);
    element.dataset.indeterminate = String(current === null);
    track.setAttribute("aria-label", text.textContent);
    if (current === null) track.removeAttribute("aria-valuenow");
    else track.setAttribute("aria-valuenow", current);
    amount.textContent = percent === null ? t("pending") : `${percent} %`;
    fill.style.width = percent === null ? "" : `${current / max * 100}%`;
  }, "render");
  render();
  return {
    set(number) {
      check();
      current = normalize(number);
      render();
    },
    getValue: /* @__PURE__ */ __name(() => current, "getValue"),
    setState(state, message) {
      check();
      if (state !== null) assertState(state);
      if (state === null) element.removeAttribute("data-state");
      else element.dataset.state = state;
      text.textContent = message ?? (state === null ? label : t(state));
      status.textContent = state === null ? "" : text.textContent;
      render();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      element.remove();
      instances.delete(target);
    }
  };
}
__name(createProgress, "createProgress");
export {
  createProgress
};
