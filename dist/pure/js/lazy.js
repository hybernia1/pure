import { getPureConfig } from './config.js';
export { configurePure, getPureConfig } from './config.js';
import { ensureStyles } from './styles.js';

const modules = {
  image: [() => import('./image.js'), []],
  'tag-picker': [() => import('./tag-picker.js'), ['tag-picker']],
  navigation: [() => import('./navigation.js'), ['navigation']],
  tabs: [() => import('./tabs.js'), ['tabs']],
  data: [() => import('./data.js'), []],
  table: [() => import('./table.js'), ['data']],
  list: [() => import('./list.js'), ['data']],
  pagination: [() => import('./pagination.js'), ['data']],
  theme: [() => import('./theme.js'), ['tokens']],
  disclosure: [() => import('./disclosure.js'), []],
  ajax: [() => import('./ajax.js'), []],
  forms: [() => import('./forms.js'), ['controls']],
  select: [() => import('./select.js'), ['controls']],
  picker: [() => import('./picker.js'), ['controls']],
  modal: [() => import('./modal.js'), ['modal']],
  upload: [() => import('./upload.js'), ['upload']],
  resize: [() => import('./resize.js'), ['resize']],
  editor: [() => import('./editor.js'), ['editor']],
  'media-library': [() => import('./media-library.js'), ['media-library']],
  search: [() => import('./search.js'), ['search']],
  flash: [() => import('./flash.js'), ['flash']],
  activity: [() => import('./activity.js'), ['activity']],
  progress: [() => import('./progress.js'), ['progress']],
  'drag-drop': [() => import('./drag-drop.js'), ['drag-drop']],
};

export async function loadComponent(name, { document: doc = globalThis.document, styles = getPureConfig().styles.auto } = {}) {
  if (!Object.hasOwn(modules, name)) throw new TypeError(`Unknown Pure component: ${name}`);
  const [load, css] = modules[name];
  const [module] = await Promise.all([load(), styles && css.length ? ensureStyles(css, { document: doc }) : undefined]);
  return module;
}

export { ensureStyles } from './styles.js';
