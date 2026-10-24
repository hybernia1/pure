import {
  icon
} from "./chunk-AWOEZM7Z.js";
import {
  uiI18n
} from "./chunk-VSLZ2EFS.js";
import "./chunk-JK5BIUAQ.js";
import "./chunk-I2KQSOTD.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/resize.js
var instances = /* @__PURE__ */ new WeakMap();
function createResize(target, {
  container = target.parentElement,
  width = 100,
  min = 10,
  max = 100,
  step = 1,
  label = uiI18n(target.ownerDocument).t("width"),
  help = uiI18n(target.ownerDocument).t("resizeHelp"),
  iconsUrl,
  onChange = /* @__PURE__ */ __name(() => {
  }, "onChange"),
  onCommit = /* @__PURE__ */ __name(() => {
  }, "onCommit")
} = {}) {
  if (!container || instances.has(target)) throw new TypeError("Resize vy\u017Eaduje kontejner a dosud neinicializovan\xFD prvek.");
  if (![width, min, max, step].every(Number.isFinite) || min <= 0 || max > 100 || min > max || step <= 0) throw new TypeError("Neplatn\xE9 meze resize.");
  const doc = target.ownerDocument;
  const win = doc.defaultView;
  const originalWidth = target.style.getPropertyValue("width");
  const priority = target.style.getPropertyPriority("width");
  const hadClass = target.classList.contains("resizable");
  const handle = doc.createElement("span");
  handle.className = "resize-handle";
  handle.dataset.resizeHandle = "";
  handle.tabIndex = 0;
  handle.setAttribute("role", "slider");
  handle.setAttribute("aria-label", label);
  handle.setAttribute("aria-orientation", "horizontal");
  handle.setAttribute("aria-valuemin", min);
  handle.setAttribute("aria-valuemax", max);
  handle.title = help;
  handle.append(icon(doc, "resize", iconsUrl));
  const snap = /* @__PURE__ */ __name((number) => Math.max(min, Math.min(max, Number((min + Math.round((number - min) / step) * step).toFixed(2)))), "snap");
  let current = snap(width);
  let gesture = null;
  let destroyed = false;
  let pointerCleanups = [];
  const stopPointer = /* @__PURE__ */ __name(() => {
    pointerCleanups.forEach((cleanup) => cleanup());
    pointerCleanups = [];
  }, "stopPointer");
  const listeners = [];
  const listen = /* @__PURE__ */ __name((element, type, callback) => {
    element.addEventListener(type, callback);
    listeners.push(() => element.removeEventListener(type, callback));
  }, "listen");
  const paint = /* @__PURE__ */ __name(() => {
    target.style.width = `${current}%`;
    handle.setAttribute("aria-valuenow", current);
    handle.setAttribute("aria-valuetext", `${current} %`);
  }, "paint");
  const change = /* @__PURE__ */ __name((number) => {
    const next = snap(number);
    if (next === current) return false;
    current = next;
    paint();
    onChange(current);
    return true;
  }, "change");
  const finish = /* @__PURE__ */ __name((cancel) => {
    if (!gesture) return;
    const previous = gesture;
    gesture = null;
    target.removeAttribute("data-resizing");
    stopPointer();
    if (handle.hasPointerCapture?.(previous.id)) handle.releasePointerCapture(previous.id);
    if (cancel) {
      change(previous.width);
      return;
    }
    if (current !== previous.width) onCommit(current);
  }, "finish");
  const setWidth = /* @__PURE__ */ __name((number) => {
    if (destroyed) throw new Error("Resize byl odpojen.");
    if (!Number.isFinite(number)) throw new TypeError("\u0160\xED\u0159ka mus\xED b\xFDt \u010D\xEDslo.");
    finish(true);
    if (change(number)) onCommit(current);
    return current;
  }, "setWidth");
  const startPointer = /* @__PURE__ */ __name(() => {
    const callbacks = {
      pointermove(event) {
        if (!gesture || gesture.id !== event.pointerId) return;
        event.preventDefault();
        change(gesture.width + (event.clientX - gesture.x) / gesture.size * 100);
      },
      pointerup(event) {
        if (gesture?.id === event.pointerId) finish(false);
      },
      pointercancel(event) {
        if (gesture?.id === event.pointerId) finish(true);
      },
      blur() {
        finish(true);
      }
    };
    for (const [type, callback] of Object.entries(callbacks)) {
      win.addEventListener(type, callback);
      pointerCleanups.push(() => win.removeEventListener(type, callback));
    }
  }, "startPointer");
  listen(handle, "pointerdown", (event) => {
    if (gesture || event.button !== 0 || event.isPrimary === false) return;
    const style = win.getComputedStyle(container);
    const size = container.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    if (size <= 0) return;
    event.preventDefault();
    event.stopPropagation();
    handle.focus();
    gesture = { id: event.pointerId, x: event.clientX, width: current, size };
    startPointer();
    target.dataset.resizing = "";
    try {
      handle.setPointerCapture(event.pointerId);
    } catch {
    }
  });
  listen(handle, "lostpointercapture", () => finish(true));
  listen(handle, "keydown", (event) => {
    if (event.key === "Escape" && gesture) {
      event.preventDefault();
      event.stopPropagation();
      finish(true);
      return;
    }
    const values = { ArrowLeft: current - step, ArrowDown: current - step, ArrowRight: current + step, ArrowUp: current + step, Home: min, End: max };
    if (!(event.key in values)) return;
    event.preventDefault();
    event.stopPropagation();
    setWidth(values[event.key]);
  });
  target.classList.add("resizable");
  target.append(handle);
  paint();
  const api = {
    getWidth: /* @__PURE__ */ __name(() => current, "getWidth"),
    setWidth,
    smaller: /* @__PURE__ */ __name(() => setWidth(current - step), "smaller"),
    larger: /* @__PURE__ */ __name(() => setWidth(current + step), "larger"),
    destroy() {
      if (destroyed) return;
      gesture = null;
      destroyed = true;
      stopPointer();
      listeners.forEach((cleanup) => cleanup());
      handle.remove();
      target.removeAttribute("data-resizing");
      if (!hadClass) target.classList.remove("resizable");
      if (originalWidth) target.style.setProperty("width", originalWidth, priority);
      else target.style.removeProperty("width");
      instances.delete(target);
    }
  };
  instances.set(target, api);
  return api;
}
__name(createResize, "createResize");
export {
  createResize
};
