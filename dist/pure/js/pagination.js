import { paginationPages } from './data.js';
import { componentOptions } from './config.js';
import { uiI18n } from './i18n.js';

/** Works with a shared controller, or with ordinary href links and update(). */
export function createPagination(target, options = {}) {
  const { controller, href, onChange, siblings = 1, locale, messages, ...initial } = componentOptions('pagination', options);
  const doc = target.ownerDocument; const { t } = uiI18n(doc, { locale, messages });
  if (!controller && typeof href !== 'function' && typeof onChange !== 'function') throw new TypeError('Pagination requires controller, href or onChange.');
  const nav = doc.createElement('nav'); nav.className = 'pagination'; nav.setAttribute('aria-label', t('pagination'));
  const summary = doc.createElement('span'); summary.className = 'pagination-summary'; summary.setAttribute('role', 'status'); summary.tabIndex = -1;
  const controls = doc.createElement('div'); controls.className = 'pagination-controls'; nav.append(summary, controls); target.append(nav);
  let state; let destroyed = false;
  const render = next => {
    if (destroyed) return;
    const value = { page: 1, pages: 1, total: 0, status: 'ready', ...next };
    const pages = paginationPages(value.page, value.pages, siblings);
    if (!Number.isSafeInteger(value.total) || value.total < 0) throw new TypeError('Invalid total.');
    state = value;
    const focused = controls.contains(doc.activeElement) ? doc.activeElement.dataset.pageAction : null;
    summary.textContent = t('pageSummary', { page: state.page, pages: state.pages, total: state.total });
    controls.replaceChildren();
    const item = (page, text, action, unavailable = false, numbered = false) => {
      const node = doc.createElement(href && !unavailable ? 'a' : 'button');
      node.className = 'button button-outline'; if (numbered) node.classList.add('pagination-number');
      node.textContent = text; node.dataset.pageAction = action;
      if (node.tagName === 'A') node.href = href(page);
      else { node.type = 'button'; node.disabled = unavailable; }
      if (unavailable) node.setAttribute('aria-disabled', 'true');
      if (numbered) { node.setAttribute('aria-label', t('goPage', { page })); if (page === state.page) node.setAttribute('aria-current', 'page'); }
      node.dataset.page = String(page); controls.append(node);
    };
    item(state.page - 1, t('previousPage'), 'previous', state.page <= 1);
    for (const page of pages) {
      if (page !== null) item(page, String(page), `page-${page}`, false, true);
      else { const gap = doc.createElement('span'); gap.className = 'pagination-number'; gap.textContent = '…'; gap.setAttribute('aria-hidden', 'true'); controls.append(gap); }
    }
    const current = doc.createElement('span'); current.className = 'pagination-mobile'; current.textContent = `${state.page} / ${state.pages}`; controls.append(current);
    item(state.page + 1, t('nextPage'), 'next', state.page >= state.pages);
    if (focused) {
      const match = [...controls.querySelectorAll('[data-page-action]')].find(node => node.dataset.pageAction === focused && !node.disabled);
      (match || summary).focus();
    }
  };
  const click = event => {
    const node = event.target.closest('[data-page]');
    if (!node || !controls.contains(node) || node.disabled || event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!controller && !onChange) return;
    event.preventDefault(); const page = Number(node.dataset.page); if (page === state.page) return;
    if (controller) void controller.setPage(page); else onChange(page);
  };
  controls.addEventListener('click', click);
  let unsubscribe;
  try { if (controller) unsubscribe = controller.subscribe(render); else render(initial); }
  catch (error) { nav.remove(); throw error; }
  return { update: render, destroy() { if (destroyed) return; destroyed = true; unsubscribe?.(); controls.removeEventListener('click', click); nav.remove(); } };
}
