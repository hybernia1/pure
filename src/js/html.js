const allowed = new Set(['P', 'DIV', 'BR', 'STRONG', 'EM', 'B', 'I', 'A', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'H2', 'H3', 'CODE', 'PRE']);
const discard = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'TEMPLATE', 'NOSCRIPT']);

import { safeHref } from './url.js';
export { safeHref } from './url.js';

/** Vrací nový fragment: pouze textové HTML, bez stylů, médií a událostí. */
export function htmlFragment(html, doc = document) {
  const template = doc.createElement('template');
  template.innerHTML = String(html);
  const clean = (source, target) => {
    for (const node of source.childNodes) {
      if (node.nodeType === 3) { target.append(doc.createTextNode(node.textContent)); continue; }
      if (node.nodeType !== 1) continue;
      const tag = node.tagName.toUpperCase();
      if (discard.has(tag)) continue;
      if (!allowed.has(tag)) { clean(node, target); continue; }
      const next = doc.createElement(tag.toLowerCase());
      if (tag === 'A') {
        const href = safeHref(node.getAttribute('href'));
        if (href) next.setAttribute('href', href);
      }
      clean(node, next);
      target.append(next);
    }
  };
  const fragment = doc.createDocumentFragment();
  clean(template.content, fragment);
  return fragment;
}

export function cleanHTML(html, doc = document) {
  const container = doc.createElement('div');
  container.append(htmlFragment(html, doc));
  return container.innerHTML;
}
