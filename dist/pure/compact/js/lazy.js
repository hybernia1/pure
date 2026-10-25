import {
  ensureStyles
} from "./chunk-MDDIKQ53.js";
import {
  configurePure,
  getPureConfig
} from "./chunk-VKBN75Z7.js";
import "./chunk-I2KQSOTD.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/lazy.js
var modules = {
  colors: [() => import("./colors-QJK7IWSC.js"), []],
  chart: [() => import("./chart-LLDN7CXJ.js"), ["chart"]],
  renderer: [() => import("./renderer-GTC22PBU.js"), ["renderer"]],
  image: [() => import("./image-7QNBUZBB.js"), []],
  "tag-picker": [() => import("./tag-picker-VSWMW6V5.js"), ["tag-picker"]],
  navigation: [() => import("./navigation-UUAJX4J6.js"), ["navigation"]],
  tabs: [() => import("./tabs-77UMX56T.js"), ["tabs"]],
  data: [() => import("./data-AAOEJX6V.js"), []],
  table: [() => import("./table-7U5SOUL6.js"), ["data"]],
  list: [() => import("./list-4L4EUL6Q.js"), ["data"]],
  pagination: [() => import("./pagination-HA6ZNWOR.js"), ["data"]],
  theme: [() => import("./theme-32HT27K2.js"), ["tokens"]],
  disclosure: [() => import("./disclosure-JECATDJJ.js"), []],
  ajax: [() => import("./ajax-WMXIX7FG.js"), []],
  forms: [() => import("./forms-RY2SJKHL.js"), ["controls"]],
  select: [() => import("./select-W527ZQBK.js"), ["controls"]],
  picker: [() => import("./picker-IYKJ7SV7.js"), ["controls"]],
  modal: [() => import("./modal-CMJRFYG7.js"), ["modal"]],
  upload: [() => import("./upload-5GORHKMR.js"), ["upload"]],
  resize: [() => import("./resize-2SOG3MT4.js"), ["resize"]],
  editor: [() => import("./editor.js"), ["editor"]],
  "media-library": [() => import("./media-library-QBUPP3BD.js"), ["media-library"]],
  search: [() => import("./search-W3L26UQN.js"), ["search"]],
  flash: [() => import("./flash-AFLNXTHL.js"), ["flash"]],
  activity: [() => import("./activity-7P4MXY5N.js"), ["activity"]],
  progress: [() => import("./progress-EKELJVEH.js"), ["progress"]],
  "drag-drop": [() => import("./drag-drop-SEOPIZTL.js"), ["drag-drop"]]
};
async function loadComponent(name, { document: doc = globalThis.document, styles = getPureConfig().styles.auto } = {}) {
  if (!Object.hasOwn(modules, name)) throw new TypeError(`Unknown Pure component: ${name}`);
  const [load, css] = modules[name];
  const [module] = await Promise.all([load(), styles && css.length ? ensureStyles(css, { document: doc }) : void 0]);
  return module;
}
__name(loadComponent, "loadComponent");
export {
  configurePure,
  ensureStyles,
  getPureConfig,
  loadComponent
};
