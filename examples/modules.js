import { loadComponent } from '../dist/js/lazy.js';
const [{ initTheme }, { createFlash }, { createEditor }, { createLoader, request, HttpError }, { createResize }, { createActivity }, { createProgress }, { createDragDrop }] = await Promise.all([
  loadComponent('theme'), loadComponent('flash'), loadComponent('editor'), loadComponent('ajax'), loadComponent('resize'), loadComponent('activity'), loadComponent('progress'), loadComponent('drag-drop'),
]);

initTheme();
createDragDrop(document.querySelector('#sort-demo'), {
  onMove({ items }) { document.querySelector('#sort-result').textContent = `Pořadí: ${items.map(item => item.dataset.id).join(', ')}`; },
});
const activity = createActivity();
const inlineActivity = createActivity({ target: document.querySelector('#activity-inline') });
const progress = createProgress(document.querySelector('#progress-demo'), { label: 'Připraveno' });
const startActivity = document.querySelector('#activity-start'); const stopActivity = document.querySelector('#activity-stop');
let activityTimer; let finishActivity; let finishInline;
function stopActivityDemo() {
  clearInterval(activityTimer); finishActivity?.(); finishInline?.(); startActivity.disabled = false; stopActivity.disabled = true;
}
startActivity.addEventListener('click', () => {
  stopActivityDemo(); startActivity.disabled = true; stopActivity.disabled = false;
  finishActivity = activity.start('Zpracovávám úlohu…'); finishInline = inlineActivity.start('Probíhá zpracování…');
  progress.setState('info', 'Zpracování'); progress.set(0); let value = 0;
  activityTimer = setInterval(() => {
    value += 10; progress.set(value);
    if (value >= 100) { stopActivityDemo(); progress.setState('success', 'Hotovo'); }
  }, 400);
});
stopActivity.addEventListener('click', () => { stopActivityDemo(); progress.setState('info', 'Zpracování zrušeno'); });
document.querySelector('#progress-unknown').addEventListener('click', () => {
  stopActivityDemo(); progress.setState('info', 'Čekání na informace o průběhu'); progress.set(null);
});
const resize = createResize(document.querySelector('#resize-example'), {
  width: 50, min: 25, step: 5,
  onChange: width => { document.querySelector('#resize-value').textContent = `${width} %`; },
});
document.querySelector('#resize-smaller').addEventListener('click', () => resize.smaller());
document.querySelector('#resize-larger').addEventListener('click', () => resize.larger());
document.querySelector('#resize-reset').addEventListener('click', () => resize.setWidth(50));
const flash = createFlash(document.querySelector('#flashes'));
const messages = { error: 'Chyba: změny se nepodařilo uložit.', success: 'Hotovo: změny jsou uložené.', info: 'Informace: pracuješ s lokálním konceptem.' };
document.querySelectorAll('[data-flash]').forEach((button) => {
  button.addEventListener('click', () => flash.show(messages[button.dataset.flash], { state: button.dataset.flash }));
});
const editor = createEditor(document.querySelector('#article'), {
  features: { headings: true, images: true, fullscreen: true },
  mediaLibrary: {
    async load({ query, page, pageSize, signal }) {
      const items = await request('./media.json', { type: 'json', signal });
      const filtered = items.filter(item => item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
      return { items: filtered.slice((page - 1) * pageSize, page * pageSize), hasMore: filtered.length > page * pageSize };
    },
  },
  async uploadImage(file, { signal }) {
    const result = await request('/api/images', { method: 'POST', headers: { 'Content-Type': file.type }, body: file, signal, type: 'json' });
    return { id: result.id ?? result.url.split('/').at(-1), src: result.url, name: file.name };
  },
});
const englishSource = document.querySelector('#article-en');
createEditor(englishSource, { locale: 'en', features: { headings: true, images: true }, messages: { words: 'Word count: {count}' } });
document.querySelector('#editor-form').addEventListener('submit', (event) => {
  event.preventDefault(); document.querySelector('#editor-output').textContent = JSON.stringify(editor.getJSON(), null, 2);
});
const loader = createLoader(document.querySelector('#loaded'));
const status = document.querySelector('#load-status');
let attempt = 0;
async function load(url) {
  const current = ++attempt;
  status.dataset.state = 'info'; status.textContent = 'Načítání…';
  try {
    const result = await loader.load(url, { format: 'html' });
    if (current !== attempt) return;
    status.dataset.state = result === null ? 'info' : 'success';
    status.textContent = result === null ? 'Načítání zrušeno.' : 'Hotovo: obsah načten.';
  } catch (error) {
    if (current !== attempt) return;
    status.dataset.state = 'error'; status.textContent = error instanceof HttpError ? `Chyba serveru: ${error.status}. Původní obsah zůstává.` : 'Chyba připojení. Zkus to znovu.';
    flash.show(status.textContent, { state: 'error' });
  }
}
document.querySelector('#load').addEventListener('click', () => load('./fragment.html'));
document.querySelector('#load-error').addEventListener('click', () => load('./missing.html'));
document.querySelector('#cancel').addEventListener('click', () => { attempt++; loader.cancel(); status.dataset.state = 'info'; status.textContent = 'Načítání zrušeno.'; });
