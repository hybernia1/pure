import { loadComponent, configurePure } from '../dist/pure/js/lazy.js';

// Výchozí nastavení celé aplikace; instance může každou volbu přepsat.
configurePure({
  locale: 'auto',
  editor: { features: { images: true, headings: true } },
  upload: { maxSize: 5 * 1024 * 1024 },
});

const toggle = document.querySelector('#lazy-toggle'); const mount = document.querySelector('#lazy-editor');
const status = document.querySelector('#lazy-status'); let editor;
const slot=document.querySelector('#lazy-slot');const skeleton=document.querySelector('#lazy-skeleton');
toggle.addEventListener('click', async () => {
  if (toggle.disabled) return;
  if (editor) {
    editor.destroy(); editor = null; mount.hidden = true; slot.hidden=true; toggle.textContent = 'Otevřít editor'; toggle.setAttribute('aria-expanded', 'false');
    status.textContent = 'Editor odpojený. Již načtené moduly a sdílené CSS zůstávají dostupné.'; return;
  }
  toggle.disabled = true; status.textContent = 'Načítání editoru a stylů…';
  slot.hidden=false;slot.setAttribute('aria-busy','true');skeleton.hidden=false;
  try {
    const { createEditor } = await loadComponent('editor');
    editor = createEditor(document.querySelector('#lazy-source'), {
      async uploadImage(file, { signal }) {
        const { request } = await loadComponent('ajax');
        const result = await request('/api/images', { method: 'POST', headers: { 'Content-Type': file.type }, body: file, type: 'json', signal });
        return { id: result.id, src: result.url };
      },
      mediaLibrary: {
        async load({ query, signal }) {
          const { request } = await loadComponent('ajax');
          const items = await request('./media.json', { type: 'json', signal });
          return items.filter(item => item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
        },
      },
    });
    await editor.ready; skeleton.hidden=true; mount.hidden = false; toggle.textContent = 'Odpojit editor'; toggle.setAttribute('aria-expanded', 'true');
    status.textContent = 'Editor připravený. Odkaz, obrázkový modal a knihovna zatím nejsou inicializované.';
  } catch {
    editor?.destroy(); editor = null; mount.hidden = true; status.textContent = 'Načítání se nezdařilo. Zkus otevření znovu.';
  } finally { toggle.disabled = false; skeleton.hidden=true; slot.setAttribute('aria-busy','false'); }
});
