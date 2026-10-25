import {
  normalizeMedia
} from "./chunk-I6POBVM6.js";
import {
  clipboardDocument,
  clipboardHTML,
  clipboardType
} from "./chunk-JQUWWSRB.js";
import {
  blockAt,
  blockText,
  deleteContent,
  documentText,
  emptyDocument,
  exitListItem,
  formatText,
  normalizeDocument,
  plainText,
  replaceDocument,
  replaceText,
  rowAt,
  selectionDocument,
  selectionMarks,
  setHeading,
  setList,
  textRows
} from "./chunk-KL7ILSU2.js";
import {
  safeHref
} from "./chunk-3SIP5CGE.js";
import {
  ensureStyles
} from "./chunk-MDDIKQ53.js";
import {
  createDragDrop
} from "./chunk-OQOSD4HB.js";
import {
  editorI18n
} from "./chunk-SDVY4RQI.js";
import {
  componentOptions,
  getPureConfig
} from "./chunk-VKBN75Z7.js";
import {
  colorNames
} from "./chunk-I2KQSOTD.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/editor-stats.js
var segmenters = /* @__PURE__ */ new Map();
function editorStats(value, locale = "en") {
  const parts = [];
  let images = 0;
  for (const block of value.blocks) {
    if (block.type === "image") images++;
    else if (block.type === "list") for (const item of block.items) parts.push(item.children.map((run) => run.text).join(""));
    else parts.push(block.children.map((run) => run.text).join(""));
  }
  const text = parts.join("\n");
  let words = 0;
  if (typeof Intl.Segmenter === "function") {
    let segmenter = segmenters.get(locale);
    if (!segmenter) {
      try {
        segmenter = new Intl.Segmenter(locale, { granularity: "word" });
      } catch {
        segmenter = new Intl.Segmenter("en", { granularity: "word" });
      }
      if (segmenters.size >= 8) segmenters.delete(segmenters.keys().next().value);
      segmenters.set(locale, segmenter);
    }
    for (const part of segmenter.segment(text)) if (part.isWordLike) words++;
  } else words = (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || []).length;
  return { blocks: value.blocks.length, words, images };
}
__name(editorStats, "editorStats");

// src/js/editor.js
var editorId = 0;
var sameRuns = /* @__PURE__ */ __name((left, right) => left === right || left.length === right.length && left.every((run, index) => {
  const other = right[index];
  return run.text === other.text && run.bold === other.bold && run.italic === other.italic && run.underline === other.underline && run.strike === other.strike && run.link === other.link && run.color === other.color;
}), "sameRuns");
var sameImage = /* @__PURE__ */ __name((left, right) => left.src === right.src && left.mediaId === right.mediaId && left.alt === right.alt && left.caption === right.caption && left.width === right.width && left.align === right.align, "sameImage");
function createEditor(source, options = {}) {
  let {
    label,
    iconsUrl = getPureConfig().iconsUrl,
    features = {},
    colors = null,
    uploadImage,
    prepareFile = getPureConfig().upload.prepareFile,
    mediaLibrary,
    locale,
    messages,
    styles = getPureConfig().styles.auto,
    pasteMode = "formatted"
  } = componentOptions("editor", options);
  if (!["formatted", "plain"].includes(pasteMode)) throw new TypeError("pasteMode must be formatted or plain.");
  const imageMaxSize = getPureConfig().upload.maxSize === Infinity ? 10 * 1024 * 1024 : getPureConfig().upload.maxSize;
  if (prepareFile !== null && typeof prepareFile !== "function") throw new TypeError("prepareFile must be a function or null.");
  const { t, locale: language } = editorI18n(source.ownerDocument, { locale, messages });
  label ??= source.labels?.[0]?.textContent || t("editor");
  if (source.tagName !== "TEXTAREA" || source.required || source.disabled || source.readOnly) throw new TypeError("Editor vy\u017Eaduje editovatelnou textarea bez required.");
  const parse = /* @__PURE__ */ __name((text) => text.trim() ? normalizeDocument(JSON.parse(text)) : emptyDocument(), "parse");
  let value = parse(source.value);
  const enabled = { headings: false, images: false, fullscreen: true, lists: true, ...features };
  const palette = colors ?? {};
  if (!palette || typeof palette !== "object" || Array.isArray(palette) || Object.entries(palette).some(([key, label2]) => !colorNames.includes(key) || typeof label2 !== "string" || !label2.trim()) || enabled.colors && !Object.keys(palette).length) throw new TypeError("Provide named editor colors and labels.");
  const doc = source.ownerDocument;
  const win = doc.defaultView;
  const node = /* @__PURE__ */ __name((tag, className) => {
    const element = doc.createElement(tag);
    if (className) element.className = className;
    return element;
  }, "node");
  const shell = node("div", "editor");
  const toolbar = node("div", "editor-toolbar");
  toolbar.setAttribute("role", "group");
  toolbar.setAttribute("aria-label", t("formatting"));
  const content = node("div", "editor-content");
  content.contentEditable = "true";
  content.setAttribute("role", "textbox");
  content.setAttribute("aria-multiline", "true");
  content.setAttribute("aria-label", label);
  if (source.getAttribute("aria-describedby")) content.setAttribute("aria-describedby", source.getAttribute("aria-describedby"));
  const hint = node("span", "sr-only");
  hint.setAttribute("role", "status");
  const footer = node("div", "editor-footer");
  footer.setAttribute("role", "group");
  footer.setAttribute("aria-label", t("statistics"));
  let statistics;
  const updateStats = /* @__PURE__ */ __name(() => {
    const text = documentText(value);
    const blocks = value.blocks.length;
    const images = value.blocks.reduce((count, block) => count + Number(block.type === "image"), 0);
    if (statistics && statistics.text === text && statistics.blocks === blocks && statistics.images === images) return;
    const words = statistics?.text === text ? statistics.words : editorStats(value, language).words;
    const stats = { text, blocks, images, words };
    statistics = stats;
    footer.replaceChildren();
    for (const key of ["blocks", "words", "images"]) {
      const count = node("span");
      count.dataset.editorCount = key;
      count.textContent = t(key, { count: stats[key] });
      footer.append(count);
    }
  }, "updateStats");
  const instance = ++editorId;
  let linkDialog;
  let imageDialog;
  let importDialog;
  let importTask;
  let importSnapshot;
  let importSelection;
  let fullscreenModal;
  let fullscreenHost;
  let headingSource;
  let headingControl;
  let imageIndex = null;
  let selected = { from: 0, to: 0 };
  let pending = {};
  let destroyed = false;
  let composing = false;
  let restoring = false;
  let history = [];
  let position = -1;
  let resetTimer;
  let dragDrop;
  let library;
  let pickedMedia = null;
  let openSequence = 0;
  const dialogTasks = /* @__PURE__ */ new Map();
  let selectTask;
  let resizeTask;
  let resizeFactory;
  let fullscreenTask;
  let activeBlockElement;
  const buttons = /* @__PURE__ */ new Map();
  const listeners = [];
  let colorPicker;
  let colorSummary;
  const imageResizers = /* @__PURE__ */ new Map();
  const clearResizers = /* @__PURE__ */ __name(() => {
    imageResizers.forEach((resizer) => resizer.destroy());
    imageResizers.clear();
  }, "clearResizers");
  const updateImage = /* @__PURE__ */ __name((index, changes, focusSelector) => {
    const next = normalizeDocument(value);
    Object.assign(next.blocks[index], changes);
    imageIndex = null;
    commit(next);
    win.getSelection()?.removeAllRanges();
    const figure = content.querySelector(`[data-editor-image="${index}"]`);
    (figure?.querySelector(focusSelector) || figure?.querySelector("[data-resize-handle]"))?.focus();
  }, "updateImage");
  const listen = /* @__PURE__ */ __name((target, type, fn) => {
    target.addEventListener(type, fn);
    listeners.push(() => target.removeEventListener(type, fn));
  }, "listen");
  const active = /* @__PURE__ */ __name(() => selectionMarks(value, selected.from, selected.to), "active");
  const updateToolbar = /* @__PURE__ */ __name(() => {
    const activeBlock = blockAt(value, selected.from).index;
    const activeElement = content.children[activeBlock];
    if (activeBlockElement !== activeElement) {
      activeBlockElement?.removeAttribute("data-active");
      activeElement?.setAttribute("data-active", "");
      activeBlockElement = activeElement;
    }
    const marks = selected.from === selected.to ? pending : active();
    if (colorSummary) {
      colorSummary.style.color = marks.color ? `var(--p-${marks.color}, var(--p-text))` : "";
      for (const button of colorPicker.querySelectorAll("[data-editor-color]")) button.setAttribute("aria-pressed", String((marks.color || "") === button.dataset.editorColor));
    }
    for (const name of ["bold", "italic", "underline", "strike", "link"]) buttons.get(name)?.setAttribute("aria-pressed", String(Boolean(marks[name])));
    const first = activeBlock;
    const last = blockAt(value, Math.max(selected.from, selected.to - 1)).index;
    const selectedBlocks = value.blocks.slice(first, last + 1).filter((block) => block.type !== "image");
    for (const style of ["bullet", "ordered"]) buttons.get(`${style}List`)?.setAttribute("aria-pressed", String(Boolean(selectedBlocks.length) && selectedBlocks.every((block) => block.type === "list" && block.style === style)));
    let offset = 0;
    let anyLink = false;
    for (const block of selected.from === selected.to ? [] : textRows(value)) {
      if (offset >= selected.to || anyLink) break;
      for (const run of block.children || []) {
        if (run.link && offset < selected.to && offset + run.text.length > selected.from) anyLink = true;
        offset += run.text.length;
      }
      if (block.type === "image") offset++;
      offset++;
    }
    if (buttons.has("unlink")) buttons.get("unlink").disabled = !marks.link && !anyLink;
    if (buttons.has("undo")) buttons.get("undo").disabled = position <= 0;
    if (buttons.has("redo")) buttons.get("redo").disabled = position >= history.length - 1;
    buttons.get("fullscreen")?.setAttribute("aria-pressed", String(Boolean(fullscreenHost?.open)));
    if (buttons.has("fullscreen")) {
      const button = buttons.get("fullscreen");
      const title = fullscreenHost?.open ? t("exitFullscreen") : t("fullscreen");
      button.title = title;
      button.setAttribute("aria-label", title);
      button.querySelector("use").setAttribute("href", `${iconsUrl}#${fullscreenHost?.open ? "shrink" : "expand"}`);
    }
    if (headingSource) {
      const block = value.blocks[blockAt(value, selected.from).index];
      headingSource.value = block.type === "heading" ? String(block.level) : "0";
      headingControl?.refresh();
    }
  }, "updateToolbar");
  const sync = /* @__PURE__ */ __name(() => {
    updateStats();
    source.value = JSON.stringify(value);
    source.dispatchEvent(new win.Event("input", { bubbles: true }));
  }, "sync");
  const blockHeader = /* @__PURE__ */ __name((index, title, width) => {
    const header = node("div", "editor-block-header");
    header.contentEditable = "false";
    header.dataset.editorUi = "";
    const handle = node("button", "editor-block-handle");
    handle.type = "button";
    handle.dataset.dragHandle = "";
    handle.textContent = title;
    handle.setAttribute("aria-label", t("moveBlock", { index: index + 1, title }));
    handle.title = t("dragHelp");
    header.append(handle);
    if (width) {
      const size = node("span", "editor-image-size");
      size.textContent = `${width} %`;
      handle.append(size);
    }
    const remove = node("button", "editor-block-delete");
    remove.type = "button";
    remove.dataset.blockDelete = index;
    remove.textContent = t("remove");
    remove.setAttribute("aria-label", t("removeBlock", { index: index + 1 }));
    header.append(remove);
    return header;
  }, "blockHeader");
  const appendText = /* @__PURE__ */ __name((paragraph, children) => {
    paragraph.dataset.editorText = "";
    for (const run of children) {
      let child = doc.createTextNode(run.text);
      if (run.color) {
        const span = node("span");
        span.dataset.textColor = run.color;
        span.style.color = `var(--p-${run.color}, var(--p-text))`;
        span.append(child);
        child = span;
      }
      for (const [mark, tag] of [["italic", "em"], ["bold", "strong"], ["underline", "u"], ["strike", "s"], ["link", "a"]]) {
        if (!run[mark]) continue;
        const wrapper = node(tag);
        if (mark === "link") wrapper.setAttribute("href", run.link);
        wrapper.append(child);
        child = wrapper;
      }
      paragraph.append(child);
    }
    if (!paragraph.childNodes.length) paragraph.append(node("br"));
  }, "appendText");
  const render = /* @__PURE__ */ __name((previous) => {
    dragDrop?.cancel();
    if (previous && previous.blocks.length === value.blocks.length && value.blocks.every((block, index) => {
      const old = previous.blocks[index];
      return block.type === old.type && block.level === old.level && block.style === old.style && (block.type === "image" ? sameImage(block, old) : block.type !== "list" || block.items.length === old.items.length);
    })) {
      value.blocks.forEach((block, index) => {
        if (block.type === "image") return;
        const old = previous.blocks[index];
        const rows = block.type === "list" ? block.items : [block];
        const oldRows = block.type === "list" ? old.items : [old];
        let elements;
        rows.forEach((row, item) => {
          if (sameRuns(row.children, oldRows[item].children)) return;
          elements ??= content.children[index].querySelectorAll("[data-editor-text]");
          elements[item].replaceChildren();
          appendText(elements[item], row.children);
        });
      });
      return;
    }
    clearResizers();
    const fragment = doc.createDocumentFragment();
    value.blocks.forEach((block, index) => {
      if (block.type === "image") {
        const figure = node("figure", "editor-block editor-image");
        figure.contentEditable = "false";
        figure.dataset.editorImage = String(index);
        figure.dataset.editorBlock = "image";
        figure.dataset.dragItem = "";
        figure.dataset.blockIndex = index;
        figure.setAttribute("role", "group");
        figure.setAttribute("aria-label", block.alt || t("image"));
        figure.tabIndex = 0;
        if (block.mediaId !== null) figure.dataset.mediaId = String(block.mediaId);
        figure.append(blockHeader(index, t("image"), block.width));
        const canvas = node("div", "editor-image-canvas");
        figure.append(canvas);
        const media = node("div", "editor-image-media");
        media.dataset.align = block.align;
        media.style.width = `${block.width}%`;
        canvas.append(media);
        const image = node("img");
        image.src = block.src;
        image.alt = block.alt;
        image.loading = "lazy";
        media.append(image);
        if (block.caption) {
          const caption = node("figcaption", "field-help");
          caption.textContent = block.caption;
          figure.append(caption);
        }
        if (enabled.images) {
          const actions = node("div", "editor-image-actions");
          actions.setAttribute("role", "group");
          actions.setAttribute("aria-label", t("imageActions"));
          let group;
          for (const [action, glyph, label2] of [
            ["smaller", "minus", t("smaller")],
            ["larger", "plus", t("larger")],
            ["left", "align-left", t("leftAction")],
            ["center", "align-center", t("centerAction")],
            ["right", "align-right", t("rightAction")],
            ["edit", "settings", t("editImage")]
          ]) {
            if (["smaller", "left", "edit"].includes(action)) {
              group = node("div", "editor-image-action-group");
              group.setAttribute("role", "group");
              group.setAttribute("aria-label", action === "smaller" ? t("size") : action === "left" ? t("alignment") : t("imageManagement"));
              actions.append(group);
            }
            const button = node("button", "icon-button");
            button.type = "button";
            button.dataset.imageAction = action;
            button.setAttribute("aria-label", label2);
            button.title = label2;
            if (["left", "center", "right"].includes(action)) button.setAttribute("aria-pressed", String(block.align === action));
            if (action === "smaller") button.disabled = block.width <= 25;
            if (action === "larger") button.disabled = block.width >= 100;
            const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("class", "icon");
            svg.setAttribute("aria-hidden", "true");
            const use = doc.createElementNS("http://www.w3.org/2000/svg", "use");
            use.setAttribute("href", `${iconsUrl}#${glyph}`);
            svg.append(use);
            button.append(svg);
            group.append(button);
          }
          figure.append(actions);
        }
        fragment.append(figure);
        return;
      }
      const wrapper = node("div", "editor-block");
      wrapper.dataset.editorBlock = block.type;
      wrapper.dataset.dragItem = "";
      wrapper.dataset.blockIndex = index;
      wrapper.append(blockHeader(index, block.type === "heading" ? t("heading", { level: block.level }) : block.type === "list" ? t(block.style === "ordered" ? "orderedList" : "bulletList") : t("paragraph")));
      if (block.type === "list") {
        const list = node(block.style === "ordered" ? "ol" : "ul", "editor-list");
        list.dataset.listStyle = block.style;
        for (const item of block.items) {
          const li = node("li");
          appendText(li, item.children);
          list.append(li);
        }
        wrapper.append(list);
      } else {
        const paragraph = node(block.type === "heading" ? `h${block.level}` : "p", "editor-text-block");
        appendText(paragraph, block.children);
        wrapper.append(paragraph);
      }
      fragment.append(wrapper);
    });
    content.replaceChildren(fragment);
    attachResizers()?.catch(loadFailed);
  }, "render");
  const attachResizers = /* @__PURE__ */ __name(() => {
    if (destroyed || !enabled.images || !content.querySelector("[data-editor-image]")) return;
    if (!resizeFactory) {
      resizeTask ??= Promise.all([import("./resize-2SOG3MT4.js"), styles ? ensureStyles("resize", { document: doc }) : void 0]).then(([module]) => {
        if (!destroyed) {
          resizeFactory = module.createResize;
          attachResizers();
        }
      }).catch((error) => {
        resizeTask = null;
        throw error;
      });
      return resizeTask;
    }
    for (const figure of content.querySelectorAll("[data-editor-image]")) {
      const index = Number(figure.dataset.editorImage);
      if (imageResizers.has(index)) continue;
      imageResizers.set(index, resizeFactory(figure.querySelector(".editor-image-media"), {
        container: figure.querySelector(".editor-image-canvas"),
        width: value.blocks[index].width,
        min: 25,
        step: 25,
        iconsUrl,
        label: t("imageWidth"),
        help: t("resizeHelp"),
        onChange: /* @__PURE__ */ __name((width) => {
          figure.querySelector(".editor-image-size").textContent = `${width} %`;
        }, "onChange"),
        onCommit: /* @__PURE__ */ __name((width) => updateImage(index, { width }, "[data-resize-handle]"), "onCommit")
      }));
    }
  }, "attachResizers");
  const length = /* @__PURE__ */ __name((element) => {
    if (element.nodeType === 1 && element.hasAttribute("data-editor-ui")) return 0;
    if (element.nodeType === 1 && element.hasAttribute("data-editor-image")) return 1;
    if (element.nodeType === 3) return element.length;
    if (["UL", "OL"].includes(element.nodeName)) return [...element.childNodes].reduce((sum, child) => sum + length(child), 0) + Math.max(0, element.childNodes.length - 1);
    if (element.nodeName === "BR") return element.nextSibling ? 1 : 0;
    return [...element.childNodes].reduce((sum, child) => sum + length(child), 0);
  }, "length");
  const groups = /* @__PURE__ */ __name(() => {
    const result = [];
    let inline = [];
    const flush = /* @__PURE__ */ __name(() => {
      if (inline.length) {
        result.push(inline);
        inline = [];
      }
    }, "flush");
    for (const child of content.childNodes) {
      if (child.dataset?.editorBlock === "list") {
        flush();
        for (const item of child.querySelector(".editor-list").children) result.push([item]);
        continue;
      }
      if (["UL", "OL"].includes(child.nodeName)) {
        flush();
        for (const item of child.children) result.push([item]);
        continue;
      }
      if (["P", "DIV", "H2", "H3", "H4", "FIGURE"].includes(child.nodeName)) {
        flush();
        result.push([child]);
      } else inline.push(child);
    }
    flush();
    return result;
  }, "groups");
  const offsetIn = /* @__PURE__ */ __name((element, target, offset) => {
    if (element.nodeType === 1 && element.hasAttribute("data-editor-ui")) return 0;
    if (element.nodeType === 1 && element.hasAttribute("data-editor-image")) return 0;
    if (element === target) return element.nodeType === 3 ? offset : [...element.childNodes].slice(0, offset).reduce((sum, child) => sum + length(child), 0) + (["UL", "OL"].includes(element.nodeName) ? Math.min(offset, Math.max(0, element.childNodes.length - 1)) : 0);
    let count = 0;
    for (const child of element.childNodes) {
      if (child === target || child.contains?.(target)) return count + offsetIn(child, target, offset);
      count += length(child) + (["UL", "OL"].includes(element.nodeName) && child.nextSibling ? 1 : 0);
    }
    return count;
  }, "offsetIn");
  const domOffset = /* @__PURE__ */ __name((target, offset) => {
    if (["UL", "OL"].includes(target.nodeName) && content.contains(target) && target.firstElementChild) return domOffset(target.firstElementChild, 0) + offsetIn(target, target, offset);
    if (target.dataset?.editorBlock === "list") return value.blocks.slice(0, Number(target.dataset.blockIndex)).reduce((sum, block) => sum + blockText(block).length + 1, 0) + offsetIn(target, target, offset);
    if (target === content) {
      const before = [...content.childNodes].slice(0, offset);
      const total = Math.max(0, groups().reduce((sum, group) => sum + group.reduce((n, child) => n + length(child), 0) + 1, 0) - 1);
      return Math.min(total, before.reduce((sum, child) => sum + length(child) + (["P", "DIV", "H2", "H3", "H4", "FIGURE", "UL", "OL"].includes(child.nodeName) ? 1 : 0), 0));
    }
    let count = 0;
    for (const group of groups()) {
      for (const child of group) {
        if (child === target || child.contains?.(target)) return count + offsetIn(child, target, offset);
        count += length(child);
      }
      count++;
    }
    return Math.max(0, count - 1);
  }, "domOffset");
  const readSelection = /* @__PURE__ */ __name(() => {
    const selection = win.getSelection();
    if (!selection.rangeCount) return null;
    const range = selection.getRangeAt(0);
    if (!content.contains(range.startContainer) || !content.contains(range.endContainer)) return null;
    return { from: domOffset(range.startContainer, range.startOffset), to: domOffset(range.endContainer, range.endOffset) };
  }, "readSelection");
  const point = /* @__PURE__ */ __name((index) => {
    for (const [paragraph] of groups()) {
      const size = length(paragraph);
      if (index <= size) {
        if (paragraph.hasAttribute("data-editor-image")) return [content, [...content.childNodes].indexOf(paragraph) + (index > 0 ? 1 : 0)];
        const walker = doc.createTreeWalker(paragraph, 4, { acceptNode: /* @__PURE__ */ __name((text) => text.parentElement.closest("[data-editor-ui]") ? 2 : 1, "acceptNode") });
        while (walker.nextNode()) {
          const text = walker.currentNode;
          if (index <= text.length) return [text, index];
          index -= text.length;
        }
        return [paragraph.querySelector("[data-editor-text]") || paragraph, 0];
      }
      index -= size + 1;
    }
    return [content, content.childNodes.length];
  }, "point");
  const restore = /* @__PURE__ */ __name(() => {
    restoring = true;
    content.focus();
    const range = doc.createRange();
    range.setStart(...point(selected.from));
    range.setEnd(...point(selected.to));
    const selection = win.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    restoring = false;
  }, "restore");
  const record = /* @__PURE__ */ __name(() => {
    const serialized = JSON.stringify(value);
    if (history[position]?.json !== serialized) {
      history = history.slice(0, position + 1);
      history.push({ json: serialized, selected: { ...selected } });
      if (history.length > 100) history.shift();
      position = history.length - 1;
      sync();
    }
    updateToolbar();
  }, "record");
  const commitModel = /* @__PURE__ */ __name((next, nextSelection = selected) => {
    const previous = value;
    value = next;
    selected = nextSelection;
    render(previous);
    restore();
    record();
  }, "commitModel");
  const commit = /* @__PURE__ */ __name((next, nextSelection) => commitModel(normalizeDocument(next), nextSelection), "commit");
  const insert = /* @__PURE__ */ __name((text) => {
    const from = selected.from;
    const normalized = text.replace(/\r\n?/g, "\n");
    commitModel(replaceText(value, from, selected.to, normalized, pending), { from: from + normalized.length, to: from + normalized.length });
  }, "insert");
  const erase = /* @__PURE__ */ __name((direction) => {
    const next = deleteContent(value, selected.from, selected.to, direction);
    if (next.value === value) return;
    pending = selectionMarks(next.value, next.offset);
    imageIndex = null;
    commitModel(next.value, { from: next.offset, to: next.offset });
  }, "erase");
  const filterFragment = /* @__PURE__ */ __name((fragment) => {
    const blocks = fragment.blocks.flatMap((block) => {
      if (block.type === "heading" && !enabled.headings) return { type: "paragraph", children: block.children };
      if (block.type === "list" && !enabled.lists) return block.items.map((item) => ({ type: "paragraph", children: item.children }));
      if (block.type === "image" && !enabled.images) return block.alt ? [{ type: "paragraph", children: [{ text: block.alt }] }] : [];
      return block;
    });
    return blocks.length ? { version: 1, blocks } : null;
  }, "filterFragment");
  const insertFragment = /* @__PURE__ */ __name((fragment) => {
    const next = replaceDocument(value, selected.from, selected.to, fragment);
    pending = selectionMarks(next.value, next.offset);
    commitModel(next.value, { from: next.offset, to: next.offset });
  }, "insertFragment");
  const travel = /* @__PURE__ */ __name((delta) => {
    if (position + delta < 0 || position + delta >= history.length) return false;
    const previous = value;
    position += delta;
    const entry = history[position];
    value = JSON.parse(entry.json);
    selected = { ...entry.selected };
    imageIndex = null;
    pending = active();
    render(previous);
    restore();
    sync();
    updateToolbar();
    return true;
  }, "travel");
  const remember = /* @__PURE__ */ __name(() => {
    if (restoring || composing) return;
    const next = readSelection();
    if (!next) return;
    if (next.from === selected.from && next.to === selected.to) return;
    selected = next;
    pending = active();
    updateToolbar();
  }, "remember");
  const currentLinkRange = /* @__PURE__ */ __name(() => {
    let offset = 0;
    const ranges = [];
    for (const block of textRows(value)) {
      let previous;
      for (const run of block.children || []) {
        if (run.link) {
          if (previous?.link === run.link && previous.to === offset) previous.to += run.text.length;
          else {
            previous = { from: offset, to: offset + run.text.length, link: run.link };
            ranges.push(previous);
          }
        } else previous = null;
        offset += run.text.length;
      }
      if (block.type === "image") offset++;
      offset++;
    }
    return ranges.find((range) => range.from <= selected.from && range.to >= selected.to);
  }, "currentLinkRange");
  const command = /* @__PURE__ */ __name((name, setting) => {
    if (destroyed) throw new Error("Editor byl odpojen.");
    if (name === "undo") return travel(-1);
    if (name === "redo") return travel(1);
    if (name === "moveBlock" || name === "removeBlock") {
      const from = name === "moveBlock" ? setting?.from : setting;
      const to = setting?.to;
      if (!Number.isInteger(from) || from < 0 || from >= value.blocks.length || name === "moveBlock" && (!Number.isInteger(to) || to < 0 || to >= value.blocks.length)) throw new RangeError("Neplatn\xE1 pozice bloku.");
      if (name === "moveBlock" && from === to) return false;
      const next2 = normalizeDocument(value);
      const [block] = next2.blocks.splice(from, 1);
      if (name === "moveBlock") next2.blocks.splice(to, 0, block);
      if (!next2.blocks.length) next2.blocks = emptyDocument().blocks;
      const at = name === "moveBlock" ? to : Math.min(from, next2.blocks.length - 1);
      const offset = next2.blocks.slice(0, at).reduce((sum, item) => sum + blockText(item).length + 1, 0);
      imageIndex = null;
      pending = {};
      commit(next2, { from: offset, to: offset });
      win.getSelection()?.removeAllRanges();
      content.querySelectorAll("[data-editor-block]")[at]?.querySelector("[data-drag-handle]")?.focus();
      return true;
    }
    if (name === "heading") {
      if (!enabled.headings) throw new Error("Nadpisy nejsou zapnut\xE9.");
      commitModel(setHeading(value, selected.from, selected.to, Number(setting)));
      return true;
    }
    if (["list", "bulletList", "orderedList"].includes(name)) {
      if (!enabled.lists) return false;
      let style = name === "list" ? setting : name === "bulletList" ? "bullet" : "ordered";
      if (name !== "list" && buttons.get(name)?.getAttribute("aria-pressed") === "true") style = null;
      commitModel(setList(value, selected.from, selected.to, style));
      return true;
    }
    if (name === "fullscreen") {
      if (!enabled.fullscreen) return false;
      return toggleFullscreen();
    }
    if (name === "image") {
      if (!enabled.images) throw new Error("Obr\xE1zky nejsou zapnut\xE9.");
      const block = normalizeDocument({ version: 1, blocks: [{ ...setting, type: "image" }] }).blocks[0];
      const next2 = normalizeDocument(value);
      const at = imageIndex === null ? blockAt(value, selected.to).index + 1 : imageIndex;
      if (imageIndex === null) next2.blocks.splice(at, 0, block);
      else next2.blocks[at] = block;
      if (!next2.blocks[at + 1] || next2.blocks[at + 1].type === "image") next2.blocks.splice(at + 1, 0, { type: "paragraph", children: [] });
      const after = next2.blocks.slice(0, at + 1).reduce((sum, item) => sum + blockText(item).length + 1, 0);
      imageIndex = null;
      commit(next2, { from: after, to: after });
      return true;
    }
    if (name === "removeImage") {
      if (!enabled.images || imageIndex === null) return false;
      const next2 = normalizeDocument(value);
      next2.blocks.splice(imageIndex, 1);
      if (!next2.blocks.length) next2.blocks.push({ type: "paragraph", children: [] });
      imageIndex = null;
      commit(next2, { from: 0, to: 0 });
      return true;
    }
    if (name === "color" && (!enabled.colors || setting !== null && !Object.hasOwn(palette, setting))) return false;
    if (!["bold", "italic", "underline", "strike", "link", "unlink", "color"].includes(name)) throw new TypeError(`Nezn\xE1m\xFD p\u0159\xEDkaz: ${name}`);
    const mark = name === "unlink" ? "link" : name;
    let next;
    if (mark === "color") next = setting;
    else if (mark === "link") {
      next = name === "unlink" ? null : safeHref(setting);
      if (name !== "unlink" && !next) {
        hint.textContent = t("invalidLink");
        return false;
      }
    } else next = !(selected.from === selected.to ? pending[mark] : active()[mark]);
    if (selected.from === selected.to) {
      const linkRange = mark === "link" ? currentLinkRange() : null;
      if (linkRange) {
        if (next) pending.link = next;
        else delete pending.link;
        commitModel(formatText(value, linkRange.from, linkRange.to, "link", next));
      } else if (mark === "link" && next) {
        pending = { ...pending, link: next };
        insert(next);
        delete pending.link;
      } else {
        if (next) pending[mark] = next;
        else delete pending[mark];
        updateToolbar();
      }
    } else {
      pending = { ...active() };
      if (next) pending[mark] = next;
      else delete pending[mark];
      commitModel(formatText(value, selected.from, selected.to, mark, next));
    }
    hint.textContent = t("formatted");
    return true;
  }, "command");
  const createLinkDialog = /* @__PURE__ */ __name((createEditorDialog) => {
    linkDialog = createEditorDialog(doc, {
      t,
      title: t("linkTitle"),
      fields: { url: { label: t("linkAddress"), placeholder: t("linkPlaceholder") } },
      submit(fields) {
        if (!command("link", fields.url.value)) throw new Error(t("invalidLink"));
      }
    });
    linkDialog.dialog.dataset.editorDialog = "link";
    linkDialog.dialog.dataset.editorInstance = String(instance);
    listen(linkDialog.dialog, "close", () => {
      if (!destroyed) restore();
    });
  }, "createLinkDialog");
  let imageSnapshot;
  const createImageDialog = /* @__PURE__ */ __name((createEditorDialog, selectFactory, uploadFactory, validateFiles) => {
    imageDialog = createEditorDialog(doc, {
      t,
      selectFactory,
      uploadFactory: /* @__PURE__ */ __name((input, options2) => uploadFactory(input, { ...options2, maxSize: imageMaxSize, prepareFile }), "uploadFactory"),
      title: t("image"),
      fields: {
        file: { label: t("uploadImage"), type: "file", accept: "image/png,image/jpeg,image/webp,image/gif,image/avif" },
        alt: { label: t("alt") },
        caption: { label: t("caption") },
        width: { label: t("width"), options: [["25", "25 %"], ["50", "50 %"], ["75", "75 %"], ["100", "100 %"]] },
        align: { label: t("alignment"), options: [["left", t("left")], ["center", t("center")], ["right", t("right")]] }
      },
      async submit(fields, signal) {
        let src = pickedMedia?.src ?? (imageIndex === null ? "" : value.blocks[imageIndex]?.src);
        let mediaId = pickedMedia?.id ?? (imageIndex === null ? null : value.blocks[imageIndex]?.mediaId);
        const file = fields.file.files[0];
        if (file) {
          if (typeof uploadImage !== "function") throw new Error(t("uploadMissing"));
          const errors = validateFiles([file], { accept: fields.file.accept, maxFiles: 1, maxSize: imageMaxSize, translate: t });
          if (errors.length) throw new Error(errors.join(" "));
          const result = await uploadImage(file, { signal });
          if (typeof result === "string") {
            src = result;
            mediaId = null;
          } else {
            const media = normalizeMedia(result);
            src = media.src;
            mediaId = media.id;
          }
        }
        if (!src) throw new Error(t("chooseImage"));
        if (signal.aborted || !imageDialog.dialog.open) return false;
        if (JSON.stringify(value) !== imageSnapshot) throw new Error(t("changed"));
        library?.close();
        command("image", { src, mediaId: mediaId ?? null, alt: fields.alt.value, caption: fields.caption.value, width: Number(fields.width.value), align: fields.align.value });
      },
      remove() {
        library?.close();
        command("removeImage");
      }
    });
    imageDialog.dialog.dataset.editorDialog = "image";
    imageDialog.dialog.dataset.editorInstance = String(instance);
    const preview = node("img", "upload-preview");
    preview.alt = t("currentImage");
    preview.hidden = true;
    preview.dataset.currentImage = "";
    imageDialog.controls.file.after(preview);
    listen(imageDialog.controls.file, "change", () => {
      preview.hidden = Boolean(imageDialog.controls.file.files.length) || !preview.getAttribute("src");
    });
    const cancelLibrary = /* @__PURE__ */ __name(() => {
      openSequence++;
      library?.close();
    }, "cancelLibrary");
    listen(imageDialog.dialog, "cancel", cancelLibrary);
    listen(imageDialog.dialog, "click", (event) => {
      if (!imageDialog.dialog.open || event.target.closest("[data-modal-close]")) cancelLibrary();
    });
    listen(imageDialog.dialog, "close", () => {
      if (!imageDialog.dialog.open) {
        library?.close();
        if (!destroyed) restore();
      }
    });
    if (mediaLibrary) {
      const createLibrary = /* @__PURE__ */ __name((createMediaLibrary) => createMediaLibrary({
        ...mediaLibrary,
        document: doc,
        locale: language,
        messages,
        prepareFile: mediaLibrary.prepareFile === void 0 ? prepareFile : mediaLibrary.prepareFile,
        styles,
        onSelect(media) {
          if (!imageDialog.dialog.open || JSON.stringify(value) !== imageSnapshot) throw new Error(t("changed"));
          pickedMedia = media;
          imageDialog.controls.file.value = "";
          imageDialog.controls.file.dispatchEvent(new win.Event("change", { bubbles: true }));
          imageDialog.controls.alt.value = media.alt;
          preview.src = media.src;
          preview.hidden = false;
        }
      }), "createLibrary");
      const browse = node("button", "button button-outline");
      browse.type = "button";
      browse.textContent = t("library");
      browse.dataset.editorMediaLibrary = "";
      imageDialog.controls.file.closest(".field").after(browse);
      let libraryTask;
      listen(browse, "click", async () => {
        if (browse.disabled || imageDialog.dialog.querySelector("form").getAttribute("aria-busy") === "true") return;
        browse.disabled = true;
        browse.textContent = t("loading");
        const snapshot = imageSnapshot;
        const request = openSequence;
        try {
          libraryTask ??= import("./media-library-QBUPP3BD.js").catch((error) => {
            libraryTask = null;
            throw error;
          });
          const [{ createMediaLibrary }] = await Promise.all([libraryTask, styles ? ensureStyles("media-library", { document: doc }) : void 0]);
          if (destroyed || !imageDialog.dialog.open || imageSnapshot !== snapshot || request !== openSequence) return;
          library ??= createLibrary(createMediaLibrary);
          await library.open(browse);
        } catch (error) {
          if (request === openSequence && imageDialog.dialog.open) loadFailed(error);
        } finally {
          browse.disabled = false;
          browse.textContent = t("library");
        }
      });
    }
  }, "createImageDialog");
  const loadFailed = /* @__PURE__ */ __name((error) => {
    if (destroyed) return;
    hint.textContent = t("failure");
    source.dispatchEvent(new win.CustomEvent("pure:load-error", { bubbles: true, detail: error }));
  }, "loadFailed");
  const ensureDialog = /* @__PURE__ */ __name((kind) => {
    if (dialogTasks.has(kind)) return dialogTasks.get(kind);
    const task = (async () => {
      const [dialogModule, extras] = await Promise.all([
        import("./editor-dialog-BORLNE4B.js"),
        kind === "image" ? Promise.all([import("./select-W527ZQBK.js"), import("./upload-5GORHKMR.js")]) : void 0,
        styles ? ensureStyles(kind === "image" ? ["modal", "upload", "utilities"] : ["modal", "utilities"], { document: doc }) : void 0
      ]);
      if (destroyed) return null;
      if (kind === "image") createImageDialog(dialogModule.createEditorDialog, extras[0].createSelect, extras[1].createUpload, extras[1].validateFiles);
      else createLinkDialog(dialogModule.createEditorDialog);
      return kind === "image" ? imageDialog : linkDialog;
    })().catch((error) => {
      dialogTasks.delete(kind);
      throw error;
    });
    dialogTasks.set(kind, task);
    return task;
  }, "ensureDialog");
  const openImage = /* @__PURE__ */ __name(async (file) => {
    if (!enabled.images || destroyed) return false;
    const sequence = ++openSequence;
    const snapshot = JSON.stringify(value);
    const index = imageIndex;
    const selection = { ...selected };
    hint.textContent = t("loading");
    try {
      await ensureDialog("image");
    } finally {
      if (!destroyed && sequence === openSequence) hint.textContent = "";
    }
    if (destroyed || sequence !== openSequence || snapshot !== JSON.stringify(value)) return false;
    imageIndex = index;
    selected = selection;
    const block = imageIndex === null ? {} : value.blocks[imageIndex];
    pickedMedia = null;
    imageSnapshot = JSON.stringify(value);
    imageDialog.open({ alt: "", caption: "", width: 100, align: "center", ...block }, doc.activeElement, { removable: imageIndex !== null });
    const preview = imageDialog.dialog.querySelector("[data-current-image]");
    if (block.src) {
      preview.src = block.src;
      preview.hidden = false;
    } else {
      preview.removeAttribute("src");
      preview.hidden = true;
    }
    if (file) await imageDialog.setFiles([file]);
    return true;
  }, "openImage");
  const openImport = /* @__PURE__ */ __name(async (format = "markdown") => {
    if (!["markdown", "html"].includes(format)) throw new TypeError("Unknown import format.");
    if (enabled.import === false || destroyed) return false;
    remember();
    const sequence = ++openSequence, snapshot = value, selection = { ...selected };
    importTask ??= Promise.all([
      import("./editor-import-YOXRCUE4.js"),
      styles ? ensureStyles(["modal", "controls", "renderer", "utilities"], { document: doc }) : void 0
    ]).catch((error) => {
      importTask = null;
      throw error;
    });
    const [module] = await importTask;
    if (destroyed || sequence !== openSequence || snapshot !== value) return false;
    if (!importDialog) {
      importDialog = module.createImportDialog(doc, { t, filter: filterFragment, insert(fragment) {
        if (value !== importSnapshot) throw new Error(t("importChanged"));
        selected = { ...importSelection };
        insertFragment(fragment);
      } });
      listen(importDialog.dialog, "close", () => {
        if (!destroyed) restore();
      });
    }
    importSnapshot = snapshot;
    importSelection = selection;
    importDialog.open(format, buttons.get("import") || doc.activeElement);
    return true;
  }, "openImport");
  const openLink = /* @__PURE__ */ __name(async () => {
    if (destroyed) return false;
    const sequence = ++openSequence;
    const snapshot = JSON.stringify(value);
    const selection = { ...selected };
    hint.textContent = t("loading");
    try {
      await ensureDialog("link");
    } finally {
      if (!destroyed && sequence === openSequence) hint.textContent = "";
    }
    if (destroyed || sequence !== openSequence || snapshot !== JSON.stringify(value)) return false;
    selected = selection;
    linkDialog.open({ url: (selected.from === selected.to ? currentLinkRange()?.link : active().link) || "" }, buttons.get("link"));
    return true;
  }, "openLink");
  if (enabled.headings) {
    const headingSlot = node("div", "editor-style");
    headingSlot.setAttribute("aria-busy", "true");
    const placeholder = node("span", "input editor-style-placeholder");
    placeholder.textContent = t("paragraph");
    placeholder.setAttribute("aria-hidden", "true");
    headingSource = node("select", "input");
    headingSource.setAttribute("aria-label", t("textStyle"));
    for (const level of [0, 2, 3, 4]) {
      const option = node("option");
      option.value = String(level);
      option.textContent = level ? t("heading", { level }) : t("paragraph");
      headingSource.append(option);
    }
    headingSource.hidden = true;
    headingSlot.append(placeholder, headingSource);
    toolbar.append(headingSlot);
    selectTask = Promise.all([import("./select-W527ZQBK.js"), styles ? ensureStyles("controls", { document: doc }) : void 0]).then(([module]) => {
      if (!destroyed) {
        headingControl = module.createSelect(headingSource);
        placeholder.remove();
        headingSlot.removeAttribute("aria-busy");
        updateToolbar();
      }
    });
    selectTask.catch(loadFailed);
    listen(headingSource, "change", () => command("heading", headingSource.value));
  }
  const toggleFullscreen = /* @__PURE__ */ __name(async () => {
    const sequence = ++openSequence;
    fullscreenTask ??= import("./modal-CMJRFYG7.js").catch((error) => {
      fullscreenTask = null;
      throw error;
    });
    const { createModal } = await fullscreenTask;
    await styleReady;
    if (destroyed || sequence !== openSequence) return false;
    if (!fullscreenHost) {
      fullscreenHost = node("dialog", "editor-fullscreen");
      fullscreenHost.setAttribute("aria-label", label);
      doc.body.append(fullscreenHost);
      fullscreenModal = createModal(fullscreenHost, { closeOnBackdrop: false });
      listen(fullscreenHost, "close", () => {
        source.after(shell);
        if (!destroyed) {
          restore();
          updateToolbar();
        }
      });
    }
    if (fullscreenHost.open) {
      fullscreenModal.close();
      source.after(shell);
    } else {
      fullscreenHost.append(shell);
      fullscreenModal.open(buttons.get("fullscreen"));
    }
    restore();
    updateToolbar();
    return true;
  }, "toggleFullscreen");
  if (enabled.colors) {
    colorPicker = node("details", "editor-colors");
    colorSummary = node("summary", "editor-tool");
    colorSummary.textContent = "A";
    colorSummary.title = t("textColor");
    colorSummary.setAttribute("aria-label", t("textColor"));
    const choices = node("div", "editor-color-options");
    choices.setAttribute("role", "group");
    choices.setAttribute("aria-label", t("textColor"));
    for (const [key, label2] of [["", t("defaultColor")], ...Object.entries(palette)]) {
      const button = node("button", "editor-color-choice");
      button.type = "button";
      button.dataset.editorColor = key;
      button.setAttribute("aria-label", label2);
      const swatch = node("span", "editor-color-swatch");
      swatch.setAttribute("aria-hidden", "true");
      swatch.style.background = key ? `var(--p-${key}, var(--p-text))` : "var(--p-text)";
      const text = node("span");
      text.textContent = label2;
      button.append(swatch, text);
      listen(button, "pointerdown", (event) => event.preventDefault());
      listen(button, "click", () => {
        command("color", key || null);
        colorPicker.open = false;
        restore();
      });
      choices.append(button);
    }
    listen(colorPicker, "keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        colorPicker.open = false;
        colorSummary.focus();
      }
    });
    listen(doc, "pointerdown", (event) => {
      if (!colorPicker.contains(event.target)) colorPicker.open = false;
    });
    colorPicker.append(colorSummary, choices);
    toolbar.append(colorPicker);
  }
  for (const [name, title, icon] of [
    ["bold", t("bold"), "bold"],
    ["italic", t("italic"), "italic"],
    ["underline", t("underline"), "underline"],
    ["strike", t("strike"), "strikethrough"],
    ...enabled.lists ? [["bulletList", t("bulletList"), "list-bullet"], ["orderedList", t("orderedList"), "list-ordered"]] : [],
    ["link", t("link"), "link"],
    ["unlink", t("unlink"), "unlink"],
    ...enabled.import !== false ? [["import", t("importTitle"), "code"]] : [],
    ["undo", t("undo"), "undo"],
    ["redo", t("redo"), "redo"],
    ...enabled.images ? [["image", t("insertImage"), "image"]] : [],
    ...enabled.fullscreen ? [["fullscreen", t("fullscreen"), "expand"]] : []
  ]) {
    const button = node("button", "editor-tool");
    button.type = "button";
    button.title = title;
    button.setAttribute("aria-label", title);
    button.dataset.editorCommand = name;
    const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("aria-hidden", "true");
    const use = doc.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `${iconsUrl}#${icon}`);
    svg.append(use);
    button.append(svg);
    listen(button, "pointerdown", (event) => event.preventDefault());
    listen(button, "click", () => {
      if (name === "link") openLink().catch(loadFailed);
      else if (name === "image") {
        imageIndex = null;
        openImage().catch(loadFailed);
      } else if (name === "import") openImport().catch(loadFailed);
      else if (name === "fullscreen") toggleFullscreen().catch(loadFailed);
      else {
        command(name);
        if (name !== "undo" && name !== "redo") restore();
      }
    });
    if (name === "link" || name === "image") button.setAttribute("aria-haspopup", "dialog");
    buttons.set(name, button);
    toolbar.append(button);
  }
  const readDOM = /* @__PURE__ */ __name(() => {
    const blocks = [];
    const read = /* @__PURE__ */ __name((element, marks = {}) => {
      if (element.nodeType === 1 && element.hasAttribute("data-editor-ui")) return [];
      if (element.nodeType === 3) return [{ ...marks, text: element.textContent.replace(/\u00a0/g, " ") }];
      if (element.nodeName === "BR") return element.nextSibling ? [{ text: "\n" }] : [];
      if (["SCRIPT", "STYLE", "SVG", "MATH", "IFRAME"].includes(element.nodeName)) return [];
      const inherited = { ...marks };
      if (element.nodeType === 1 && colorNames.includes(element.getAttribute("data-text-color"))) inherited.color = element.getAttribute("data-text-color");
      if (["B", "STRONG"].includes(element.nodeName)) inherited.bold = true;
      if (["I", "EM"].includes(element.nodeName)) inherited.italic = true;
      if (element.nodeName === "U") inherited.underline = true;
      if (["S", "STRIKE", "DEL"].includes(element.nodeName)) inherited.strike = true;
      if (element.nodeName === "A" && safeHref(element.getAttribute("href"))) inherited.link = safeHref(element.getAttribute("href"));
      return [...element.childNodes].flatMap((child) => read(child, inherited));
    }, "read");
    for (const group of groups()) {
      if (group.length === 1 && group[0].hasAttribute?.("data-editor-image")) {
        const original = value.blocks[Number(group[0].dataset.editorImage)];
        if (original?.type === "image") blocks.push({ ...original });
        continue;
      }
      const textBlock = group[0]?.querySelector?.("[data-editor-text]") || group[0];
      const level = /^H[234]$/.test(textBlock?.nodeName) ? Number(textBlock.nodeName[1]) : 0;
      const style = group[0]?.nodeName === "LI" ? group[0].parentElement.nodeName === "OL" ? "ordered" : "bullet" : null;
      let next = { version: 1, blocks: [{ type: level ? "heading" : "paragraph", ...level ? { level } : {}, children: [] }] };
      for (const run of group.flatMap((child) => read(child))) next = replaceText(next, documentText(next).length, documentText(next).length, run.text, run);
      if (style) {
        const listRoot = group[0].closest("[data-editor-block]");
        let list = blocks.at(-1);
        if (list?.type !== "list" || list._root !== listRoot) {
          list = { type: "list", style, items: [], _root: listRoot };
          blocks.push(list);
        }
        for (const row of next.blocks) list.items.push({ children: row.children });
      } else blocks.push(...next.blocks);
    }
    return blocks.length ? normalizeDocument({ version: 1, blocks: blocks.map(({ _root, ...block }) => block) }) : emptyDocument();
  }, "readDOM");
  const nativeInput = /* @__PURE__ */ __name(() => {
    if (composing) return;
    const nextSelection = readSelection();
    value = readDOM();
    const size = documentText(value).length;
    selected = nextSelection ? { from: Math.min(size, nextSelection.from), to: Math.min(size, nextSelection.to) } : { from: size, to: size };
    pending = active();
    render();
    restore();
    record();
  }, "nativeInput");
  const styleReady = styles ? ensureStyles("editor", { document: doc }) : Promise.resolve();
  styleReady.catch(loadFailed);
  shell.append(toolbar, content, footer, hint);
  render();
  source.after(shell);
  dragDrop = createDragDrop(content, { translate: t, onMove: /* @__PURE__ */ __name(({ from, to }) => command("moveBlock", { from, to }), "onMove") });
  const wasHidden = source.hidden;
  source.hidden = true;
  record();
  listen(doc, "selectionchange", remember);
  for (const sourceLabel of source.labels || []) listen(sourceLabel, "click", (event) => {
    event.preventDefault();
    content.focus();
  });
  listen(content, "keydown", (event) => {
    if (composing || event.isComposing) return;
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && !event.altKey && event.key.toLowerCase() === "a") {
      event.preventDefault();
      selected = { from: 0, to: documentText(value).length };
      restore();
      updateToolbar();
      return;
    }
    if (["Backspace", "Delete"].includes(event.key) && !modifier && !event.altKey && !(event.shiftKey && event.key === "Delete")) {
      remember();
      if (selected.from !== selected.to) {
        event.preventDefault();
        erase(event.key === "Backspace" ? "backward" : "forward");
        return;
      }
      if (event.target.matches("[data-drag-handle], [data-editor-image]")) {
        event.preventDefault();
        command("removeBlock", Number(event.target.closest("[data-editor-block]").dataset.blockIndex));
        return;
      }
    }
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    if (["b", "i", "u", "k", "z", "y"].includes(key)) {
      event.preventDefault();
      remember();
      if (key === "k") buttons.get("link").click();
      else command(key === "b" ? "bold" : key === "i" ? "italic" : key === "u" ? "underline" : key === "y" || event.shiftKey ? "redo" : "undo");
    }
  });
  listen(content, "beforeinput", (event) => {
    if (composing || event.isComposing) return;
    remember();
    if (event.inputType.startsWith("delete") && selected.from === selected.to) {
      const target = event.getTargetRanges?.()[0];
      if (target && content.contains(target.startContainer) && content.contains(target.endContainer)) {
        const from = domOffset(target.startContainer, target.startOffset), to = domOffset(target.endContainer, target.endOffset);
        if (from < to && !["deleteContentBackward", "deleteContentForward"].includes(event.inputType)) selected = { from, to };
      }
    }
    if (event.inputType === "insertText" && event.data !== null) {
      event.preventDefault();
      insert(event.data);
    } else if (["insertParagraph", "insertLineBreak"].includes(event.inputType)) {
      event.preventDefault();
      const at = rowAt(value, selected.from);
      if (selected.from === selected.to && at.row.type === "list-item" && at.size === 0) commitModel(exitListItem(value, selected.from));
      else insert("\n");
    } else if (event.inputType === "deleteContentBackward" && selected.from === selected.to && rowAt(value, selected.from).row.type === "list-item" && rowAt(value, selected.from).start === selected.from) {
      event.preventDefault();
      commitModel(exitListItem(value, selected.from));
    } else if (event.inputType.startsWith("delete") && selected.from !== selected.to || ["deleteContentBackward", "deleteContentForward"].includes(event.inputType)) {
      event.preventDefault();
      erase(event.inputType === "deleteContentForward" ? "forward" : "backward");
    } else if (["historyUndo", "historyRedo", "formatBold", "formatItalic", "formatUnderline", "formatStrikeThrough"].includes(event.inputType)) {
      event.preventDefault();
      command({ historyUndo: "undo", historyRedo: "redo", formatBold: "bold", formatItalic: "italic", formatUnderline: "underline", formatStrikeThrough: "strike" }[event.inputType]);
    }
  });
  listen(content, "input", nativeInput);
  listen(content, "compositionstart", () => {
    composing = true;
  });
  listen(content, "compositionend", () => {
    composing = false;
    nativeInput();
  });
  listen(content, "paste", (event) => {
    event.preventDefault();
    const data = event.clipboardData;
    if (!data) return;
    remember();
    const image = [...data.files].find((file) => file.type.startsWith("image/"));
    if (image && enabled.images && !data.getData("text/plain")) {
      imageIndex = null;
      openImage(image).catch(loadFailed);
      return;
    }
    let fragment;
    if (pasteMode === "formatted") {
      const json = data.getData(clipboardType);
      if (json && json.length <= 1e6) {
        try {
          fragment = normalizeDocument(JSON.parse(json));
        } catch {
        }
      }
      if (!fragment) {
        const html = data.getData("text/html");
        if (html) fragment = clipboardDocument(html, { document: doc, headings: enabled.headings });
      }
    }
    if (fragment) {
      fragment = filterFragment(fragment);
      if (fragment) insertFragment(fragment);
    } else {
      const text = data.getData("text/plain");
      if (text) insert(text);
    }
  });
  const copy = /* @__PURE__ */ __name((event) => {
    const range = readSelection();
    if (!range || range.from === range.to || !event.clipboardData) return;
    let offset = 0;
    let text = "";
    value.blocks.forEach((block, index) => {
      const body = blockText(block);
      if (block.type === "image") {
        if (range.from <= offset && range.to > offset) text += block.alt;
      } else text += body.slice(Math.max(0, range.from - offset), Math.max(0, Math.min(body.length, range.to - offset)));
      offset += body.length;
      if (index < value.blocks.length - 1 && range.from <= offset && range.to > offset) text += "\n";
      offset++;
    });
    event.preventDefault();
    event.clipboardData.setData("text/plain", text);
    const fragment = selectionDocument(value, range.from, range.to);
    event.clipboardData.setData("text/html", clipboardHTML(fragment, { document: doc }));
    event.clipboardData.setData(clipboardType, JSON.stringify(fragment));
    if (event.type === "cut") {
      selected = range;
      erase("backward");
    }
  }, "copy");
  listen(content, "copy", copy);
  listen(content, "cut", copy);
  listen(content, "drop", (event) => event.preventDefault());
  listen(content, "dragstart", (event) => event.preventDefault());
  const imageAction = /* @__PURE__ */ __name((event) => {
    const figure = event.target.closest("[data-editor-image]");
    if (!figure || !enabled.images) return;
    if (event.target.closest("[data-resize-handle], [data-editor-ui]")) return;
    event.preventDefault();
    imageIndex = Number(figure.dataset.editorImage);
    let start = 0;
    for (let at = 0; at < imageIndex; at++) start += blockText(value.blocks[at]).length + 1;
    selected = { from: start, to: start + 1 };
    const action = event.target.closest("[data-image-action]")?.dataset.imageAction;
    const index = imageIndex;
    if (action === "remove") command("removeImage");
    else if (action === "smaller" || action === "larger") {
      const width = value.blocks[index].width + (action === "smaller" ? -25 : 25);
      updateImage(index, { width: Math.max(25, Math.min(100, width)) }, `[data-image-action="${action}"]:not(:disabled)`);
    } else if (["left", "center", "right"].includes(action)) updateImage(index, { align: action }, `[data-image-action="${action}"]`);
    else if (action === "edit" || event.type === "keydown") openImage().catch(loadFailed);
    else {
      figure.focus();
      win.getSelection()?.removeAllRanges();
    }
  }, "imageAction");
  listen(content, "click", (event) => {
    const remove = event.target.closest("[data-block-delete]");
    if (remove) {
      event.preventDefault();
      command("removeBlock", Number(remove.dataset.blockDelete));
      return;
    }
    if (event.target.closest("a")) event.preventDefault();
    imageAction(event);
  });
  listen(content, "keydown", (event) => {
    if (event.target.matches("[data-editor-image]") && event.key === "Enter") imageAction(event);
  });
  if (source.form) listen(source.form, "reset", (event) => {
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      if (destroyed || event.defaultPrevented) return;
      openSequence++;
      library?.close();
      linkDialog?.close();
      imageDialog?.close();
      importDialog?.close();
      imageIndex = null;
      value = parse(source.value);
      selected = { from: 0, to: 0 };
      pending = {};
      history = [];
      position = -1;
      render();
      record();
    }, 0);
  });
  return {
    command,
    get ready() {
      return Promise.all([styleReady, selectTask, attachResizers() || resizeTask]).then(() => void 0);
    },
    getJSON: /* @__PURE__ */ __name(() => normalizeDocument(value), "getJSON"),
    getText: /* @__PURE__ */ __name(() => plainText(value), "getText"),
    getStats: /* @__PURE__ */ __name(() => editorStats(value, language), "getStats"),
    openDialog(kind, options2 = {}) {
      if (kind === "import") return openImport(options2.format);
      if (kind === "link") return openLink();
      if (kind === "image") {
        imageIndex = null;
        return openImage();
      }
      throw new TypeError("Unknown editor dialog");
    },
    setJSON(json) {
      if (destroyed) throw new Error("Editor byl odpojen.");
      const next = normalizeDocument(json);
      openSequence++;
      library?.close();
      linkDialog?.close();
      imageDialog?.close();
      importDialog?.close();
      imageIndex = null;
      selected = { from: 0, to: 0 };
      pending = {};
      value = next;
      render();
      record();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      openSequence++;
      clearTimeout(resetTimer);
      library?.destroy();
      dragDrop?.destroy();
      clearResizers();
      sync();
      linkDialog?.destroy();
      imageDialog?.destroy();
      importDialog?.destroy();
      headingControl?.destroy();
      fullscreenModal?.destroy();
      fullscreenHost?.remove();
      listeners.forEach((cleanup) => cleanup());
      shell.remove();
      source.hidden = wasHidden;
    }
  };
}
__name(createEditor, "createEditor");
export {
  createEditor
};
