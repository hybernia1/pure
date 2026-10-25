import {
  uiI18n
} from "./chunk-C6Z2H5Y3.js";
import {
  componentOptions
} from "./chunk-VKBN75Z7.js";
import "./chunk-I2KQSOTD.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/navigation.js
var instances = /* @__PURE__ */ new WeakSet();
function createNavigation(root, options = {}) {
  const { match = "path", closeOnSelect = true, active, locale, messages } = componentOptions("navigation", options);
  if (!root.matches("nav[data-navigation]") || instances.has(root) || !["path", "exact"].includes(match) || typeof closeOnSelect !== "boolean") throw new TypeError("Invalid navigation root or options.");
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const own = /* @__PURE__ */ __name((selector) => [...root.querySelectorAll(selector)].filter((node) => node.closest("[data-navigation]") === root), "own");
  const toggles = own("[data-nav-toggle]");
  const panels = own("[data-nav-panel]");
  const button = toggles[0];
  const panel = panels[0];
  const dropdowns = own("[data-nav-dropdown]");
  const links = own("a[href]");
  if (toggles.length !== 1 || button.tagName !== "BUTTON" || panels.length !== 1 || !panel.id || button.getAttribute("aria-controls") !== panel.id || panel.contains(button) || dropdowns.some((node) => node.tagName !== "DETAILS" || !panel.contains(node) || node.firstElementChild?.tagName !== "SUMMARY")) throw new TypeError("Navigation requires a button, matching panel ID and details/summary dropdowns.");
  if (doc.getElementById(panel.id) && doc.getElementById(panel.id) !== panel) throw new TypeError("Navigation panel ID must be unique.");
  const { t } = uiI18n(doc, { locale, messages });
  const originals = /* @__PURE__ */ new Map();
  const remember = /* @__PURE__ */ __name((node, names) => originals.set(node, names.map((name) => [name, node.getAttribute(name)])), "remember");
  remember(root, ["data-nav-ready"]);
  remember(button, ["hidden", "type", "aria-expanded", "aria-label"]);
  remember(panel, ["hidden"]);
  for (const dropdown of dropdowns) remember(dropdown, ["open", "data-nav-active"]);
  const submenus = dropdowns.map((dropdown) => dropdown.querySelector(":scope > .navigation-submenu")).filter(Boolean);
  const shifts = new Map(submenus.map((menu) => [menu, [menu.style.getPropertyValue("--p-navigation-shift"), menu.style.getPropertyPriority("--p-navigation-shift")]]));
  for (const link of links) remember(link, ["aria-current"]);
  const customLabel = button.getAttribute("aria-label");
  const media = win.matchMedia("(min-width: 960px)");
  let expanded = false;
  let destroyed = false;
  let activeUrl = active === void 0 ? doc.location.href : active;
  const address = /* @__PURE__ */ __name((value) => new URL(value, doc.baseURI), "address");
  if (activeUrl !== null) address(activeUrl);
  const check = /* @__PURE__ */ __name(() => {
    if (destroyed) throw new Error("Navigation destroyed.");
  }, "check");
  const closeDropdowns = /* @__PURE__ */ __name(() => {
    for (const dropdown of dropdowns) dropdown.open = false;
  }, "closeDropdowns");
  const positionDropdowns = /* @__PURE__ */ __name(() => {
    for (const menu of submenus) {
      menu.style.setProperty("--p-navigation-shift", "0px");
      if (!media.matches || !menu.parentElement.open) continue;
      const rect = menu.getBoundingClientRect();
      const gutter = parseFloat(win.getComputedStyle(menu).scrollMarginTop) || 0;
      const shift = rect.left < gutter ? gutter - rect.left : Math.min(0, win.innerWidth - gutter - rect.right);
      menu.style.setProperty("--p-navigation-shift", `${shift}px`);
    }
  }, "positionDropdowns");
  const render = /* @__PURE__ */ __name(() => {
    button.hidden = media.matches;
    button.type = "button";
    button.setAttribute("aria-expanded", String(!media.matches && expanded));
    button.setAttribute("aria-label", customLabel || t(expanded && !media.matches ? "closeNavigation" : "openNavigation"));
    panel.hidden = !media.matches && !expanded;
  }, "render");
  const setOpen = /* @__PURE__ */ __name((next, { focus = false, restoreFocus = true } = {}) => {
    check();
    const previous = expanded;
    const hadFocus = panel.contains(doc.activeElement);
    expanded = !media.matches && Boolean(next);
    if (!expanded) closeDropdowns();
    render();
    if (!media.matches && !expanded && (focus || restoreFocus && hadFocus)) button.focus();
    if (previous !== expanded) root.dispatchEvent(new win.CustomEvent("pure:navigation-change", { bubbles: true, detail: { open: expanded } }));
    return expanded;
  }, "setOpen");
  const setActive = /* @__PURE__ */ __name((url = doc.location.href) => {
    check();
    const current = url === null ? null : address(url);
    activeUrl = url;
    const candidates = new Map(links.map((link) => [link, address(link.getAttribute("href"))]));
    let found = null;
    for (const link of links) {
      const candidate = candidates.get(link);
      const eligible = panel.contains(link) && !link.hasAttribute("download") && candidate.origin === current?.origin;
      const matches = current && eligible && (match === "exact" ? candidate.href === current.href : candidate.pathname === current.pathname && (!candidate.hash || candidate.hash === current.hash));
      if (matches && (!found || candidate.hash && !address(found.getAttribute("href")).hash)) found = link;
      link.removeAttribute("aria-current");
    }
    if (found) found.setAttribute("aria-current", address(found.getAttribute("href")).hash ? "location" : "page");
    for (const dropdown of dropdowns) dropdown.toggleAttribute("data-nav-active", Boolean(found && dropdown.contains(found)));
    return found;
  }, "setActive");
  const click = /* @__PURE__ */ __name((event) => {
    const target = event.target.closest("[data-nav-toggle], a[href]");
    if (target === button) {
      event.preventDefault();
      setOpen(!expanded);
      return;
    }
    if (!links.includes(target) || !closeOnSelect || event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || target.hasAttribute("download") || target.target && target.target !== "_self") return;
    const opened = dropdowns.filter((dropdown) => dropdown.open && dropdown.contains(target)).at(-1);
    closeDropdowns();
    if (!media.matches) setOpen(false);
    else if (opened && opened.contains(doc.activeElement)) opened.querySelector("summary").focus();
  }, "click");
  const keydown = /* @__PURE__ */ __name((event) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    const opened = dropdowns.filter((dropdown) => dropdown.open && dropdown.contains(event.target)).at(-1);
    if (opened) {
      event.preventDefault();
      event.stopPropagation();
      opened.open = false;
      opened.querySelector("summary").focus();
    } else if (!media.matches && expanded) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false, { focus: true });
    }
  }, "keydown");
  const toggleDropdown = /* @__PURE__ */ __name((event) => {
    const opened = event.target;
    if (!dropdowns.includes(opened) || !opened.open) return;
    for (const other of dropdowns) if (other !== opened && !other.contains(opened)) other.open = false;
    positionDropdowns();
  }, "toggleDropdown");
  const outside = /* @__PURE__ */ __name((event) => {
    if (!root.contains(event.target)) {
      closeDropdowns();
      if (!media.matches && expanded) setOpen(false);
    }
  }, "outside");
  const focusout = /* @__PURE__ */ __name((event) => {
    if (event.relatedTarget && !root.contains(event.relatedTarget)) {
      closeDropdowns();
      if (!media.matches && expanded) setOpen(false, { restoreFocus: false });
    }
  }, "focusout");
  const resized = /* @__PURE__ */ __name(() => {
    const wasButtonFocused = doc.activeElement === button;
    const wasPanelFocused = panel.contains(doc.activeElement);
    const focusedDropdown = dropdowns.filter((dropdown) => dropdown.open && dropdown.contains(doc.activeElement)).at(-1);
    expanded = false;
    closeDropdowns();
    render();
    if (media.matches && wasButtonFocused) [...panel.querySelectorAll("a[href], summary")].find((node) => node.getClientRects().length)?.focus();
    else if (media.matches && focusedDropdown) focusedDropdown.querySelector("summary").focus();
    else if (!media.matches && wasPanelFocused) button.focus();
  }, "resized");
  const locationChanged = /* @__PURE__ */ __name(() => setActive(doc.location.href), "locationChanged");
  setActive(activeUrl);
  root.dataset.navReady = "";
  render();
  instances.add(root);
  positionDropdowns();
  root.addEventListener("click", click);
  root.addEventListener("keydown", keydown);
  root.addEventListener("toggle", toggleDropdown, true);
  root.addEventListener("focusout", focusout);
  doc.addEventListener("click", outside);
  media.addEventListener("change", resized);
  win.addEventListener("popstate", locationChanged);
  win.addEventListener("hashchange", locationChanged);
  win.addEventListener("resize", positionDropdowns);
  return {
    open: /* @__PURE__ */ __name(() => setOpen(true), "open"),
    close: /* @__PURE__ */ __name((options2) => setOpen(false, options2), "close"),
    toggle: /* @__PURE__ */ __name(() => setOpen(!expanded), "toggle"),
    isOpen: /* @__PURE__ */ __name(() => !media.matches && expanded, "isOpen"),
    setActive,
    refresh() {
      check();
      render();
      return setActive(activeUrl);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      root.removeEventListener("click", click);
      root.removeEventListener("keydown", keydown);
      root.removeEventListener("toggle", toggleDropdown, true);
      root.removeEventListener("focusout", focusout);
      doc.removeEventListener("click", outside);
      media.removeEventListener("change", resized);
      win.removeEventListener("popstate", locationChanged);
      win.removeEventListener("hashchange", locationChanged);
      win.removeEventListener("resize", positionDropdowns);
      for (const [menu, [value, priority]] of shifts) {
        if (value) menu.style.setProperty("--p-navigation-shift", value, priority);
        else menu.style.removeProperty("--p-navigation-shift");
        if (!menu.getAttribute("style")) menu.removeAttribute("style");
      }
      for (const [node, attributes] of originals) for (const [name, value] of attributes) {
        if (value === null) node.removeAttribute(name);
        else node.setAttribute(name, value);
      }
      instances.delete(root);
    }
  };
}
__name(createNavigation, "createNavigation");
function initNavigations(scope = document, options = {}) {
  const roots = [...scope.matches?.("[data-navigation]") ? [scope] : [], ...scope.querySelectorAll("nav[data-navigation]")];
  const controllers = [];
  try {
    for (const root of roots) controllers.push(createNavigation(root, options));
  } catch (error) {
    controllers.reverse().forEach((controller) => controller.destroy());
    throw error;
  }
  return () => controllers.reverse().forEach((controller) => controller.destroy());
}
__name(initNavigations, "initNavigations");
export {
  createNavigation,
  initNavigations
};
