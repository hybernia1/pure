import {
  getPureConfig
} from "./chunk-JK5BIUAQ.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/styles.js
var documents = /* @__PURE__ */ new WeakMap();
var failedLinks = /* @__PURE__ */ new WeakSet();
var dependencies = {
  placeholder: ["base"],
  scrollbar: ["base"],
  segmented: ["components"],
  chart: ["base"],
  renderer: ["base"],
  "tag-picker": ["search", "states"],
  navigation: ["components"],
  tabs: ["components"],
  data: ["components"],
  tokens: [],
  base: ["tokens"],
  components: ["base"],
  states: ["tokens"],
  forms: ["components"],
  controls: ["forms"],
  "drag-drop": ["tokens"],
  resize: ["controls"],
  upload: ["forms", "states"],
  editor: ["controls", "drag-drop"],
  modal: ["controls"],
  "media-library": ["modal", "data"],
  search: ["controls"],
  flash: ["components", "states"],
  activity: ["components"],
  progress: ["components", "states"],
  utilities: ["tokens"]
};
function ensureStyles(names, { document: doc = globalThis.document } = {}) {
  if (!doc?.head) return Promise.reject(new TypeError("A document with a head is required."));
  const baseUrl = getPureConfig().styles.baseUrl;
  const requested = typeof names === "string" ? [names] : names;
  const ordered = /* @__PURE__ */ new Set();
  const visit = /* @__PURE__ */ __name((name) => {
    if (!Object.hasOwn(dependencies, name)) throw new TypeError(`Unknown stylesheet: ${name}`);
    for (const dependency of dependencies[name]) visit(dependency);
    ordered.add(name);
  }, "visit");
  try {
    requested.forEach(visit);
  } catch (error) {
    return Promise.reject(error);
  }
  let registry = documents.get(doc);
  if (!registry) {
    registry = /* @__PURE__ */ new Map();
    documents.set(doc, registry);
  }
  const links = [...doc.querySelectorAll('link[rel="stylesheet"]')];
  const load = /* @__PURE__ */ __name((href, existing) => {
    if (registry.has(href)) return registry.get(href);
    const link = existing || links.find((node) => node.href === href && !failedLinks.has(node)) || doc.createElement("link");
    if (link.sheet) return Promise.resolve();
    const owned = !link.isConnected;
    const promise = new Promise((resolve, reject) => {
      const cleanup = /* @__PURE__ */ __name(() => {
        clearTimeout(timer);
        link.removeEventListener("load", loaded);
        link.removeEventListener("error", failed);
      }, "cleanup");
      const loaded = /* @__PURE__ */ __name(() => {
        cleanup();
        resolve();
      }, "loaded");
      const failed = /* @__PURE__ */ __name(() => {
        cleanup();
        registry.delete(href);
        failedLinks.add(link);
        if (owned) link.remove();
        reject(new Error(`Could not load stylesheet: ${href}`));
      }, "failed");
      const timer = setTimeout(failed, 15e3);
      link.addEventListener("load", loaded);
      link.addEventListener("error", failed);
      if (owned) {
        link.rel = "stylesheet";
        link.href = href;
        link.dataset.pureStyle = "";
        doc.head.append(link);
      }
    });
    registry.set(href, promise);
    return promise;
  }, "load");
  const bundle = links.find((link) => link.href && !failedLinks.has(link) && (link.dataset.pureStyles === "all" || new URL(link.href).pathname.endsWith("/pure.css")));
  if (bundle) return load(bundle.href, bundle);
  return Promise.all([...ordered].map((name) => {
    const partial = links.find((link) => link.href && !failedLinks.has(link) && link.dataset.pureStyles?.split(/\s+/).includes(name));
    return partial ? load(partial.href, partial) : load(new URL(`${name}.css`, baseUrl).href);
  })).then(() => void 0);
}
__name(ensureStyles, "ensureStyles");

export {
  ensureStyles
};
