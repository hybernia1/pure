import {
  icon
} from "./chunk-FYRGNXMB.js";
import {
  componentOptions
} from "./chunk-VKBN75Z7.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/modal.js
var scrollLocks = /* @__PURE__ */ new WeakMap();
function lockScroll(doc) {
  let lock = scrollLocks.get(doc);
  if (!lock) {
    const root = doc.documentElement;
    const properties = ["overflow", "overscroll-behavior", "scrollbar-gutter"];
    const original = properties.map((name) => [name, root.style.getPropertyValue(name), root.style.getPropertyPriority(name)]);
    root.style.setProperty("overflow", "hidden", "important");
    root.style.setProperty("overscroll-behavior", "none", "important");
    const gutter = doc.defaultView?.getComputedStyle(root).scrollbarGutter || root.style.getPropertyValue("scrollbar-gutter");
    root.style.setProperty("scrollbar-gutter", gutter?.includes("stable") ? gutter : "stable", "important");
    lock = { count: 0, restore() {
      for (const [name, value, priority] of original) {
        if (value) root.style.setProperty(name, value, priority);
        else root.style.removeProperty(name);
      }
    } };
    scrollLocks.set(doc, lock);
  }
  lock.count++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--lock.count === 0) {
      lock.restore();
      scrollLocks.delete(doc);
    }
  };
}
__name(lockScroll, "lockScroll");
function createModal(dialog, options = {}) {
  const { closeOnBackdrop = true } = componentOptions("modal", options);
  if (dialog.tagName !== "DIALOG") throw new TypeError("Modal vy\u017Eaduje element dialog.");
  const doc = dialog.ownerDocument;
  let opener;
  let destroyed = false;
  let backdropStart = false;
  let releaseScroll;
  const overscroll = [dialog.style.getPropertyValue("overscroll-behavior"), dialog.style.getPropertyPriority("overscroll-behavior")];
  dialog.style.setProperty("overscroll-behavior", "contain");
  const restoreButtons = [];
  dialog.querySelectorAll('[data-modal-close=""]').forEach((button) => {
    const children = [...button.childNodes];
    const original = ["class", "aria-label", "title"].map((name) => [name, button.getAttribute(name)]);
    button.replaceChildren(icon(doc, "close"));
    button.className = "icon-button";
    button.setAttribute("aria-label", button.getAttribute("aria-label") || "Zav\u0159\xEDt dialog");
    button.title = button.getAttribute("aria-label");
    restoreButtons.push(() => {
      button.replaceChildren(...children);
      original.forEach(([name, value]) => {
        if (value === null) button.removeAttribute(name);
        else button.setAttribute(name, value);
      });
    });
  });
  const outside = /* @__PURE__ */ __name((event) => {
    if (event.target !== dialog) return false;
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  }, "outside");
  const onPointerDown = /* @__PURE__ */ __name((event) => {
    backdropStart = outside(event);
  }, "onPointerDown");
  const onClick = /* @__PURE__ */ __name((event) => {
    if (closeOnBackdrop && backdropStart && outside(event)) dialog.close();
    backdropStart = false;
    const button = event.target.closest("[data-modal-close]");
    if (button?.closest("dialog") === dialog) {
      event.preventDefault();
      dialog.close(button.dataset.modalClose || "");
    }
  }, "onClick");
  const onClose = /* @__PURE__ */ __name(() => {
    if (dialog.open) return;
    releaseScroll?.();
    releaseScroll = null;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  }, "onClose");
  dialog.addEventListener("pointerdown", onPointerDown);
  dialog.addEventListener("click", onClick);
  dialog.addEventListener("close", onClose);
  return {
    open(trigger = doc.activeElement) {
      if (destroyed) throw new Error("Modal byl odpojen.");
      if (dialog.open) return;
      releaseScroll?.();
      releaseScroll = null;
      opener = trigger;
      dialog.returnValue = "";
      releaseScroll = lockScroll(doc);
      try {
        dialog.showModal();
      } catch (error) {
        releaseScroll();
        releaseScroll = null;
        opener = null;
        throw error;
      }
    },
    close(value = "") {
      dialog.close(value);
      onClose();
    },
    destroy() {
      if (destroyed) return;
      if (dialog.open) {
        dialog.close();
        onClose();
      }
      releaseScroll?.();
      releaseScroll = null;
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("click", onClick);
      dialog.removeEventListener("close", onClose);
      restoreButtons.forEach((restore) => restore());
      if (overscroll[0]) dialog.style.setProperty("overscroll-behavior", ...overscroll);
      else dialog.style.removeProperty("overscroll-behavior");
      destroyed = true;
    }
  };
}
__name(createModal, "createModal");
function initModals(scope = document) {
  const controllers = /* @__PURE__ */ new Map();
  scope.querySelectorAll("dialog[data-modal]").forEach((dialog) => controllers.set(dialog, createModal(dialog)));
  const click = /* @__PURE__ */ __name((event) => {
    const trigger = event.target.closest("[data-modal-open]");
    if (!trigger || !scope.contains(trigger)) return;
    const dialog = trigger.ownerDocument.getElementById(trigger.dataset.modalOpen);
    if (controllers.has(dialog)) {
      event.preventDefault();
      controllers.get(dialog).open(trigger);
    }
  }, "click");
  scope.addEventListener("click", click);
  return () => {
    scope.removeEventListener("click", click);
    controllers.forEach((controller) => controller.destroy());
  };
}
__name(initModals, "initModals");

export {
  createModal,
  initModals
};
