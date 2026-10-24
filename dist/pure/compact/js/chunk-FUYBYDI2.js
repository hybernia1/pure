import {
  safeHref
} from "./chunk-3SIP5CGE.js";
import {
  colorNames
} from "./chunk-I2KQSOTD.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/editor-model.js
var booleanMarks = ["bold", "italic", "underline", "strike"];
var textMarks = [...booleanMarks, "link", "color"];
var textRunKeys = ["text", ...textMarks];
var emptyDocument = /* @__PURE__ */ __name(() => ({ version: 1, blocks: [{ type: "paragraph", children: [] }] }), "emptyDocument");
var keys = /* @__PURE__ */ __name((object, allowed) => {
  if (!object || typeof object !== "object" || Array.isArray(object) || Object.keys(object).some((key) => !allowed.includes(key))) throw new TypeError("Neplatn\xE1 struktura dokumentu.");
}, "keys");
var sameMarks = /* @__PURE__ */ __name((a, b) => booleanMarks.every((mark) => Boolean(a[mark]) === Boolean(b[mark])) && a.link === b.link && a.color === b.color, "sameMarks");
var append = /* @__PURE__ */ __name((runs, run) => {
  if (!run.text) return;
  if (runs.length && !run.image && !run.nextBlock && !runs.at(-1).image && !runs.at(-1).nextBlock && sameMarks(runs.at(-1), run)) runs.at(-1).text += run.text;
  else runs.push({ ...run });
}, "append");
var normalizeChildren = /* @__PURE__ */ __name((runs) => {
  if (!Array.isArray(runs)) throw new TypeError("Invalid text children.");
  const children = [];
  for (const run of runs) {
    keys(run, textRunKeys);
    if (run.color !== void 0 && !colorNames.includes(run.color)) throw new TypeError("Invalid text color.");
    if (typeof run.text !== "string" || /[\r\n]/.test(run.text)) throw new TypeError("Text odstavce mus\xED b\xFDt \u0159et\u011Bzec bez nov\xFDch \u0159\xE1dk\u016F.");
    for (const mark of booleanMarks) if (run[mark] !== void 0 && typeof run[mark] !== "boolean") throw new TypeError(`Neplatn\xE9 ${mark}.`);
    if (run.link !== void 0 && (typeof run.link !== "string" || !safeHref(run.link))) throw new TypeError("Neplatn\xFD odkaz.");
    const normalized = { text: run.text };
    for (const mark of booleanMarks) if (run[mark]) normalized[mark] = true;
    if (run.color) normalized.color = run.color;
    if (run.link !== void 0) normalized.link = safeHref(run.link);
    append(children, normalized);
  }
  return children;
}, "normalizeChildren");
function normalizeDocument(value) {
  keys(value, ["version", "blocks"]);
  if (value.version !== 1 || !Array.isArray(value.blocks) || !value.blocks.length) throw new TypeError("Dokument vy\u017Eaduje version: 1 a nepr\xE1zdn\xE9 blocks.");
  const blocks = value.blocks.map((block) => {
    if (block.type === "list") {
      keys(block, ["type", "style", "items"]);
      if (!["bullet", "ordered"].includes(block.style) || !Array.isArray(block.items) || !block.items.length) throw new TypeError("Invalid list block.");
      const items = block.items.map((item) => {
        keys(item, ["children"]);
        return { children: normalizeChildren(item.children) };
      });
      return { type: "list", style: block.style, items };
    }
    if (block.type === "image") {
      keys(block, ["type", "src", "alt", "caption", "width", "align", "mediaId"]);
      const mediaId = block.mediaId ?? null;
      if (mediaId !== null && !(typeof mediaId === "string" && mediaId.trim()) && !(typeof mediaId === "number" && Number.isFinite(mediaId))) throw new TypeError("Neplatn\xE9 mediaId.");
      if (typeof block.src !== "string" || !safeImageSource(block.src) || typeof block.alt !== "string") throw new TypeError("Obr\xE1zek vy\u017Eaduje bezpe\u010Dn\xE9 src a text alt.");
      if (block.caption !== void 0 && typeof block.caption !== "string") throw new TypeError("Popisek mus\xED b\xFDt text.");
      const width = block.width ?? 100;
      const align = block.align ?? "center";
      if (![25, 50, 75, 100].includes(width) || !["left", "center", "right"].includes(align)) throw new TypeError("Neplatn\xE1 velikost nebo zarovn\xE1n\xED obr\xE1zku.");
      return { type: "image", src: safeImageSource(block.src), mediaId, alt: block.alt, ...block.caption ? { caption: block.caption } : {}, width, align };
    }
    keys(block, ["type", "level", "style", "children"]);
    if (!["paragraph", "heading", "list-item"].includes(block.type) || !Array.isArray(block.children) || (block.type === "heading" ? ![2, 3, 4].includes(block.level) : block.level !== void 0) || (block.type === "list-item" ? !["bullet", "ordered"].includes(block.style) : block.style !== void 0)) throw new TypeError("Neplatn\xFD textov\xFD blok.");
    const children = normalizeChildren(block.children);
    return { type: block.type, ...block.type === "heading" ? { level: block.level } : {}, ...block.type === "list-item" ? { style: block.style } : {}, children };
  });
  const result = [];
  let legacy;
  for (const block of blocks) {
    if (block.type === "list-item") {
      if (!legacy || legacy.style !== block.style) {
        legacy = { type: "list", style: block.style, items: [] };
        result.push(legacy);
      }
      legacy.items.push({ children: block.children });
    } else {
      legacy = null;
      result.push(block);
    }
  }
  return { version: 1, blocks: result };
}
__name(normalizeDocument, "normalizeDocument");
function safeImageSource(src) {
  const safe = safeHref(src);
  return safe && !/^mailto:/i.test(safe) ? safe : null;
}
__name(safeImageSource, "safeImageSource");
function textRows(value) {
  return value.blocks.flatMap((block, index) => block.type === "list" ? block.items.map((item, itemIndex) => ({ type: "list-item", style: block.style, children: item.children, group: index, blockIndex: index, itemIndex })) : [{ ...block, blockIndex: index }]);
}
__name(textRows, "textRows");
function blockText(block) {
  return block.type === "image" ? "\uFFFC" : block.type === "list" ? block.items.map((item) => item.children.map((run) => run.text).join("")).join("\n") : block.children.map((run) => run.text).join("");
}
__name(blockText, "blockText");
function documentText(value) {
  return value.blocks.map(blockText).join("\n");
}
__name(documentText, "documentText");
function plainText(value) {
  return value.blocks.map((block) => block.type === "image" ? block.alt : blockText(block)).join("\n");
}
__name(plainText, "plainText");
var meta = /* @__PURE__ */ __name((block) => block.type === "heading" ? { type: "heading", level: block.level } : block.type === "list-item" ? { type: "list-item", style: block.style, group: block.group } : { type: "paragraph" }, "meta");
var pack = /* @__PURE__ */ __name((rows) => {
  const blocks = [];
  let list;
  let group;
  for (const row of rows) {
    if (row.type === "list-item") {
      if (!list || list.style !== row.style || group !== row.group) {
        list = { type: "list", style: row.style, items: [] };
        group = row.group;
        blocks.push(list);
      }
      list.items.push({ children: row.children });
    } else {
      list = null;
      const { blockIndex, itemIndex, group: group2, ...block } = row;
      blocks.push(block);
    }
  }
  return normalizeDocument({ version: 1, blocks });
}, "pack");
var stream = /* @__PURE__ */ __name((value) => textRows(value).flatMap((block, index) => [...index ? [{ text: "\n", nextBlock: meta(block) }] : [], ...block.type === "image" ? [{ text: "\uFFFC", image: { type: "image", src: block.src, alt: block.alt, caption: block.caption, mediaId: block.mediaId, width: block.width, align: block.align } }] : block.children.map((run) => ({ ...run }))]), "stream");
var slice = /* @__PURE__ */ __name((runs, from, to) => {
  const result = [];
  let offset = 0;
  for (const run of runs) {
    const start = Math.max(0, from - offset);
    const end = Math.min(run.text.length, to - offset);
    if (end > start) append(result, { ...run, text: run.text.slice(start, end) });
    offset += run.text.length;
  }
  return result;
}, "slice");
var fromStream = /* @__PURE__ */ __name((runs, firstBlock = { type: "paragraph" }) => {
  const blocks = [{ ...meta(firstBlock), children: [] }];
  for (const run of runs) {
    if (run.image) {
      if (blocks.at(-1).children?.length === 0) blocks[blocks.length - 1] = { ...run.image };
      else blocks.push({ ...run.image });
      continue;
    }
    run.text.split("\n").forEach((text, index) => {
      if (index) blocks.push({ ...run.nextBlock || { type: "paragraph" }, children: [] });
      if (text && blocks.at(-1).type === "image") blocks.push({ type: "paragraph", children: [] });
      if (text) {
        const { nextBlock, image, ...marks } = run;
        append(blocks.at(-1).children, { ...marks, text });
      }
    });
  }
  return pack(blocks);
}, "fromStream");
var bounds = /* @__PURE__ */ __name((value, from, to) => {
  const length = documentText(value).length;
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < from || to > length) throw new RangeError("V\xFDb\u011Br je mimo dokument.");
}, "bounds");
function selectionMarks(value, from, to = from) {
  bounds(value, from, to);
  const start = from === to ? Math.max(0, from - 1) : from;
  const end = from === to ? Math.max(1, from) : to;
  const selected = [];
  let offset = 0;
  scan: for (const block of value.blocks) {
    if (offset >= end) break;
    if (block.type === "image") {
      offset += 2;
      continue;
    }
    for (const row of block.type === "list" ? block.items : [block]) {
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
  for (const mark of booleanMarks) if (selected.every((run) => run[mark])) marks[mark] = true;
  for (const mark of ["color", "link"]) {
    const setting = selected[0][mark];
    if (setting && selected.every((run) => run[mark] === setting)) marks[mark] = setting;
  }
  return marks;
}
__name(selectionMarks, "selectionMarks");
function replaceText(value, from, to, text, marks = {}) {
  bounds(value, from, to);
  const runs = stream(value);
  const block = rowAt(value, from).row;
  return fromStream([...slice(runs, 0, from), { ...marks, ...block.type === "list-item" ? { nextBlock: meta(block) } : {}, text: String(text).replace(/\r\n?/g, "\n") }, ...slice(runs, to, Infinity)], textRows(value)[0]);
}
__name(replaceText, "replaceText");
function formatText(value, from, to, mark, setting) {
  bounds(value, from, to);
  if (!textMarks.includes(mark)) throw new TypeError("Nezn\xE1m\xE9 form\xE1tov\xE1n\xED.");
  if (mark === "color" && setting !== null && !colorNames.includes(setting)) throw new TypeError("Invalid text color.");
  if (mark === "link" && setting !== null && !safeHref(setting)) throw new TypeError("Neplatn\xFD odkaz.");
  if (booleanMarks.includes(mark) && typeof setting !== "boolean") throw new TypeError("Form\xE1tov\xE1n\xED mus\xED b\xFDt boolean.");
  const runs = stream(value);
  const selected = slice(runs, from, to).map((run) => {
    const next = { ...run };
    if (setting === false || setting === null) delete next[mark];
    else next[mark] = mark === "link" ? safeHref(setting) : setting;
    return next;
  });
  return fromStream([...slice(runs, 0, from), ...selected, ...slice(runs, to, Infinity)], textRows(value)[0]);
}
__name(formatText, "formatText");
function blockAt(value, offset) {
  let start = 0;
  for (let index = 0; index < value.blocks.length; index++) {
    const size = blockText(value.blocks[index]).length;
    if (offset <= start + size || index === value.blocks.length - 1) return { index, start, size };
    start += size + 1;
  }
}
__name(blockAt, "blockAt");
function setHeading(value, from, to, level) {
  bounds(value, from, to);
  if (![0, 2, 3, 4].includes(level)) throw new TypeError("Nadpis mus\xED m\xEDt \xFArove\u0148 2, 3 nebo 4; 0 zna\u010D\xED odstavec.");
  const first = blockAt(value, from).index;
  const last = blockAt(value, Math.max(from, to - 1)).index;
  return pack(textRows(normalizeDocument(value)).map((row) => row.blockIndex >= first && row.blockIndex <= last && row.type !== "image" ? { type: level ? "heading" : "paragraph", ...level ? { level } : {}, children: row.children } : row));
}
__name(setHeading, "setHeading");
function setList(value, from, to, style) {
  bounds(value, from, to);
  if (style !== null && !["bullet", "ordered"].includes(style)) throw new TypeError("Invalid list style.");
  const first = blockAt(value, from).index;
  const last = blockAt(value, Math.max(from, to - 1)).index;
  return pack(textRows(normalizeDocument(value)).map((row) => row.blockIndex >= first && row.blockIndex <= last && row.type !== "image" ? { type: style ? "list-item" : "paragraph", ...style ? { style, group: "selection" } : {}, children: row.children } : row));
}
__name(setList, "setList");
function rowAt(value, offset) {
  let start = 0;
  const rows = textRows(value);
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const size = row.type === "image" ? 1 : row.children.reduce((sum, run) => sum + run.text.length, 0);
    if (offset <= start + size || index === rows.length - 1) return { row, index, start, size };
    start += size + 1;
  }
}
__name(rowAt, "rowAt");
function exitListItem(value, offset) {
  const at = rowAt(value, offset);
  if (at.row.type !== "list-item") return normalizeDocument(value);
  return pack(textRows(value).map((row, index) => index === at.index ? { type: "paragraph", children: row.children } : row));
}
__name(exitListItem, "exitListItem");

export {
  emptyDocument,
  normalizeDocument,
  safeImageSource,
  textRows,
  blockText,
  documentText,
  plainText,
  selectionMarks,
  replaceText,
  formatText,
  blockAt,
  setHeading,
  setList,
  rowAt,
  exitListItem
};
