import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/url.js
function safeHref(value) {
  const href = String(value ?? "").trim();
  if (!href || /[\u0000-\u0020\u007f]/.test(href) || href.startsWith("//") || href.includes("\\")) return null;
  if (/^(https?:|mailto:)/i.test(href)) return href;
  if (/^[^:/?#]*:/.test(href)) return null;
  return href;
}
__name(safeHref, "safeHref");

export {
  safeHref
};
