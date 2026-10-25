import { normalizeDocument } from './editor-model.js';
import { safeHref } from './url.js';

export const clipboardType = 'application/x-pure-document+json';
const ignored = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'TEMPLATE', 'HEAD', 'META', 'LINK']);
const containers = new Set(['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'HEADER', 'FOOTER', 'BLOCKQUOTE', 'PRE', 'TABLE', 'TBODY', 'THEAD', 'TFOOT', 'TR']);
const textBlocks = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH']);

/** Supported semantic HTML for other applications; Pure JSON stays authoritative. */
export function clipboardHTML(value, { document: doc } = {}) {
  const root = doc.createElement('div');
  const writeRuns = (target, runs) => {
    for (const run of runs) {
      let node = doc.createTextNode(run.text);
      for (const [mark, tag] of [['bold', 'strong'], ['italic', 'em'], ['underline', 'u'], ['strike', 's'], ['link', 'a']]) {
        if (!run[mark]) continue;
        const wrapper = doc.createElement(tag);
        if (mark === 'link') wrapper.setAttribute('href', run.link);
        wrapper.append(node); node = wrapper;
      }
      target.append(node);
    }
  };
  for (const block of normalizeDocument(value).blocks) {
    const element = doc.createElement(block.type === 'list' ? block.style === 'ordered' ? 'ol' : 'ul' : block.type === 'heading' ? `h${block.level}` : 'p');
    if (block.type === 'image') element.textContent = block.alt;
    else if (block.type === 'list') {
      for (const item of block.items) { const li = doc.createElement('li'); writeRuns(li, item.children); element.append(li); }
    } else writeRuns(element, block.children);
    root.append(element);
  }
  return root.innerHTML;
}

/** Convert inert clipboard markup to the supported JSON subset; never attach it. */
export function clipboardDocument(html, { document: doc, headings = true } = {}) {
  if (html.length > 1_000_000) return null;
  const template = doc.createElement('template');
  template.innerHTML = html;
  const blocks = [];
  let children = [];
  let visited = 0, exceeded = false;
  const flush = (empty = false, target = blocks, type = { type: 'paragraph' }) => {
    if (children.length || empty) target.push({ ...type, children });
    children = [];
  };
  const append = (text, marks, preserve) => {
    text = text.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ');
    if (!preserve) text = text.replace(/[\t\n\f ]+/g, ' ');
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      if (index) flush(true);
      if (line) children.push({ text: line, ...marks });
    });
  };
  const walk = (node, marks = {}, preserve = false, depth = 0) => {
    if (++visited > 10_000 || depth > 64) { exceeded = true; return; }
    if (node.nodeType === 3) {
      // Ignore pretty-print indentation between blocks, retain inline spaces.
      if (!children.length && !node.textContent.trim()) return;
      append(node.textContent, marks, preserve); return;
    }
    if (node.nodeType !== 1 || ignored.has(node.tagName) || node.hasAttribute('hidden')) return;
    const tag = node.tagName;
    if (tag === 'IMG') { if (node.getAttribute('alt')) append(node.getAttribute('alt'), marks, preserve); return; }
    if (tag === 'BR') { flush(true); return; }
    const next = { ...marks };
    if (['B', 'STRONG'].includes(tag)) next.bold = true;
    if (['I', 'EM'].includes(tag)) next.italic = true;
    if (tag === 'U') next.underline = true;
    if (['S', 'STRIKE', 'DEL'].includes(tag)) next.strike = true;
    if (tag === 'A') { const link = safeHref(node.getAttribute('href') || ''); if (link) next.link = link; }
    // Common office/browser inline marks. Arbitrary CSS and colors are discarded.
    const style = node.style;
    if (style.fontWeight === 'bold' || Number(style.fontWeight) >= 600) next.bold = true;
    else if (style.fontWeight === 'normal' || Number(style.fontWeight) > 0) delete next.bold;
    if (style.fontStyle === 'italic') next.italic = true;
    else if (style.fontStyle === 'normal') delete next.italic;
    if (style.textDecorationLine.includes('underline') || style.textDecoration.includes('underline')) next.underline = true;
    if (style.textDecorationLine.includes('line-through') || style.textDecoration.includes('line-through')) next.strike = true;
    if (tag === 'UL' || tag === 'OL') {
      flush();
      const start = blocks.length;
      for (const child of node.children) {
        if (child.tagName !== 'LI') continue;
        flush();
        const before = blocks.length;
        // Nested lists become separate blocks; the JSON model is flat.
        for (const part of child.childNodes) walk(part, next, preserve, depth + 1);
        flush(blocks.length === before);
      }
      const rows = blocks.splice(start);
      const items = [];
      const finish = () => { if (items.length) blocks.push({ type: 'list', style: tag === 'OL' ? 'ordered' : 'bullet', items: items.splice(0) }); };
      for (const row of rows) {
        if (row.type === 'list') { finish(); blocks.push(row); }
        else items.push({ children: row.children });
      }
      finish(); return;
    }
    const block = textBlocks.has(tag) || containers.has(tag);
    if (block) flush();
    const start = blocks.length;
    for (const child of node.childNodes) walk(child, next, preserve || tag === 'PRE', depth + 1);
    if (block) {
      const type = headings && /^H[1-6]$/.test(tag) ? { type: 'heading', level: Math.max(2, Math.min(4, Number(tag[1]))) } : { type: 'paragraph' };
      flush(textBlocks.has(tag) && blocks.length === start, blocks, type);
      if (type.type === 'heading') for (let index = start; index < blocks.length; index++) if (blocks[index].type === 'paragraph') Object.assign(blocks[index], type);
    }
  };
  for (const child of template.content.childNodes) walk(child);
  flush();
  const hasText = blocks.some(block => (block.type === 'list' ? block.items : [block]).some(row => row.children.some(run => run.text.trim())));
  return hasText && !exceeded ? normalizeDocument({ version: 1, blocks }) : null;
}
