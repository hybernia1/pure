import {
  ensureStyles
} from "./chunk-ZDWH7MVN.js";
import {
  configurePure,
  getPureConfig
} from "./chunk-JK5BIUAQ.js";
import "./chunk-I2KQSOTD.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/lazy.js
var modules = {
  colors: [() => import("./colors-QJK7IWSC.js"), []],
  chart: [() => import("./chart-DJ5J5OXW.js"), ["chart"]],
  renderer: [() => import("./renderer-EOIBLPSY.js"), ["renderer"]],
  image: [() => import("./image-7QNBUZBB.js"), []],
  "tag-picker": [() => import("./tag-picker-6SPUKE2H.js"), ["tag-picker"]],
  navigation: [() => import("./navigation-3ZZVOTN7.js"), ["navigation"]],
  tabs: [() => import("./tabs-3IHG7JDY.js"), ["tabs"]],
  data: [() => import("./data-QXEKSIRD.js"), []],
  table: [() => import("./table-MYO5POAM.js"), ["data"]],
  list: [() => import("./list-ZCCWJK3Z.js"), ["data"]],
  pagination: [() => import("./pagination-6TBOBFCH.js"), ["data"]],
  theme: [() => import("./theme-LS6KVII6.js"), ["tokens"]],
  disclosure: [() => import("./disclosure-JECATDJJ.js"), []],
  ajax: [() => import("./ajax-WMXIX7FG.js"), []],
  forms: [() => import("./forms-BSQAHSVS.js"), ["controls"]],
  select: [() => import("./select-MME35WXP.js"), ["controls"]],
  picker: [() => import("./picker-3BMLUEQ6.js"), ["controls"]],
  modal: [() => import("./modal-PLGCE7YP.js"), ["modal"]],
  upload: [() => import("./upload-BUGUPZ2P.js"), ["upload"]],
  resize: [() => import("./resize-2SB6TVL3.js"), ["resize"]],
  editor: [() => import("./editor.js"), ["editor"]],
  "media-library": [() => import("./media-library-AHWBCAWX.js"), ["media-library"]],
  search: [() => import("./search-CLUFTQZZ.js"), ["search"]],
  flash: [() => import("./flash-WMSXDG3U.js"), ["flash"]],
  activity: [() => import("./activity-EFUKDGOO.js"), ["activity"]],
  progress: [() => import("./progress-ERDC5IGF.js"), ["progress"]],
  "drag-drop": [() => import("./drag-drop-LYS2TUWJ.js"), ["drag-drop"]]
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
