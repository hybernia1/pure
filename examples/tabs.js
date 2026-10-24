import { loadComponent } from '../dist/pure/js/lazy.js';

const status = document.querySelector('#tabs-status');
try {
  const { createTabs } = await loadComponent('tabs');
  createTabs(document.querySelector('#page-tabs'), { onChange: ({ key }) => { status.textContent = `Aktivní záložka: ${key}`; } });
  status.textContent = 'Záložky jsou připravené.';
  const button = document.querySelector('#open-tabs-modal'); let modal; let pending;
  button.addEventListener('click', async () => {
    if (pending) return;
    try {
      pending = loadComponent('modal'); button.disabled = true;
      const { createModal } = await pending;
      if (!modal) {
        createTabs(document.querySelector('#modal-tabs'), { activation: 'manual' });
        modal = createModal(document.querySelector('#tabs-modal'));
      }
      modal.open(button);
    } catch { status.textContent = 'Modal se nepodařilo načíst. Zkus to znovu.'; }
    finally { pending = null; button.disabled = false; }
  });
} catch { status.textContent = 'Záložky se nepodařilo načíst. Obsah zůstává dostupný pod sebou.'; }
