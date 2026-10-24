import {
  createSearch
} from "./chunk-V6KQCIH2.js";
import "./chunk-N4CE4EFC.js";
import {
  emitValue,
  iconButton,
  registerFormControl
} from "./chunk-AWOEZM7Z.js";
import {
  uiI18n
} from "./chunk-VSLZ2EFS.js";
import "./chunk-JK5BIUAQ.js";
import "./chunk-I2KQSOTD.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/tag-picker.js
var nextId = 0;
var instances = /* @__PURE__ */ new WeakSet();
var normalized = /* @__PURE__ */ __name((text) => text.normalize("NFC").trim().toLowerCase(), "normalized");
function createTagPicker(source, {
  allowCreate = true,
  maxTags = Infinity,
  fetch: fetchTags,
  url,
  delay = 250,
  minLength = 1,
  limit = 8,
  locale,
  messages,
  onChange = /* @__PURE__ */ __name(() => {
  }, "onChange")
} = {}) {
  if (source.tagName !== "SELECT" || !source.multiple || instances.has(source)) throw new TypeError("Tag picker requires an uninitialized multiple select.");
  if (typeof allowCreate !== "boolean" || !(maxTags === Infinity || Number.isSafeInteger(maxTags) && maxTags > 0) || typeof onChange !== "function" || fetchTags !== void 0 && typeof fetchTags !== "function" || !Number.isFinite(delay) || delay < 0 || !Number.isSafeInteger(minLength) || minLength < 0 || !Number.isSafeInteger(limit) || limit < 1) throw new TypeError("Invalid tag picker options.");
  const doc = source.ownerDocument;
  const win = doc.defaultView;
  const { t } = uiI18n(doc, { locale, messages });
  const node = /* @__PURE__ */ __name((tag, className, text) => {
    const el = doc.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }, "node");
  const options = /* @__PURE__ */ __name(() => [...source.options], "options");
  if (new Set(options().map((option) => option.value)).size !== options().length || options().some((option) => !option.value || !option.label.trim() || option.label.includes(","))) throw new TypeError("Tags require unique nonempty values and comma-free labels.");
  if (options().filter((option) => option.selected).length > maxTags) throw new RangeError("Initial tags exceed maxTags.");
  const hidden = source.hidden;
  const wrapper = node("div", "tag-picker");
  const entryRow = node("div", "tag-picker-entry");
  const entry = node("input", "input");
  entry.type = "text";
  entry.id = `pure-tags-${++nextId}`;
  entry.dataset.pureProxy = "";
  entry.autocomplete = "off";
  const label = source.labels?.[0];
  entry.setAttribute("aria-label", label?.textContent || t("tags"));
  if (source.getAttribute("aria-describedby")) entry.setAttribute("aria-describedby", source.getAttribute("aria-describedby"));
  const add = node("button", "button button-outline", t("tagAdd"));
  add.type = "button";
  const help = node("p", "field-help", t("tagHelp"));
  help.id = `${entry.id}-help`;
  const described = [entry.getAttribute("aria-describedby"), help.id].filter(Boolean).join(" ");
  entry.setAttribute("aria-describedby", described);
  const list = node("ul", "tag-picker-list");
  list.setAttribute("aria-label", t("tagSelected"));
  const status = node("p", "field-help state-text");
  status.setAttribute("role", "status");
  status.setAttribute("aria-atomic", "true");
  const unregister = registerFormControl(source, entry);
  source.before(wrapper);
  wrapper.append(source, entryRow, help, list, status);
  entryRow.append(entry, add);
  source.hidden = true;
  let destroyed = false;
  let updating = false;
  let resetTimer;
  const created = /* @__PURE__ */ new Set();
  const listeners = [];
  const listen = /* @__PURE__ */ __name((target, type, fn) => {
    target.addEventListener(type, fn);
    listeners.push(() => target.removeEventListener(type, fn));
  }, "listen");
  const disabled = /* @__PURE__ */ __name(() => source.matches(":disabled"), "disabled");
  const selected = /* @__PURE__ */ __name(() => options().filter((option) => option.selected), "selected");
  const announce = /* @__PURE__ */ __name((text, state = "info") => {
    status.textContent = text;
    status.dataset.state = state;
  }, "announce");
  const render = /* @__PURE__ */ __name(() => {
    list.replaceChildren();
    entry.disabled = disabled();
    add.disabled = disabled();
    entry.setAttribute("aria-required", String(source.required));
    entry.setAttribute("aria-invalid", String(!source.validity.valid));
    entry.setAttribute("aria-describedby", [source.getAttribute("aria-describedby"), help.id].filter(Boolean).join(" "));
    for (const option of selected()) {
      const item = node("li", "tag-picker-tag");
      item.append(node("span", "", option.label));
      const remove = iconButton(doc, "close", t("tagRemove", { name: option.label }));
      remove.dataset.tagRemove = option.value;
      remove.disabled = disabled() || option.disabled || Boolean(option.closest("optgroup")?.disabled);
      item.append(remove);
      list.append(item);
    }
  }, "render");
  const notify = /* @__PURE__ */ __name(() => {
    updating = true;
    try {
      emitValue(source);
    } finally {
      updating = false;
    }
    onChange(selected().map((option) => ({ value: option.value, label: option.label, created: created.has(option) })));
  }, "notify");
  const addTag = /* @__PURE__ */ __name((item) => {
    if (disabled()) return false;
    if (typeof item !== "string" && (!item || typeof item.label !== "string" || typeof item.value !== "string" || !item.value)) throw new TypeError("A tag requires label and value strings.");
    const label2 = String(typeof item === "string" ? item : item.label).trim();
    if (!label2 || label2.includes(",")) return false;
    const existing = options().find((option2) => typeof item !== "string" && option2.value === item.value || normalized(option2.label) === normalized(label2));
    if (existing?.selected) {
      announce(t("tagDuplicate", { name: label2 }));
      return false;
    }
    if (existing?.disabled || existing?.closest("optgroup")?.disabled) return false;
    if (selected().length >= maxTags) {
      announce(t("tagLimit", { count: maxTags }), "error");
      return false;
    }
    let option = existing;
    if (!option) {
      if (typeof item === "string" && options().some((option2) => option2.value === label2)) {
        announce(t("tagUnknown", { name: label2 }), "error");
        return false;
      }
      if (typeof item === "string" && !allowCreate) {
        announce(t("tagUnknown", { name: label2 }), "error");
        return false;
      }
      option = node("option");
      option.value = typeof item === "string" ? label2 : item.value;
      option.textContent = label2;
      source.append(option);
      created.add(option);
    }
    option.selected = true;
    render();
    notify();
    announce(t("tagAdded", { name: option.label }), "success");
    return true;
  }, "addTag");
  const commit = /* @__PURE__ */ __name(() => {
    if (destroyed) throw new Error("Tag picker destroyed.");
    const remaining = [];
    for (const name of entry.value.split(",").map((text) => text.trim()).filter(Boolean)) {
      const duplicate = selected().some((option) => normalized(option.label) === normalized(name));
      if (!addTag(name) && !duplicate) remaining.push(name);
    }
    entry.value = remaining.join(", ");
    search.close();
    return !remaining.length;
  }, "commit");
  const search = createSearch(entry, {
    url,
    delay,
    minLength,
    limit,
    locale,
    messages,
    fetch: fetchTags ? async (query, context) => (await fetchTags(query, context)).filter((item) => !selected().some((option) => option.value === item.value || normalized(option.label) === normalized(item.label))) : url ? void 0 : async (query) => options().filter((option) => !option.selected && !option.disabled && !option.closest("optgroup")?.disabled && normalized(option.label).includes(normalized(query))).map((option) => ({ label: option.label, value: option.value })),
    onSelect(item) {
      const duplicate = selected().some((option) => option.value === item.value || normalized(option.label) === normalized(item.label));
      entry.value = addTag(item) || duplicate ? "" : item.label;
      search.close();
    }
  });
  listen(add, "click", () => {
    commit();
    entry.focus();
  });
  listen(entry, "keydown", (event) => {
    if (event.isComposing || event.defaultPrevented) return;
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    }
  });
  listen(list, "click", (event) => {
    const button = event.target.closest("[data-tag-remove]");
    if (!button || !list.contains(button) || button.disabled) return;
    const option = options().find((option2) => option2.value === button.dataset.tagRemove);
    if (!option) return;
    option.selected = false;
    if (created.has(option)) {
      option.remove();
      created.delete(option);
    }
    render();
    notify();
    announce(t("tagRemoved", { name: option.label }));
    entry.focus();
  });
  listen(source, "change", () => {
    if (!updating) render();
  });
  listen(source, "invalid", (event) => {
    event.preventDefault();
    entry.focus();
  });
  if (label) listen(label, "click", (event) => {
    event.preventDefault();
    entry.focus();
  });
  if (source.form) {
    listen(source.form, "submit", (event) => {
      if (entry.value.trim() && !commit()) {
        event.preventDefault();
        entry.focus();
      }
    }, true);
    listen(source.form, "reset", (event) => {
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        if (destroyed || event.defaultPrevented) return;
        for (const option of created) option.remove();
        created.clear();
        entry.value = "";
        search.close();
        status.textContent = "";
        render();
      }, 0);
    });
  }
  const observer = new win.MutationObserver(render);
  observer.observe(source, { attributes: true, childList: true, subtree: true });
  instances.add(source);
  render();
  return {
    getTags: /* @__PURE__ */ __name(() => selected().map((option) => ({ value: option.value, label: option.label, created: created.has(option) })), "getTags"),
    add(label2) {
      if (destroyed) throw new Error("Tag picker destroyed.");
      return addTag(label2);
    },
    refresh() {
      if (destroyed) throw new Error("Tag picker destroyed.");
      render();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      clearTimeout(resetTimer);
      observer.disconnect();
      listeners.forEach((stop) => stop());
      search.destroy();
      unregister();
      wrapper.before(source);
      wrapper.remove();
      source.hidden = hidden;
      instances.delete(source);
    }
  };
}
__name(createTagPicker, "createTagPicker");
export {
  createTagPicker
};
