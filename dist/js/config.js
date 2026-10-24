const defaults = {
  locale: 'auto', messages: {}, iconsUrl: new URL('../icons.svg', import.meta.url).href,
  styles: { auto: true, baseUrl: new URL('../css/', import.meta.url).href },
  theme: { default: 'system', persist: true, storageKey: 'pure-theme' },
  search: { delay: 250, minLength: 2, limit: 8 },
  upload: { accept: '', maxFiles: Infinity, maxSize: Infinity },
  editor: { features: { headings: false, images: false, fullscreen: true }, uploadImage: null, mediaLibrary: null },
  mediaLibrary: { pageSize: 12 }, flash: { duration: 0 }, modal: { closeOnBackdrop: true },
};
const object = value => value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
const copy = value => object(value) ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)])) : value;
function merge(base, patch) {
  const result = copy(base);
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new TypeError(`Invalid configuration key: ${key}`);
    result[key] = object(value) && object(result[key]) ? merge(result[key], value) : copy(value);
  }
  return result;
}
let configuration = copy(defaults);
function validate(patch, schema = defaults, path = '') {
  if (!object(patch)) throw new TypeError('Pure configuration must be a plain object.');
  for (const [key, value] of Object.entries(patch)) {
    if (!Object.hasOwn(schema, key)) throw new TypeError(`Unknown Pure option: ${path}${key}`);
    if (value === undefined) continue;
    if (key === 'messages') {
      if (!object(value) || Object.values(value).some(text => typeof text !== 'string')) throw new TypeError('messages must contain strings.');
    } else if (object(schema[key])) validate(value, schema[key], `${path}${key}.`);
    else if (schema[key] === null) {
      if (value !== null && (key === 'uploadImage' ? typeof value !== 'function' : !object(value))) throw new TypeError(`Invalid ${path}${key}`);
    } else if (typeof value !== typeof schema[key]) throw new TypeError(`Invalid ${path}${key}`);
  }
}
/** Updates defaults for future instances only; does not initialize any UI. */
export function configurePure(patch) {
  validate(patch);
  const next = merge(configuration, patch);
  if (!['system', 'light', 'dark'].includes(next.theme.default)) throw new TypeError('Invalid theme.default');
  if (!next.theme.storageKey || !next.iconsUrl || !next.styles.baseUrl) throw new TypeError('Asset URLs and storageKey must not be empty.');
  if (next.locale !== 'auto') new Intl.DateTimeFormat(next.locale);
  for (const [value, min, integer] of [[next.search.delay, 0, false], [next.search.minLength, 0, true], [next.search.limit, 1, true], [next.mediaLibrary.pageSize, 1, true], [next.flash.duration, 0, false]]) {
    if (!Number.isFinite(value) || value < min || (integer && !Number.isInteger(value))) throw new TypeError('Invalid numeric Pure option.');
  }
  if (!(next.upload.maxSize > 0) || !(next.upload.maxFiles > 0) || (next.upload.maxFiles !== Infinity && !Number.isInteger(next.upload.maxFiles))) throw new TypeError('Invalid upload limits.');
  // Resolve relative assets once, so lazy operations keep the same base.
  const base = globalThis.document?.baseURI || import.meta.url;
  next.iconsUrl = new URL(next.iconsUrl, base).href;
  next.styles.baseUrl = new URL(next.styles.baseUrl, base).href.replace(/\/?$/, '/');
  configuration = next;
  return getPureConfig();
}
/** Returns a detached snapshot. */
export function getPureConfig() { return copy(configuration); }
export function componentOptions(name, options = {}) { return merge(configuration[name] || {}, options); }
export function resolveLocale(doc, locale) {
  const value = locale ?? configuration.locale;
  return value === 'auto' ? doc?.documentElement?.lang || 'en' : value;
}
