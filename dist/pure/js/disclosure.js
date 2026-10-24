/** Tlačítko s data-disclosure a aria-controls ovládá jeden panel. */
export function initDisclosures(scope = document) {
  const cleanups = [];
  scope.querySelectorAll('[data-disclosure]').forEach((button) => {
    const panel = button.ownerDocument.getElementById(button.getAttribute('aria-controls'));
    if (!panel) return;
    const update = (open) => {
      button.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    };
    update(button.getAttribute('aria-expanded') === 'true');
    const click = () => update(button.getAttribute('aria-expanded') !== 'true');
    const keydown = (event) => {
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        update(false); button.focus();
      }
    };
    button.addEventListener('click', click);
    panel.addEventListener('keydown', keydown);
    cleanups.push(() => { button.removeEventListener('click', click); panel.removeEventListener('keydown', keydown); });
  });
  return () => cleanups.forEach((cleanup) => cleanup());
}
