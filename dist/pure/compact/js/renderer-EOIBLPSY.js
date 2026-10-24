import {
  normalizeDocument
} from "./chunk-FUYBYDI2.js";
import "./chunk-3SIP5CGE.js";
import "./chunk-I2KQSOTD.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/renderer.js
function renderModel(model, doc) {
  const fragment = doc.createDocumentFragment();
  const element = /* @__PURE__ */ __name((tag, text) => {
    const node = doc.createElement(tag);
    if (text !== void 0) node.textContent = text;
    return node;
  }, "element");
  const runs = /* @__PURE__ */ __name((parent, children) => {
    for (const run of children) {
      let node = doc.createTextNode(run.text);
      if (run.color) {
        const span = element("span");
        span.dataset.textColor = run.color;
        span.style.color = `var(--p-${run.color}, var(--p-text))`;
        span.append(node);
        node = span;
      }
      for (const [mark, tag] of [["bold", "strong"], ["italic", "em"], ["underline", "u"], ["strike", "s"], ["link", "a"]]) if (run[mark]) {
        const wrapper = element(tag);
        if (mark === "link") wrapper.setAttribute("href", run.link);
        wrapper.append(node);
        node = wrapper;
      }
      parent.append(node);
    }
  }, "runs");
  for (const block of model.blocks) {
    let node;
    if (block.type === "image") {
      node = element("figure");
      node.className = "content-image";
      node.dataset.align = block.align;
      node.dataset.width = String(block.width);
      if (block.mediaId !== null) node.dataset.mediaId = String(block.mediaId);
      const image = element("img");
      image.setAttribute("src", block.src);
      image.setAttribute("alt", block.alt);
      image.loading = "lazy";
      image.decoding = "async";
      node.append(image);
      if (block.caption) node.append(element("figcaption", block.caption));
    } else if (block.type === "list") {
      node = element(block.style === "ordered" ? "ol" : "ul");
      for (const item of block.items) {
        const li = element("li");
        runs(li, item.children);
        node.append(li);
      }
    } else {
      node = element(block.type === "heading" ? `h${block.level}` : "p");
      runs(node, block.children);
    }
    fragment.append(node);
  }
  return fragment;
}
__name(renderModel, "renderModel");
function renderDocument(value, { document: doc = globalThis.document } = {}) {
  return renderModel(normalizeDocument(value), doc);
}
__name(renderDocument, "renderDocument");
function createRenderer(target, value) {
  const root = target.ownerDocument.createElement("div");
  root.className = "content";
  let model;
  let destroyed = false;
  function update(next) {
    if (destroyed) throw new Error("Renderer is destroyed.");
    const normalized = normalizeDocument(next);
    const fragment = renderModel(normalized, target.ownerDocument);
    root.replaceChildren(fragment);
    model = normalized;
  }
  __name(update, "update");
  update(value);
  target.append(root);
  return { element: root, update, getJSON: /* @__PURE__ */ __name(() => normalizeDocument(model), "getJSON"), destroy() {
    destroyed = true;
    root.remove();
  } };
}
__name(createRenderer, "createRenderer");
export {
  createRenderer,
  renderDocument
};
