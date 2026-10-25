import {
  uiI18n
} from "./chunk-C6Z2H5Y3.js";
import {
  getPureConfig
} from "./chunk-VKBN75Z7.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/controls.js
var controlId = 0;
var proxies = /* @__PURE__ */ new WeakMap();
var formControl = /* @__PURE__ */ __name((source) => proxies.get(source) || source, "formControl");
function registerFormControl(source, control) {
  if (proxies.has(source)) throw new Error("Field already has a custom control.");
  proxies.set(source, control);
  return () => {
    if (proxies.get(source) === control) proxies.delete(source);
  };
}
__name(registerFormControl, "registerFormControl");
var iconsUrl = new URL("../icons.svg", import.meta.url).href;
function icon(doc, name, sprite = getPureConfig().iconsUrl) {
  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "icon");
  svg.setAttribute("aria-hidden", "true");
  const use = doc.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `${sprite}#${name}`);
  svg.append(use);
  return svg;
}
__name(icon, "icon");
function iconButton(doc, name, label) {
  const button = doc.createElement("button");
  button.type = "button";
  button.className = "icon-button";
  button.setAttribute("aria-label", label);
  button.title = label;
  button.append(icon(doc, name));
  return button;
}
__name(iconButton, "iconButton");
function emitValue(source) {
  const Event = source.ownerDocument.defaultView.Event;
  source.dispatchEvent(new Event("input", { bubbles: true }));
  source.dispatchEvent(new Event("change", { bubbles: true }));
}
__name(emitValue, "emitValue");
function createFieldPopup(source, { glyph, kind, placeholder, editable = false }) {
  if (proxies.has(source)) throw new Error("Pole u\u017E m\xE1 vlastn\xED ovl\xE1d\xE1n\xED.");
  const doc = source.ownerDocument;
  const win = doc.defaultView;
  const originalHidden = source.hidden;
  const { t } = uiI18n(doc);
  const wrapper = doc.createElement("div");
  wrapper.className = "control control-with-icon control-with-action";
  const leading = icon(doc, glyph);
  leading.classList.add("control-icon");
  const trailing = icon(doc, "chevron-down");
  trailing.classList.add("control-end");
  const trigger = doc.createElement("button");
  trigger.type = "button";
  trigger.className = "input control-trigger";
  const entry = editable ? doc.createElement("input") : null;
  if (entry) {
    entry.type = "text";
    entry.className = "input control-entry";
    entry.dataset.pureProxy = "";
    entry.autocomplete = "off";
    trigger.className = "icon-button control-action";
    trigger.append(icon(doc, glyph));
  }
  trigger.setAttribute("aria-haspopup", kind);
  trigger.setAttribute("aria-expanded", "false");
  const text = doc.createElement("span");
  text.className = "control-value";
  if (!entry) trigger.append(text);
  const panel = doc.createElement("div");
  panel.className = "control-panel";
  panel.id = `pure-panel-${++controlId}`;
  panel.setAttribute("role", kind);
  panel.setAttribute("popover", "auto");
  trigger.setAttribute("aria-controls", panel.id);
  source.before(wrapper);
  wrapper.append(source, leading, ...entry ? [entry, trigger] : [trigger, trailing], panel);
  source.hidden = true;
  proxies.set(source, entry || trigger);
  const listeners = [];
  let resetTimer;
  let destroyed = false;
  let pointerWasOpen = false;
  const listen = /* @__PURE__ */ __name((node, type, fn, options) => {
    node.addEventListener(type, fn, options);
    listeners.push(() => node.removeEventListener(type, fn, options));
  }, "listen");
  const isOpen = /* @__PURE__ */ __name(() => panel.matches(":popover-open"), "isOpen");
  const position = /* @__PURE__ */ __name(() => {
    if (!isOpen()) return;
    const rect = (entry || trigger).getBoundingClientRect();
    const gutter = parseFloat(win.getComputedStyle(panel).scrollMarginTop) || 0;
    panel.style.width = `max(${rect.width}px, var(--p-picker-width))`;
    const width = panel.getBoundingClientRect().width;
    panel.style.left = `${Math.max(gutter, Math.min(rect.left, win.innerWidth - width - gutter))}px`;
    panel.style.maxHeight = `${Math.max(rect.top - gutter, win.innerHeight - rect.bottom - gutter)}px`;
    const height = panel.getBoundingClientRect().height;
    const top = rect.bottom + height <= win.innerHeight - gutter ? rect.bottom : Math.max(gutter, rect.top - height);
    panel.style.top = `${top}px`;
  }, "position");
  const close = /* @__PURE__ */ __name((focus = false) => {
    if (isOpen()) panel.hidePopover();
    trigger.setAttribute("aria-expanded", "false");
    if (focus && !trigger.disabled) (entry || trigger).focus();
  }, "close");
  let onOpen = /* @__PURE__ */ __name(() => {
  }, "onOpen");
  let onRefresh = /* @__PURE__ */ __name(() => {
  }, "onRefresh");
  const refresh = /* @__PURE__ */ __name(() => {
    if (destroyed) return;
    trigger.disabled = source.matches(":disabled") || source.readOnly;
    if (entry) {
      entry.disabled = source.matches(":disabled");
      entry.readOnly = source.readOnly;
    }
    for (const name of ["aria-invalid", "aria-describedby", "aria-required"]) {
      const value = name === "aria-required" ? String(source.required) : source.getAttribute(name);
      if (value === null) (entry || trigger).removeAttribute(name);
      else (entry || trigger).setAttribute(name, value);
    }
    if (trigger.disabled) close();
    onRefresh();
    position();
  }, "refresh");
  const setDisplay = /* @__PURE__ */ __name((value) => {
    const label = [...source.labels || []].map((label2) => label2.textContent.trim()).join(" ") || source.getAttribute("aria-label") || t("selection");
    text.textContent = value || placeholder;
    text.classList.toggle("text-subtle", !value);
    trigger.setAttribute("aria-label", `${label}: ${value || placeholder}`);
    panel.setAttribute("aria-label", label);
    if (entry) {
      entry.setAttribute("aria-label", label);
      entry.placeholder = placeholder;
      trigger.setAttribute("aria-label", t("openSelection", { label }));
      if (doc.activeElement !== entry) entry.value = value;
    }
  }, "setDisplay");
  const open = /* @__PURE__ */ __name(() => {
    refresh();
    if (trigger.disabled || destroyed) return;
    panel.showPopover();
    trigger.setAttribute("aria-expanded", "true");
    onOpen();
    position();
  }, "open");
  listen(trigger, "pointerdown", () => {
    pointerWasOpen = isOpen();
  });
  listen(trigger, "click", () => {
    if (isOpen() || pointerWasOpen) close();
    else open();
    pointerWasOpen = false;
  });
  listen(trigger, "keydown", (event) => {
    if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      open();
    }
  });
  if (entry) listen(entry, "keydown", (event) => {
    if (event.altKey && event.key === "ArrowDown") {
      event.preventDefault();
      open();
    }
  });
  listen(panel, "toggle", () => {
    trigger.setAttribute("aria-expanded", String(isOpen()));
  });
  listen(panel, "keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    }
  });
  listen(doc, "focusin", (event) => {
    if (isOpen() && !wrapper.contains(event.target)) close();
  });
  listen(wrapper, "focusout", (event) => {
    if (event.target !== source && !wrapper.contains(event.relatedTarget)) source.dispatchEvent(new win.FocusEvent("focusout", { bubbles: true, relatedTarget: event.relatedTarget }));
  });
  for (const label of source.labels || []) listen(label, "click", (event) => {
    if (wrapper.contains(event.target)) return;
    event.preventDefault();
    (entry || trigger).focus();
  });
  listen(source, "change", refresh);
  listen(source, "input", refresh);
  listen(win, "resize", position);
  listen(doc, "scroll", position, true);
  if (source.form) listen(source.form, "reset", (event) => {
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      if (!event.defaultPrevented && !destroyed) {
        close();
        refresh();
      }
    }, 0);
  });
  const observer = new win.MutationObserver(refresh);
  observer.observe(source, { attributes: true, childList: true, subtree: true, characterData: true });
  for (const ancestor of wrapper.parentElement?.closest("fieldset") ? [wrapper.parentElement.closest("fieldset")] : []) observer.observe(ancestor, { attributes: true, attributeFilter: ["disabled"] });
  return {
    wrapper,
    trigger,
    entry,
    panel,
    listen,
    open,
    close,
    isOpen,
    refresh,
    setDisplay,
    configure({ onOpen: openCallback, onRefresh: refreshCallback }) {
      onOpen = openCallback;
      onRefresh = refreshCallback;
      refresh();
    },
    destroy() {
      close();
      destroyed = true;
      clearTimeout(resetTimer);
      observer.disconnect();
      listeners.forEach((cleanup) => cleanup());
      proxies.delete(source);
      wrapper.before(source);
      wrapper.remove();
      source.hidden = originalHidden;
    }
  };
}
__name(createFieldPopup, "createFieldPopup");

export {
  formControl,
  registerFormControl,
  icon,
  iconButton,
  emitValue,
  createFieldPopup
};
