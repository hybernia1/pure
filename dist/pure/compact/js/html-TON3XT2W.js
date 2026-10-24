import {
  safeHref
} from "./chunk-3SIP5CGE.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/html.js
var allowed = /* @__PURE__ */ new Set(["P", "DIV", "BR", "STRONG", "EM", "B", "I", "A", "UL", "OL", "LI", "BLOCKQUOTE", "H2", "H3", "CODE", "PRE"]);
var discard = /* @__PURE__ */ new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "MATH", "TEMPLATE", "NOSCRIPT"]);
function htmlFragment(html, doc = document) {
  const template = doc.createElement("template");
  template.innerHTML = String(html);
  const clean = /* @__PURE__ */ __name((source, target) => {
    for (const node of source.childNodes) {
      if (node.nodeType === 3) {
        target.append(doc.createTextNode(node.textContent));
        continue;
      }
      if (node.nodeType !== 1) continue;
      const tag = node.tagName.toUpperCase();
      if (discard.has(tag)) continue;
      if (!allowed.has(tag)) {
        clean(node, target);
        continue;
      }
      const next = doc.createElement(tag.toLowerCase());
      if (tag === "A") {
        const href = safeHref(node.getAttribute("href"));
        if (href) next.setAttribute("href", href);
      }
      clean(node, next);
      target.append(next);
    }
  }, "clean");
  const fragment = doc.createDocumentFragment();
  clean(template.content, fragment);
  return fragment;
}
__name(htmlFragment, "htmlFragment");
function cleanHTML(html, doc = document) {
  const container = doc.createElement("div");
  container.append(htmlFragment(html, doc));
  return container.innerHTML;
}
__name(cleanHTML, "cleanHTML");
export {
  cleanHTML,
  htmlFragment,
  safeHref
};
