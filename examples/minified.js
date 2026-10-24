import { loadComponent } from '../dist/pure.min/js/lazy.js';

const button = document.querySelector('#open');
const status = document.querySelector('#status');
const source = document.querySelector('#content');
button.addEventListener('click', async () => {
  button.disabled = true; status.textContent = 'Načítání…';
  try {
    const { createEditor } = await loadComponent('editor');
    const editor = createEditor(source);
    await editor.ready;
    button.hidden = true; status.textContent = 'Editor je připravený.';
  } catch {
    button.disabled = false; status.textContent = 'Editor se nepodařilo načíst. Zkus to znovu.';
  }
});
