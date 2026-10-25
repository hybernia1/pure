import {
  createEditorDialog
} from "./chunk-I3ZPNOHJ.js";
import {
  createSelect
} from "./chunk-RFY4ZLPV.js";
import {
  renderDocument
} from "./chunk-WZ4MSG5F.js";
import {
  clipboardDocument
} from "./chunk-JQUWWSRB.js";
import {
  normalizeDocument
} from "./chunk-KL7ILSU2.js";
import {
  safeHref
} from "./chunk-3SIP5CGE.js";
import "./chunk-SDVY4RQI.js";
import "./chunk-F5G6XZNC.js";
import "./chunk-FYRGNXMB.js";
import "./chunk-C6Z2H5Y3.js";
import "./chunk-VKBN75Z7.js";
import "./chunk-I2KQSOTD.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/editor-markdown.js
function inline(source, marks = {}, depth = 0) {
  if (depth > 16) return [{ text: source, ...marks }];
  const runs = [];
  let text = "";
  const flush = /* @__PURE__ */ __name(() => {
    if (text) {
      runs.push({ text, ...marks });
      text = "";
    }
  }, "flush");
  for (let at = 0; at < source.length; ) {
    const rest = source.slice(at);
    const escaped = /^\\([\\`*_[\]{}()#+.!>~-])/.exec(rest);
    if (escaped) {
      text += escaped[1];
      at += escaped[0].length;
      continue;
    }
    const ticks = /^`+/.exec(rest)?.[0];
    if (ticks) {
      const end = source.indexOf(ticks, at + ticks.length);
      if (end !== -1) {
        flush();
        runs.push({ text: source.slice(at + ticks.length, end), ...marks });
        at = end + ticks.length;
        continue;
      }
      text += ticks;
      at += ticks.length;
      continue;
    }
    const repeated = /^([*_~])\1{3,}/.exec(rest)?.[0];
    if (repeated) {
      text += repeated;
      at += repeated.length;
      continue;
    }
    const link = /^(!?)\[([^\]\n]*)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/.exec(rest);
    if (link) {
      flush();
      const href = !link[1] && safeHref(link[3]);
      runs.push(...inline(link[2], href ? { ...marks, link: href } : marks, depth + 1));
      at += link[0].length;
      continue;
    }
    let matched = false;
    for (const [delimiter, mark] of [["***", ["bold", "italic"]], ["___", ["bold", "italic"]], ["**", "bold"], ["__", "bold"], ["~~", "strike"], ["*", "italic"], ["_", "italic"]]) {
      if (!rest.startsWith(delimiter) || delimiter.includes("_") && /[\p{L}\p{N}]/u.test(source[at - 1] || "")) continue;
      let end = source.indexOf(delimiter, at + delimiter.length);
      if (delimiter.length === 1) {
        while (end !== -1 && source.startsWith(delimiter.repeat(2), end)) end = source.indexOf(delimiter, end + 2);
      } else if (delimiter.length === 2 && source[end + 2] === delimiter[0]) {
        const inner = source.slice(at + 2, end).split(delimiter[0]).length - 1;
        if (inner % 2) end++;
      }
      if (end <= at + delimiter.length || /\s/.test(source[at + delimiter.length]) || /\s/.test(source[end - 1])) continue;
      const next = { ...marks };
      for (const name of Array.isArray(mark) ? mark : [mark]) next[name] = true;
      flush();
      runs.push(...inline(source.slice(at + delimiter.length, end), next, depth + 1));
      at = end + delimiter.length;
      matched = true;
      break;
    }
    if (!matched) text += source[at++];
  }
  flush();
  return runs;
}
__name(inline, "inline");
function markdownDocument(source) {
  if (typeof source !== "string" || source.length > 1e6) throw new RangeError("Source exceeds import limits.");
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  if (lines.length > 1e4) throw new RangeError("Source exceeds import limits.");
  const blocks = [];
  let paragraph = [], list, fence;
  const flush = /* @__PURE__ */ __name(() => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", children: inline(paragraph.join(" ")) });
      paragraph = [];
    }
  }, "flush");
  for (const line of lines) {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length) {
        fence = null;
        continue;
      }
      blocks.push({ type: "paragraph", children: line ? [{ text: line }] : [] });
      continue;
    }
    if (marker) {
      flush();
      list = null;
      fence = marker[1];
      continue;
    }
    if (!line.trim()) {
      flush();
      list = null;
      continue;
    }
    const heading = /^\s{0,3}(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/.exec(line);
    const item = /^\s*(?:([-+*])|\d+[.)])\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      list = null;
      blocks.push({ type: "heading", level: Math.max(2, Math.min(4, heading[1].length)), children: inline(heading[2]) });
    } else if (item) {
      flush();
      const style = item[1] ? "bullet" : "ordered";
      if (!list || list.style !== style) {
        list = { type: "list", style, items: [] };
        blocks.push(list);
      }
      list.items.push({ children: inline(item[2]) });
    } else {
      list = null;
      paragraph.push(line.replace(/^\s*>\s?/, ""));
    }
  }
  flush();
  const hasText = blocks.some((block) => (block.type === "list" ? block.items : [block]).some((row) => row.children.some((run) => run.text.trim())));
  return hasText ? normalizeDocument({ version: 1, blocks }) : null;
}
__name(markdownDocument, "markdownDocument");

// src/js/editor-import.js
function createImportDialog(doc, { t, filter, insert }) {
  const convert = /* @__PURE__ */ __name((fields) => {
    const source = fields.source.value;
    let value;
    try {
      value = fields.format.value === "html" ? clipboardDocument(source, { document: doc }) : markdownDocument(source);
    } catch {
      throw new Error(t("importInvalid"));
    }
    if (!value) throw new Error(t("importEmpty"));
    value = filter(value);
    if (!value) throw new Error(t("importEmpty"));
    return value;
  }, "convert");
  const controller = createEditorDialog(doc, {
    title: t("importTitle"),
    t,
    selectFactory: createSelect,
    fields: {
      format: { label: t("importFormat"), options: [["markdown", "Markdown"], ["html", "HTML"]] },
      source: { label: t("importSource"), type: "textarea", rows: 6 }
    },
    submit(fields) {
      insert(convert(fields));
    }
  });
  controller.dialog.dataset.editorDialog = "import";
  const button = doc.createElement("button");
  button.type = "button";
  button.className = "button button-outline";
  button.textContent = t("importPreview");
  const help = doc.createElement("p");
  help.className = "field-help";
  help.textContent = t("importHelp");
  const preview = doc.createElement("div");
  preview.className = "content border rounded p-3";
  preview.hidden = true;
  preview.setAttribute("aria-label", t("importPreview"));
  const status = doc.createElement("p");
  status.className = "field-error";
  status.setAttribute("role", "status");
  controller.controls.source.closest(".field").after(help, button, status, preview);
  const clear = /* @__PURE__ */ __name(() => {
    preview.replaceChildren();
    preview.hidden = true;
    status.textContent = "";
  }, "clear");
  const show = /* @__PURE__ */ __name(() => {
    clear();
    try {
      preview.append(renderDocument(convert(controller.controls), { document: doc }));
      preview.hidden = false;
    } catch (error) {
      status.textContent = error.message;
    }
  }, "show");
  const stopLink = /* @__PURE__ */ __name((event) => {
    if (event.target.closest("a")) event.preventDefault();
  }, "stopLink");
  preview.addEventListener("click", stopLink);
  button.addEventListener("click", show);
  controller.controls.source.addEventListener("input", clear);
  controller.controls.format.addEventListener("change", clear);
  return {
    dialog: controller.dialog,
    open(format, opener) {
      clear();
      controller.open({ format, source: "" }, opener);
      controller.controls.source.focus();
    },
    close: /* @__PURE__ */ __name(() => controller.close(), "close"),
    destroy() {
      preview.removeEventListener("click", stopLink);
      button.removeEventListener("click", show);
      controller.controls.source.removeEventListener("input", clear);
      controller.controls.format.removeEventListener("change", clear);
      controller.destroy();
    }
  };
}
__name(createImportDialog, "createImportDialog");
export {
  createImportDialog
};
