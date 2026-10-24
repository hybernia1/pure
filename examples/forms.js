import { loadComponent } from '../dist/js/lazy.js';
const [{ initTheme }, { createForm, initInputs }, { initPickers }, { initSelects }, { initModals }, { createUpload }, { createSearch }, { request }] = await Promise.all([
  loadComponent('theme'), loadComponent('forms'), loadComponent('picker'), loadComponent('select'), loadComponent('modal'), loadComponent('upload'), loadComponent('search'), loadComponent('ajax'),
]);
initTheme(); initInputs(); initPickers(); initSelects(); initModals();
createSearch(document.querySelector('#people-search'), {
  async fetch(query, { signal }) {
    const items = await request('./search-items.json', { type: 'json', signal });
    return items.filter(item => item.label.toLocaleLowerCase('cs').includes(query.toLocaleLowerCase('cs')));
  },
  onSelect(item) { document.querySelector('#people-search-result').textContent = `Vybráno: ${item.label} (${item.value})`; },
});
const form = document.querySelector('#profile');
const controller = createForm(form);
createUpload(document.querySelector('#attachments'), { maxFiles: 3, maxSize: 5 * 1024 * 1024 });
createUpload(document.querySelector('#images'), { maxFiles: 4, maxSize: 5 * 1024 * 1024 });
const status = document.querySelector('#form-status');
form.addEventListener('submit', event => {
  const valid = !event.defaultPrevented;
  event.preventDefault();
  status.dataset.state = valid ? 'success' : 'error';
  const files = [...new FormData(form).values()].filter(value => value instanceof File && value.name);
  status.textContent = valid ? `Hotovo: formulář je platný. Připraveno souborů: ${files.length}. Nic nebylo odesláno.` : 'Chyba: oprav označená pole.';
});
form.addEventListener('reset', () => { status.textContent = ''; status.removeAttribute('data-state'); });
