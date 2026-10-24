/** Resolve only the requested component graphs; does not fetch or initialize UI. */
export function getPreloadUrls(names, { manifest, baseUrl = new URL('../', import.meta.url), document: doc = globalThis.document } = {}) {
  if (!manifest || manifest.version !== 1 || !manifest.components) throw new TypeError('A generated Pure preload manifest is required.');
  const requested = typeof names === 'string' ? [names] : names;
  if (!Array.isArray(requested)) throw new TypeError('Component names must be a string or array.');
  const paths = new Set();
  for (const name of requested) {
    if (typeof name !== 'string' || !Object.hasOwn(manifest.components, name)) throw new TypeError(`Unknown preload component: ${name}`);
    const files = manifest.components[name];
    if (!Array.isArray(files)) throw new TypeError('Invalid preload graph.');
    for (const path of files) {
      if (typeof path !== 'string' || !/^js\/[\w.-]+\.js$/.test(path)) throw new TypeError('Invalid preload module path.');
      paths.add(path);
    }
  }
  const base = new URL(baseUrl, doc?.baseURI || import.meta.url);
  if (!base.pathname.endsWith('/')) throw new TypeError('Preload baseUrl must end with a slash.');
  return [...paths].map(path => new URL(path, base).href);
}

/** Add deduplicated modulepreload hints. Component initialization stays explicit. */
export function preloadComponents(names, options = {}) {
  const doc = options.document ?? globalThis.document;
  const urls = getPreloadUrls(names, { ...options, document: doc });
  if (!doc?.head) throw new TypeError('A document with a head is required.');
  const existing = new Map([...doc.querySelectorAll('link[rel="modulepreload"]')].map(link => [link.href, link]));
  return urls.map(href => {
    if (existing.has(href)) return existing.get(href);
    const link = doc.createElement('link'); link.rel = 'modulepreload'; link.href = href;
    doc.head.append(link); existing.set(href, link); return link;
  });
}
