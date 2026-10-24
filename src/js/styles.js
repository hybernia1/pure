import { getPureConfig } from './config.js';
const documents = new WeakMap();
const failedLinks = new WeakSet();
const dependencies = {
  tabs: ['components'],
  data: ['components'],
  tokens: [], base: ['tokens'], components: ['base'], states: ['tokens'], forms: ['components'],
  controls: ['forms'], 'drag-drop': ['tokens'], resize: ['controls'], upload: ['forms', 'states'],
  editor: ['controls', 'drag-drop'], modal: ['controls'], 'media-library': ['modal'],
  search: ['controls'], flash: ['components', 'states'], activity: ['components'], progress: ['components', 'states'], utilities: ['tokens'],
};

/** Sdílené styly zůstávají po destroy komponenty v dokumentu. */
export function ensureStyles(names, { document: doc = globalThis.document } = {}) {
  if (!doc?.head) return Promise.reject(new TypeError('A document with a head is required.'));
  const baseUrl = getPureConfig().styles.baseUrl;
  const requested = typeof names === 'string' ? [names] : names;
  const ordered = new Set();
  const visit = name => {
    if (!Object.hasOwn(dependencies, name)) throw new TypeError(`Unknown stylesheet: ${name}`);
    for (const dependency of dependencies[name]) visit(dependency);
    ordered.add(name);
  };
  try { requested.forEach(visit); } catch (error) { return Promise.reject(error); }
  let registry = documents.get(doc); if (!registry) { registry = new Map(); documents.set(doc, registry); }
  const load = (href, existing) => {
    if (registry.has(href)) return registry.get(href);
    const link = existing || [...doc.querySelectorAll('link[rel="stylesheet"]')].find(node => node.href === href && !failedLinks.has(node)) || doc.createElement('link');
    if (link.sheet) return Promise.resolve();
    const owned = !link.isConnected;
    const promise = new Promise((resolve, reject) => {
      const cleanup = () => { clearTimeout(timer); link.removeEventListener('load', loaded); link.removeEventListener('error', failed); };
      const loaded = () => { cleanup(); resolve(); };
      const failed = () => { cleanup(); registry.delete(href); failedLinks.add(link); if (owned) link.remove(); reject(new Error(`Could not load stylesheet: ${href}`)); };
      const timer = setTimeout(failed, 15000);
      link.addEventListener('load', loaded); link.addEventListener('error', failed);
      if (owned) { link.rel = 'stylesheet'; link.href = href; link.dataset.pureStyle = ''; doc.head.append(link); }
    });
    registry.set(href, promise); return promise;
  };
  const bundle = [...doc.querySelectorAll('link[rel="stylesheet"]')].find(link => link.href && !failedLinks.has(link) && (link.dataset.pureStyles === 'all' || new URL(link.href).pathname.endsWith('/pure.css')));
  if (bundle) return load(bundle.href, bundle);
  return Promise.all([...ordered].map(name => load(new URL(`${name}.css`, baseUrl).href))).then(() => undefined);
}
