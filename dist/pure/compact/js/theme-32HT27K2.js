import {
  componentOptions
} from "./chunk-VKBN75Z7.js";
import "./chunk-I2KQSOTD.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/theme.js
var themes = ["light", "dark", "system"];
var validScheme = /* @__PURE__ */ __name((scheme) => typeof scheme === "string" && /^[a-z][a-z0-9-]{0,63}$/.test(scheme), "validScheme");
function setScheme(scheme, options = {}) {
  return applyScheme(scheme, componentOptions("theme", options));
}
__name(setScheme, "setScheme");
function applyScheme(scheme, { root = document.documentElement, storage, ...config }) {
  if (!validScheme(scheme)) throw new TypeError("Invalid color scheme name.");
  if (!config.persist) storage = null;
  if (storage === void 0) {
    try {
      storage = globalThis.localStorage;
    } catch {
      storage = null;
    }
  }
  if (scheme === "default") root.removeAttribute("data-scheme");
  else root.setAttribute("data-scheme", scheme);
  try {
    storage?.setItem(config.schemeStorageKey, scheme);
  } catch {
  }
}
__name(applyScheme, "applyScheme");
function setTheme(theme, options = {}) {
  return applyTheme(theme, componentOptions("theme", options));
}
__name(setTheme, "setTheme");
function applyTheme(theme, { root = document.documentElement, storage, ...config }) {
  if (!config.persist) storage = null;
  if (!themes.includes(theme)) throw new TypeError(`Nezn\xE1m\xE9 t\xE9ma: ${theme}`);
  if (storage === void 0) {
    try {
      storage = globalThis.localStorage;
    } catch {
      storage = null;
    }
  }
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  try {
    storage?.setItem(config.storageKey, theme);
  } catch {
  }
}
__name(applyTheme, "applyTheme");
function initTheme(options = {}) {
  const { root = document.documentElement, scope = document, storage: configuredStorage, ...config } = componentOptions("theme", options);
  let storage = configuredStorage;
  if (!config.persist) storage = null;
  if (storage === void 0) {
    try {
      storage = globalThis.localStorage;
    } catch {
      storage = null;
    }
  }
  let saved;
  let savedScheme;
  try {
    saved = storage?.getItem(config.storageKey);
  } catch {
  }
  try {
    savedScheme = storage?.getItem(config.schemeStorageKey);
  } catch {
  }
  if (!validScheme(config.scheme)) throw new TypeError("Invalid color scheme name.");
  applyTheme(themes.includes(saved) ? saved : config.default, { root, storage, ...config });
  applyScheme(validScheme(savedScheme) ? savedScheme : config.scheme, { root, storage, ...config });
  const onClick = /* @__PURE__ */ __name((event) => {
    const button = event.target.closest("[data-theme-toggle], [data-theme-set], [data-scheme-set]");
    if (!button || !scope.contains(button)) return;
    if (button.hasAttribute?.("data-scheme-set")) {
      applyScheme(button.getAttribute("data-scheme-set"), { root, storage, ...config });
      return;
    }
    if (button.hasAttribute?.("data-theme-set")) {
      applyTheme(button.getAttribute("data-theme-set"), { root, storage, ...config });
      return;
    }
    const dark = root.getAttribute("data-theme") === "dark" || !root.hasAttribute("data-theme") && (root.ownerDocument?.defaultView || globalThis).matchMedia?.("(prefers-color-scheme: dark)").matches;
    applyTheme(dark ? "light" : "dark", { root, storage, ...config });
  }, "onClick");
  scope.addEventListener("click", onClick);
  return () => scope.removeEventListener("click", onClick);
}
__name(initTheme, "initTheme");
export {
  initTheme,
  setScheme,
  setTheme
};
