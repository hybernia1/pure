import { safeHref } from './url.js';
import { colorNames } from './colors.js';

const booleanMarks = ['bold', 'italic', 'underline', 'strike'];
const textMarks = [...booleanMarks, 'link', 'color'];
const textRunKeys = ['text', ...textMarks];
export const emptyDocument = () => ({ version: 1, blocks: [{ type: 'paragraph', children: [] }] });
const keys = (object, allowed) => {
  if (!object || typeof object !== 'object' || Array.isArray(object) || Object.keys(object).some(key => !allowed.includes(key))) throw new TypeError('Neplatná struktura dokumentu.');
};
const sameMarks = (a, b) => booleanMarks.every(mark => Boolean(a[mark]) === Boolean(b[mark])) && a.link === b.link && a.color === b.color;
const append = (runs, run) => {
  if (!run.text) return;
  if (runs.length && !run.image && !run.nextBlock && !runs.at(-1).image && !runs.at(-1).nextBlock && sameMarks(runs.at(-1), run)) runs.at(-1).text += run.text;
  else runs.push({ ...run });
};

const normalizeChildren = runs => {
  if (!Array.isArray(runs)) throw new TypeError('Invalid text children.');
  const children = [];
  for (const run of runs) {
    keys(run, textRunKeys);
    if (run.color !== undefined && !colorNames.includes(run.color)) throw new TypeError('Invalid text color.');
    if (typeof run.text !== 'string' || /[\r\n]/.test(run.text)) throw new TypeError('Text odstavce musí být řetězec bez nových řádků.');
    for (const mark of booleanMarks) if (run[mark] !== undefined && typeof run[mark] !== 'boolean') throw new TypeError(`Neplatné ${mark}.`);
    if (run.link !== undefined && (typeof run.link !== 'string' || !safeHref(run.link))) throw new TypeError('Neplatný odkaz.');
    const normalized = { text: run.text };
    for (const mark of booleanMarks) if (run[mark]) normalized[mark] = true;
    if (run.color) normalized.color = run.color;
    if (run.link !== undefined) normalized.link = safeHref(run.link);
    append(children, normalized);
  }
  return children;
};

/** Ověří schéma a vrátí nezávislou kanonickou kopii. Žádná HTML konverze. */
export function normalizeDocument(value) {
  keys(value, ['version', 'blocks']);
  if (value.version !== 1 || !Array.isArray(value.blocks) || !value.blocks.length) throw new TypeError('Dokument vyžaduje version: 1 a neprázdné blocks.');
  const blocks = value.blocks.map(block => {
    if (block.type === 'list') {
      keys(block, ['type', 'style', 'items']);
      if (!['bullet', 'ordered'].includes(block.style) || !Array.isArray(block.items) || !block.items.length) throw new TypeError('Invalid list block.');
      const items = block.items.map(item => { keys(item, ['children']); return { children: normalizeChildren(item.children) }; });
      return { type: 'list', style: block.style, items };
    }
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
    keys(block, ['type', 'level', 'style', 'children']);
    if (!['paragraph', 'heading', 'list-item'].includes(block.type) || !Array.isArray(block.children) || (block.type === 'heading' ? ![2, 3, 4].includes(block.level) : block.level !== undefined) || (block.type === 'list-item' ? !['bullet', 'ordered'].includes(block.style) : block.style !== undefined)) throw new TypeError('Neplatný textový blok.');
    const children = normalizeChildren(block.children);
    return { type: block.type, ...(block.type === 'heading' ? { level: block.level } : {}), ...(block.type === 'list-item' ? { style: block.style } : {}), children };
  });
  const result = []; let legacy;
  for (const block of blocks) {
    if (block.type === 'list-item') {
      if (!legacy || legacy.style !== block.style) { legacy = { type: 'list', style: block.style, items: [] }; result.push(legacy); }
      legacy.items.push({ children: block.children });
    } else { legacy = null; result.push(block); }
  }
  return { version: 1, blocks: result };
}

export function safeImageSource(src) {
  const safe = safeHref(src); return safe && !/^mailto:/i.test(safe) ? safe : null;
}
export function textRows(value) { return value.blocks.flatMap((block, index) => block.type === 'list' ? block.items.map((item, itemIndex) => ({ type: 'list-item', style: block.style, children: item.children, group: index, blockIndex: index, itemIndex })) : [{ ...block, blockIndex: index }]); }
export function blockText(block) { return block.type === 'image' ? '\ufffc' : block.type === 'list' ? block.items.map(item => item.children.map(run => run.text).join('')).join('\n') : block.children.map(run => run.text).join(''); }
export function documentText(value) { return value.blocks.map(blockText).join('\n'); }
export function plainText(value) { return value.blocks.map(block => block.type === 'image' ? block.alt : blockText(block)).join('\n'); }
const meta = block => block.type === 'heading' ? { type: 'heading', level: block.level } : block.type === 'list-item' ? { type: 'list-item', style: block.style, group: block.group } : { type: 'paragraph' };
const pack = rows => {
  const blocks = []; let list; let group;
  for (const row of rows) {
    if (row.type === 'list-item') {
      if (!list || list.style !== row.style || group !== row.group) { list = { type: 'list', style: row.style, items: [] }; group = row.group; blocks.push(list); }
      list.items.push({ children: row.children });
    } else { list = null; const { blockIndex, itemIndex, group, ...block } = row; blocks.push(block); }
  }
  return normalizeDocument({ version: 1, blocks });
};
const stream = value => textRows(value).flatMap((block, index) => [...(index ? [{ text: '\n', nextBlock: meta(block) }] : []), ...(block.type === 'image' ? [{ text: '\ufffc', image: { type: 'image', src: block.src, alt: block.alt, caption: block.caption, mediaId: block.mediaId, width: block.width, align: block.align } }] : block.children.map(run => ({ ...run })))]);
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
  return pack(blocks);
};
const bounds = (value, from, to) => {
  const length = documentText(value).length;
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < from || to > length) throw new RangeError('Výběr je mimo dokument.');
};

export function selectionMarks(value, from, to = from) {
  bounds(value, from, to);
  const start = from === to ? Math.max(0, from - 1) : from;
  const end = from === to ? Math.max(1, from) : to;
  const selected = []; let offset = 0;
  scan: for (const block of value.blocks) {
    if (offset >= end) break;
    if (block.type === 'image') { offset += 2; continue; }
    for (const row of block.type === 'list' ? block.items : [block]) {
      for (const run of row.children) {
        if (offset >= end) break scan;
        const next = offset + run.text.length;
        if (run.text && next > start) selected.push(run);
        offset = next;
      }
      offset++;
    }
  }
  if (!selected.length) return {};
  const marks = {};
  for (const mark of booleanMarks) if (selected.every(run => run[mark])) marks[mark] = true;
  for (const mark of ['color', 'link']) {
    const setting = selected[0][mark];
    if (setting && selected.every(run => run[mark] === setting)) marks[mark] = setting;
  }
  return marks;
}

export function replaceText(value, from, to, text, marks = {}) {
  bounds(value, from, to);
  const runs = stream(value);
  const block = rowAt(value, from).row;
  return fromStream([...slice(runs, 0, from), { ...marks, ...(block.type === 'list-item' ? { nextBlock: meta(block) } : {}), text: String(text).replace(/\r\n?/g, '\n') }, ...slice(runs, to, Infinity)], textRows(value)[0]);
}

let graphemeSegmenter;
const removeImages = (value, indices, offset) => {
  const blocks = value.blocks.filter((_, index) => !indices.includes(index));
  const next = blocks.length ? normalizeDocument({ version: 1, blocks }) : emptyDocument();
  return { value: next, offset: Math.min(offset, documentText(next).length) };
};
/** Model deletion keeps block UI outside the operation and never splits a grapheme. */
export function deleteContent(value, from, to, direction = 'backward') {
  bounds(value, from, to);
  if (!['backward', 'forward'].includes(direction)) throw new TypeError('Invalid deletion direction.');
  const text = documentText(value);
  if (from === 0 && to === text.length && from !== to) return { value: emptyDocument(), offset: 0 };
  if (from !== to) {
    const first = rowAt(value, from), last = rowAt(value, to), rows = textRows(value).slice(first.index, last.index + 1);
    if (from === first.start && to === last.start + 1 && rows.every(row => row.type === 'image')) {
      return removeImages(value, rows.map(row => row.blockIndex), from);
    }
  }
  if (from === to) {
    const rows = textRows(value), at = rowAt(value, from);
    let image;
    if (at.row.type === 'image' && (direction === 'forward' ? from === at.start : from > at.start)) image = at.row;
    else if (direction === 'backward' && from === at.start && rows[at.index - 1]?.type === 'image') image = rows[at.index - 1];
    else if (direction === 'forward' && from === at.start + at.size && rows[at.index + 1]?.type === 'image') image = rows[at.index + 1];
    if (image) {
      const imageStart = value.blocks.slice(0, image.blockIndex).reduce((sum, block) => sum + blockText(block).length + 1, 0);
      return removeImages(value, [image.blockIndex], direction === 'forward' ? from : imageStart);
    }
    if (direction === 'backward' && from === 0 || direction === 'forward' && to === text.length) return { value, offset: from };
    graphemeSegmenter ??= typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
    let index = 0;
    const segments = graphemeSegmenter ? graphemeSegmenter.segment(text) : Array.from(text, segment => {
      const result = { segment, index }; index += segment.length; return result;
    });
    for (const segment of segments) {
      const end = segment.index + segment.segment.length;
      if (direction === 'backward' ? segment.index < from && end >= from : segment.index <= from && end > from) {
        from = segment.index; to = end; break;
      }
    }
  }
  return { value: replaceText(value, from, to, ''), offset: from };
}

/** Detached fragment for Pure-to-Pure clipboard transfer, preserving list groups. */
export function selectionDocument(value, from, to) {
  bounds(value, from, to);
  return fromStream(slice(stream(value), from, to), rowAt(value, from).row);
}

/** Insert structured blocks, merging paragraph edges into the destination row. */
export function replaceDocument(value, from, to, fragment) {
  bounds(value, from, to);
  const incoming = textRows(normalizeDocument(fragment)).map(row => ({ ...row, group: `paste:${row.group}` }));
  const rows = textRows(value), first = rowAt(value, from), last = rowAt(value, to);
  const left = first.row.type === 'image' ? from > first.start ? first.row : null
    : { ...first.row, children: slice(first.row.children, 0, from - first.start) };
  const right = last.row.type === 'image' ? to <= last.start ? last.row : null
    : { ...last.row, children: slice(last.row.children, to - last.start, Infinity) };
  const result = rows.slice(0, first.index);
  const hasLeft = left && (left.type === 'image' || left.children.length);
  if (incoming[0].type === 'paragraph' && left?.type !== 'image') {
    incoming[0] = { ...meta(first.row), children: [...(left?.children || []), ...incoming[0].children] };
  } else if (hasLeft) result.push(left);
  result.push(...incoming);
  const offset = documentText({ blocks: result }).length;
  if (right && (right.type === 'image' || right.children.length)) {
    if (fragment.blocks.at(-1).type === 'paragraph') {
      if (right.type !== 'image') result.at(-1).children.push(...right.children);
      else result.push(right);
    } else result.push(right);
  }
  result.push(...rows.slice(last.index + 1));
  return { value: pack(result), offset };
}

export function formatText(value, from, to, mark, setting) {
  bounds(value, from, to);
  if (!textMarks.includes(mark)) throw new TypeError('Neznámé formátování.');
  if (mark === 'color' && setting !== null && !colorNames.includes(setting)) throw new TypeError('Invalid text color.');
  if (mark === 'link' && setting !== null && !safeHref(setting)) throw new TypeError('Neplatný odkaz.');
  if (booleanMarks.includes(mark) && typeof setting !== 'boolean') throw new TypeError('Formátování musí být boolean.');
  const runs = stream(value);
  const selected = slice(runs, from, to).map(run => {
    const next = { ...run };
    if (setting === false || setting === null) delete next[mark];
    else next[mark] = mark === 'link' ? safeHref(setting) : setting;
    return next;
  });
  return fromStream([...slice(runs, 0, from), ...selected, ...slice(runs, to, Infinity)], textRows(value)[0]);
}

export function blockAt(value, offset) {
  let start = 0;
  for (let index = 0; index < value.blocks.length; index++) {
    const size = blockText(value.blocks[index]).length;
    if (offset <= start + size || index === value.blocks.length - 1) return { index, start, size };
    start += size + 1;
  }
}
export function setHeading(value, from, to, level) {
  bounds(value, from, to);
  if (![0, 2, 3, 4].includes(level)) throw new TypeError('Nadpis musí mít úroveň 2, 3 nebo 4; 0 značí odstavec.');
  const first = blockAt(value, from).index; const last = blockAt(value, Math.max(from, to - 1)).index;
  return pack(textRows(normalizeDocument(value)).map(row => row.blockIndex >= first && row.blockIndex <= last && row.type !== 'image' ? { type: level ? 'heading' : 'paragraph', ...(level ? { level } : {}), children: row.children } : row));
}

export function setList(value, from, to, style) {
  bounds(value, from, to);
  if (style !== null && !['bullet', 'ordered'].includes(style)) throw new TypeError('Invalid list style.');
  const first = blockAt(value, from).index; const last = blockAt(value, Math.max(from, to - 1)).index;
  return pack(textRows(normalizeDocument(value)).map(row => row.blockIndex >= first && row.blockIndex <= last && row.type !== 'image' ? { type: style ? 'list-item' : 'paragraph', ...(style ? { style, group: 'selection' } : {}), children: row.children } : row));
}

export function rowAt(value, offset) {
  let start = 0; const rows = textRows(value);
  for (let index = 0; index < rows.length; index++) { const row = rows[index]; const size = row.type === 'image' ? 1 : row.children.reduce((sum, run) => sum + run.text.length, 0); if (offset <= start + size || index === rows.length - 1) return { row, index, start, size }; start += size + 1; }
}
export function exitListItem(value, offset) {
  const at = rowAt(value, offset); if (at.row.type !== 'list-item') return normalizeDocument(value);
  return pack(textRows(value).map((row, index) => index === at.index ? { type: 'paragraph', children: row.children } : row));
}
