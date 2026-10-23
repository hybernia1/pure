import { htmlFragment } from './html.js';

export class HttpError extends Error {
  constructor(response) { super(`HTTP ${response.status}`); this.name = 'HttpError'; this.status = response.status; this.response = response; }
}

/** Nízká vrstva fetch: kontrola HTTP stavu + explicitní typ odpovědi. */
export async function request(url, { type = 'text', ...options } = {}) {
  if (!['text', 'json'].includes(type)) throw new TypeError(`Neznámý typ: ${type}`);
  const response = await fetch(url, options);
  if (!response.ok) throw new HttpError(response);
  return type === 'json' ? response.json() : response.text();
}

/** Jeden loader na jeden cíl. Poslední požadavek vyhrává. */
export function createLoader(target) {
  let controller;
  let sequence = 0;
  let destroyed = false;
  const initialBusy = target.getAttribute('aria-busy');
  const restoreBusy = () => {
    if (initialBusy === null) target.removeAttribute('aria-busy');
    else target.setAttribute('aria-busy', initialBusy);
  };
  const cancel = () => { sequence++; controller?.abort(); restoreBusy(); };
  return {
    async load(url, { format = 'text', ...options } = {}) {
      if (destroyed) throw new Error('Loader byl odpojen.');
      if (!['text', 'html'].includes(format)) throw new TypeError(`Neznámý formát: ${format}`);
      cancel();
      controller = new AbortController();
      const current = sequence;
      const externalSignal = options.signal;
      const abort = () => controllerForRequest.abort();
      const controllerForRequest = controller;
      if (externalSignal?.aborted) abort();
      else externalSignal?.addEventListener('abort', abort, { once: true });
      target.setAttribute('aria-busy', 'true');
      try {
        const result = await request(url, { ...options, type: 'text', signal: controllerForRequest.signal });
        if (current !== sequence || controllerForRequest.signal.aborted) return null;
        if (format === 'html') target.replaceChildren(htmlFragment(result, target.ownerDocument));
        else target.textContent = result;
        return result;
      } catch (error) {
        if (controllerForRequest.signal.aborted || current !== sequence) return null;
        throw error;
      } finally {
        externalSignal?.removeEventListener('abort', abort);
        if (current === sequence) restoreBusy();
      }
    },
    cancel,
    destroy() { cancel(); destroyed = true; },
  };
}
