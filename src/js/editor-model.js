import { safeHref } from './url.js';

export const emptyDocument = () => ({ version: 1, blocks: [{ type: 'paragraph', children: [] }] });
const keys = (object, allowed) => {
  if (!object || typeof object !== 'object' || Array.isArray(object) || Object.keys(object).some(key => !allowed.includes(key))) throw new TypeError('Neplatná struktura dokumentu.');
};
const sameMarks = (a, b) => Boolean(a.bold) === Boolean(b.bold) && Boolean(a.italic) === Boolean(b.italic) && a.link === b.link;
const append = (runs, run) => {
  if (!run.text) return;
  if (runs.length && !run.image && !run.nextBlock && !runs.at(-1).image && !runs.at(-1).nextBlock && sameMarks(runs.at(-1), run)) runs.at(-1).text += run.text;
  else runs.push({ ...run });
};

/** Ověří schéma a vrátí nezávislou kanonickou kopii. Žádná HTML konverze. */
export function normalizeDocument(value) {
  keys(value, ['version', 'blocks']);
  if (value.version !== 1 || !Array.isArray(value.blocks) || !value.blocks.length) throw new TypeError('Dokument vyžaduje version: 1 a neprázdné blocks.');
  return { version: 1, blocks: value.blocks.map(block => {
    if (block.type === 'image') {
      keys(block, ['type', 'src', 'alt', 'caption', 'width', 'align', 'mediaId']);
      const mediaId = block.mediaId ?? null;
      if (mediaId !== null && !(typeof mediaId === 'string' && mediaId.trim()) && !(typeof mediaId === 'number' && Number.isFinite(mediaId))) throw new TypeError('Neplatné mediaId.');
      if (typeof block.src !== 'string' || !safeImageSource(block.src) || typeof block.alt !== 'string') throw new TypeError('Obrázek vyžaduje bezpečné src a text alt.');
      if (block.caption !== undefined && typeof block.caption !== 'string') throw new TypeError('Popisek musí být text.');
      const width = block.width ?? 100; const align = block.align ?? 'center';
      if (![25, 50, 75, 100].includes(width) || !['left', 'center', 'right'].includes(align)) throw new TypeError('Neplatná velikost nebo zarovnání obrázku.');
      return { type: 'image', src: safeImageSource(block.src), mediaId, alt: block.alt, ...(block.caption ? { caption: block.caption } : {}), width, align };
    }
    keys(block, ['type', 'level', 'children']);
    if (!['paragraph', 'heading'].includes(block.type) || !Array.isArray(block.children) || (block.type === 'heading' && ![2, 3, 4].includes(block.level)) || (block.type === 'paragraph' && block.level !== undefined)) throw new TypeError('Neplatný textový blok.');
    const children = [];
    for (const run of block.children) {
      keys(run, ['text', 'bold', 'italic', 'link']);
      if (typeof run.text !== 'string' || /[\r\n]/.test(run.text)) throw new TypeError('Text odstavce musí být řetězec bez nových řádků.');
      for (const mark of ['bold', 'italic']) if (run[mark] !== undefined && typeof run[mark] !== 'boolean') throw new TypeError(`Neplatné ${mark}.`);
      if (run.link !== undefined && (typeof run.link !== 'string' || !safeHref(run.link))) throw new TypeError('Neplatný odkaz.');
      append(children, { text: run.text, ...(run.bold ? { bold: true } : {}), ...(run.italic ? { italic: true } : {}), ...(run.link !== undefined ? { link: safeHref(run.link) } : {}) });
    }
    return { type: block.type, ...(block.type === 'heading' ? { level: block.level } : {}), children };
  }) };
}

export function safeImageSource(src) {
  const safe = safeHref(src); return safe && !/^mailto:/i.test(safe) ? safe : null;
}
export function documentText(value) { return value.blocks.map(block => block.type === 'image' ? '\ufffc' : block.children.map(run => run.text).join('')).join('\n'); }
export function plainText(value) { return value.blocks.map(block => block.type === 'image' ? block.alt : block.children.map(run => run.text).join('')).join('\n'); }
const meta = block => block.type === 'heading' ? { type: 'heading', level: block.level } : { type: 'paragraph' };
const stream = value => value.blocks.flatMap((block, index) => [...(index ? [{ text: '\n', nextBlock: meta(block) }] : []), ...(block.type === 'image' ? [{ text: '\ufffc', image: { ...block } }] : block.children.map(run => ({ ...run })))]);
const slice = (runs, from, to) => {
  const result = []; let offset = 0;
  for (const run of runs) {
    const start = Math.max(0, from - offset); const end = Math.min(run.text.length, to - offset);
    if (end > start) append(result, { ...run, text: run.text.slice(start, end) });
    offset += run.text.length;
  }
  return result;
};
const fromStream = (runs, firstBlock = { type: 'paragraph' }) => {
  const blocks = [{ ...meta(firstBlock), children: [] }];
  for (const run of runs) {
    if (run.image) {
      if (blocks.at(-1).children?.length === 0) blocks[blocks.length - 1] = { ...run.image };
      else blocks.push({ ...run.image });
      continue;
    }
    run.text.split('\n').forEach((text, index) => {
      if (index) blocks.push({ ...(run.nextBlock || { type: 'paragraph' }), children: [] });
      if (text && blocks.at(-1).type === 'image') blocks.push({ type: 'paragraph', children: [] });
      if (text) { const { nextBlock, image, ...marks } = run; append(blocks.at(-1).children, { ...marks, text }); }
    });
  }
  return normalizeDocument({ version: 1, blocks });
};
const bounds = (value, from, to) => {
  const length = documentText(value).length;
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < from || to > length) throw new RangeError('Výběr je mimo dokument.');
};

export function selectionMarks(value, from, to = from) {
  bounds(value, from, to);
  const runs = stream(value);
  const selected = slice(runs, from === to ? Math.max(0, from - 1) : from, from === to ? Math.max(1, from) : to).filter(run => run.text !== '\n' && !run.image);
  if (!selected.length) return {};
  return {
    ...(selected.every(run => run.bold) ? { bold: true } : {}),
    ...(selected.every(run => run.italic) ? { italic: true } : {}),
    ...(selected[0].link && selected.every(run => run.link === selected[0].link) ? { link: selected[0].link } : {}),
  };
}

export function replaceText(value, from, to, text, marks = {}) {
  bounds(value, from, to);
  const runs = stream(value);
  return fromStream([...slice(runs, 0, from), { ...marks, text: String(text).replace(/\r\n?/g, '\n') }, ...slice(runs, to, Infinity)], value.blocks[0]);
}

export function formatText(value, from, to, mark, setting) {
  bounds(value, from, to);
  if (!['bold', 'italic', 'link'].includes(mark)) throw new TypeError('Neznámé formátování.');
  if (mark === 'link' && setting !== null && !safeHref(setting)) throw new TypeError('Neplatný odkaz.');
  if (mark !== 'link' && typeof setting !== 'boolean') throw new TypeError('Formátování musí být boolean.');
  const runs = stream(value);
  const selected = slice(runs, from, to).map(run => {
    const next = { ...run };
    if (setting === false || setting === null) delete next[mark];
    else next[mark] = mark === 'link' ? safeHref(setting) : setting;
    return next;
  });
  return fromStream([...slice(runs, 0, from), ...selected, ...slice(runs, to, Infinity)], value.blocks[0]);
}

export function blockAt(value, offset) {
  let start = 0;
  for (let index = 0; index < value.blocks.length; index++) {
    const size = value.blocks[index].type === 'image' ? 1 : value.blocks[index].children.reduce((n, run) => n + run.text.length, 0);
    if (offset <= start + size || index === value.blocks.length - 1) return { index, start, size };
    start += size + 1;
  }
}
export function setHeading(value, from, to, level) {
  if (![0, 2, 3, 4].includes(level)) throw new TypeError('Nadpis musí mít úroveň 2, 3 nebo 4; 0 značí odstavec.');
  const result = normalizeDocument(value); const first = blockAt(value, from).index; const last = blockAt(value, Math.max(from, to - 1)).index;
  for (let index = first; index <= last; index++) if (result.blocks[index].type !== 'image') result.blocks[index] = { type: level ? 'heading' : 'paragraph', ...(level ? { level } : {}), children: result.blocks[index].children };
  return result;
}
