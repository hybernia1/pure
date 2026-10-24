import { loadComponent } from '../dist/pure/js/lazy.js';
const status = document.querySelector('#navigation-status');
try {
  const { createNavigation } = await loadComponent('navigation');
  createNavigation(document.querySelector('[data-navigation]'));
  status.textContent = 'Navigace je připravená.';
} catch { status.textContent = 'Rozšířenou navigaci se nepodařilo načíst. Odkazy zůstávají dostupné.'; }
