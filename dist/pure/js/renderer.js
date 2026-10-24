import { normalizeDocument } from './editor-model.js';

/** Internal rendering accepts only an already validated, detached model. */
function renderModel(model, doc) {
  const fragment = doc.createDocumentFragment();
  const element = (tag, text) => { const node = doc.createElement(tag); if (text !== undefined) node.textContent = text; return node; };
  const runs = (parent, children) => {
    for (const run of children) {
      let node = doc.createTextNode(run.text);
      if (run.color) { const span = element('span'); span.dataset.textColor = run.color; span.style.color = `var(--p-${run.color}, var(--p-text))`; span.append(node); node = span; }
      for (const [mark, tag] of [['bold', 'strong'], ['italic', 'em'], ['underline', 'u'], ['strike', 's'], ['link', 'a']]) if (run[mark]) {
        const wrapper = element(tag); if (mark === 'link') wrapper.setAttribute('href', run.link); wrapper.append(node); node = wrapper;
      }
      parent.append(node);
    }
  };
  for (const block of model.blocks) {
    let node;
    if (block.type === 'image') {
      node = element('figure'); node.className = 'content-image'; node.dataset.align = block.align; node.dataset.width = String(block.width);
      if (block.mediaId !== null) node.dataset.mediaId = String(block.mediaId);
      const image = element('img'); image.setAttribute('src', block.src); image.setAttribute('alt', block.alt); image.loading = 'lazy'; image.decoding = 'async'; node.append(image);
      if (block.caption) node.append(element('figcaption', block.caption));
    } else if (block.type === 'list') {
      node = element(block.style === 'ordered' ? 'ol' : 'ul');
      for (const item of block.items) { const li = element('li'); runs(li, item.children); node.append(li); }
    } else { node = element(block.type === 'heading' ? `h${block.level}` : 'p'); runs(node, block.children); }
    fragment.append(node);
  }
  return fragment;
}

/** Validate the complete JSON document before creating any DOM. Never parses HTML. */
export function renderDocument(value, { document: doc = globalThis.document } = {}) {
  return renderModel(normalizeDocument(value), doc);
}

/** Owns only its wrapper; pre-existing target content is preserved. */
export function createRenderer(target, value) {
  const root = target.ownerDocument.createElement('div'); root.className = 'content'; let model; let destroyed = false;
  function update(next) {
    if (destroyed) throw new Error('Renderer is destroyed.');
    const normalized = normalizeDocument(next); const fragment = renderModel(normalized, target.ownerDocument);
    root.replaceChildren(fragment); model = normalized;
  }
  update(value); target.append(root);
  return { element: root, update, getJSON: () => normalizeDocument(model), destroy() { destroyed = true; root.remove(); } };
}
