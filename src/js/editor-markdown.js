import { normalizeDocument } from './editor-model.js';
import { safeHref } from './url.js';

// Deliberately the editor's flat JSON subset, not a full CommonMark engine.
function inline(source, marks = {}, depth = 0) {
  if (depth > 16) return [{ text: source, ...marks }];
  const runs = [];
  let text = '';
  const flush = () => { if (text) { runs.push({ text, ...marks }); text = ''; } };
  for (let at = 0; at < source.length;) {
    const rest = source.slice(at);
    const escaped = /^\\([\\`*_[\]{}()#+.!>~-])/.exec(rest);
    if (escaped) { text += escaped[1]; at += escaped[0].length; continue; }
    const ticks = /^`+/.exec(rest)?.[0];
    if (ticks) {
      const end = source.indexOf(ticks, at + ticks.length);
      if (end !== -1) { flush(); runs.push({ text: source.slice(at + ticks.length, end), ...marks }); at = end + ticks.length; continue; }
      text += ticks; at += ticks.length; continue;
    }
    const repeated = /^([*_~])\1{3,}/.exec(rest)?.[0];
    if (repeated) { text += repeated; at += repeated.length; continue; }
    const link = /^(!?)\[([^\]\n]*)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/.exec(rest);
    if (link) {
      flush(); const href = !link[1] && safeHref(link[3]);
      runs.push(...inline(link[2], href ? { ...marks, link: href } : marks, depth + 1)); at += link[0].length; continue;
    }
    let matched = false;
    for (const [delimiter, mark] of [['***', ['bold', 'italic']], ['___', ['bold', 'italic']], ['**', 'bold'], ['__', 'bold'], ['~~', 'strike'], ['*', 'italic'], ['_', 'italic']]) {
      if (!rest.startsWith(delimiter) || delimiter.includes('_') && /[\p{L}\p{N}]/u.test(source[at - 1] || '')) continue;
      let end = source.indexOf(delimiter, at + delimiter.length);
      if (delimiter.length === 1) {
        while (end !== -1 && source.startsWith(delimiter.repeat(2), end)) end = source.indexOf(delimiter, end + 2);
      } else if (delimiter.length === 2 && source[end + 2] === delimiter[0]) {
        const inner = source.slice(at + 2, end).split(delimiter[0]).length - 1;
        if (inner % 2) end++;
      }
      if (end <= at + delimiter.length || /\s/.test(source[at + delimiter.length]) || /\s/.test(source[end - 1])) continue;
      const next = { ...marks }; for (const name of Array.isArray(mark) ? mark : [mark]) next[name] = true;
      flush(); runs.push(...inline(source.slice(at + delimiter.length, end), next, depth + 1));
      at = end + delimiter.length; matched = true; break;
    }
    if (!matched) text += source[at++];
  }
  flush(); return runs;
}

export function markdownDocument(source) {
  if (typeof source !== 'string' || source.length > 1_000_000) throw new RangeError('Source exceeds import limits.');
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  if (lines.length > 10_000) throw new RangeError('Source exceeds import limits.');
  const blocks = [];
  let paragraph = [], list, fence;
  const flush = () => { if (paragraph.length) { blocks.push({ type: 'paragraph', children: inline(paragraph.join(' ')) }); paragraph = []; } };
  for (const line of lines) {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length) { fence = null; continue; }
      blocks.push({ type: 'paragraph', children: line ? [{ text: line }] : [] }); continue;
    }
    if (marker) { flush(); list = null; fence = marker[1]; continue; }
    if (!line.trim()) { flush(); list = null; continue; }
    const heading = /^\s{0,3}(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/.exec(line);
    const item = /^\s*(?:([-+*])|\d+[.)])\s+(.+)$/.exec(line);
    if (heading) { flush(); list = null; blocks.push({ type: 'heading', level: Math.max(2, Math.min(4, heading[1].length)), children: inline(heading[2]) }); }
    else if (item) {
      flush(); const style = item[1] ? 'bullet' : 'ordered';
      if (!list || list.style !== style) { list = { type: 'list', style, items: [] }; blocks.push(list); }
      list.items.push({ children: inline(item[2]) });
    } else {
      list = null; paragraph.push(line.replace(/^\s*>\s?/, ''));
    }
  }
  flush();
  const hasText = blocks.some(block => (block.type === 'list' ? block.items : [block]).some(row => row.children.some(run => run.text.trim())));
  return hasText ? normalizeDocument({ version: 1, blocks }) : null;
}
