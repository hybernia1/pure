import { uiI18n } from './i18n.js';
import { formControl, icon, iconButton } from './controls.js';
let errorId = 0;

/** Vlastní textové chyby nad nativní Constraint Validation API. */
export function createForm(form) {
  if (form.tagName !== 'FORM') throw new TypeError('createForm vyžaduje form.');
  const originalNoValidate = form.noValidate;
  const touched = new Set();
  const originals = new Map();
  const fields = () => [...form.elements].filter(field => field.matches('input, select, textarea') && !field.hasAttribute('data-pure-proxy') && field.willValidate);
  const save = (field) => {
    if (!originals.has(field)) originals.set(field, { invalid: field.getAttribute('aria-invalid'), describedby: field.getAttribute('aria-describedby') });
  };
  const restore = (field) => {
    const original = originals.get(field);
    if (!original) return;
    for (const [key, attribute] of [['invalid', 'aria-invalid'], ['describedby', 'aria-describedby']]) {
      if (original[key] === null) field.removeAttribute(attribute); else field.setAttribute(attribute, original[key]);
    }
  };
  const render = (field) => {
    save(field);
    const error = field.closest('[data-field]')?.querySelector('[data-field-error]');
    const invalid = !field.validity.valid;
    if (invalid) {
      field.setAttribute('aria-invalid', 'true');
      if (error) {
        if (!error.id) error.id = `pure-error-${++errorId}`;
        error.textContent = field.dataset.errorMessage || field.validationMessage;
        error.hidden = false;
        const ids = new Set((originals.get(field).describedby || '').split(/\s+/).filter(Boolean)); ids.add(error.id);
        field.setAttribute('aria-describedby', [...ids].join(' '));
      }
    } else {
      restore(field);
      if (error) { error.textContent = ''; error.hidden = true; }
    }
    return !invalid;
  };
  const validate = ({ focus = true } = {}) => {
    let first;
    fields().forEach(field => { touched.add(field); if (!render(field) && !first) first = field; });
    if (first && focus) formControl(first).focus();
    return !first;
  };
  const submit = (event) => { if (!validate()) event.preventDefault(); };
  const input = (event) => { if (touched.has(event.target)) render(event.target); };
  const blur = (event) => { if (fields().includes(event.target)) { touched.add(event.target); render(event.target); } };
  const clear = () => {
    originals.forEach((_, field) => {
      restore(field); const error = field.closest('[data-field]')?.querySelector('[data-field-error]');
      if (error) { error.textContent = ''; error.hidden = true; }
    }); touched.clear();
  };
  let destroyed = false; let resetTimer;
  const reset = event => { clearTimeout(resetTimer); resetTimer = setTimeout(() => { if (!destroyed && !event.defaultPrevented) clear(); }, 0); };
  form.noValidate = true;
  form.addEventListener('submit', submit); form.addEventListener('input', input); form.addEventListener('change', input); form.addEventListener('focusout', blur); form.addEventListener('reset', reset);
  return {
    validate,
    destroy() {
      clear(); destroyed = true; clearTimeout(resetTimer); form.noValidate = originalNoValidate;
      form.removeEventListener('submit', submit); form.removeEventListener('input', input); form.removeEventListener('change', input); form.removeEventListener('focusout', blur); form.removeEventListener('reset', reset);
    },
  };
}

export function initPasswords(scope = document) {
  const cleanups = [];
  scope.querySelectorAll('[data-password-toggle]').forEach(button => {
    const input = button.ownerDocument.getElementById(button.getAttribute('aria-controls'));
    if (!input || input.type !== 'password') return;
    const original = [...button.childNodes];
    const { t } = uiI18n(button.ownerDocument);
    original.forEach(node => node.remove());
    const graphic = icon(button.ownerDocument, 'eye'); button.append(graphic);
    const use = graphic.querySelector('use'); const sprite = use.getAttribute('href').split('#')[0];
    const originalLabel = button.getAttribute('aria-label'); const originalTitle = button.getAttribute('title');
    const originalDisabled = button.disabled;
    const pressed = button.getAttribute('aria-pressed');
    const update = visible => {
      button.disabled = input.matches(':disabled');
      input.type = visible ? 'text' : 'password'; use.setAttribute('href', `${sprite}#${visible ? 'eye-off' : 'eye'}`);
      button.setAttribute('aria-label', t(visible ? 'hidePassword' : 'showPassword')); button.title = t(visible ? 'hidePassword' : 'showPassword'); button.setAttribute('aria-pressed', String(visible));
    };
    const hide = () => update(false);
    const toggle = () => {
      update(input.type === 'password');
    };
    hide(); button.addEventListener('click', toggle); input.form?.addEventListener('reset', hide);
    const observer = new input.ownerDocument.defaultView.MutationObserver(() => { button.disabled = input.matches(':disabled'); });
    observer.observe(input, { attributes: true, attributeFilter: ['disabled'] });
    if (input.closest('fieldset')) observer.observe(input.closest('fieldset'), { attributes: true, attributeFilter: ['disabled'] });
    cleanups.push(() => {
      button.removeEventListener('click', toggle); input.form?.removeEventListener('reset', hide); input.type = 'password'; button.replaceChildren(...original);
      observer.disconnect(); button.disabled = originalDisabled;
      for (const [attribute, value] of [['aria-label', originalLabel], ['title', originalTitle]]) { if (value === null) button.removeAttribute(attribute); else button.setAttribute(attribute, value); }
      if (pressed === null) button.removeAttribute('aria-pressed'); else button.setAttribute('aria-pressed', pressed);
    });
  });
  return () => cleanups.forEach(cleanup => cleanup());
}

/** Ikony a heslová akce uvnitř jednotného obalu. */
export function initInputs(scope = document) {
  const cleanups = [];
  scope.querySelectorAll('input[data-input-icon]').forEach(input => {
    if (input.type === 'password' && !input.id) throw new TypeError('Heslové pole vyžaduje id.');
    const doc = input.ownerDocument; const wrapper = doc.createElement('div'); wrapper.className = 'control control-with-icon';
    const graphic = icon(doc, input.dataset.inputIcon); graphic.classList.add('control-icon');
    input.before(wrapper); wrapper.append(input, graphic);
    if (input.type === 'password') {
      wrapper.classList.add('control-with-action');
      const toggle = iconButton(doc, 'eye', 'Zobrazit heslo'); toggle.classList.add('control-action'); toggle.setAttribute('data-password-toggle', ''); toggle.setAttribute('aria-controls', input.id); wrapper.append(toggle);
      const stop = initPasswords(wrapper); cleanups.push(stop);
    }
    cleanups.push(() => { wrapper.before(input); wrapper.remove(); });
  });
  return () => cleanups.forEach(cleanup => cleanup());
}
