import { performance } from 'node:perf_hooks';
import { cpus, platform, arch } from 'node:os';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
import { normalizeDocument, replaceText, formatText, documentText } from '../src/js/editor-model.js';
import { editorStats } from '../src/js/editor-stats.js';

const summarize = values => {
  values.sort((a, b) => a - b);
  return { medianMs: +values[Math.floor(values.length / 2)].toFixed(4), p95Ms: +values[Math.ceil(values.length * .95) - 1].toFixed(4), minMs: +values[0].toFixed(4) };
};
const measure = fn => {
  for (let i = 0; i < 10; i++) fn();
  const values = [];
  for (let run = 0; run < 31; run++) {
    const start = performance.now(); for (let i = 0; i < 10; i++) fn(); values.push((performance.now() - start) / 10);
  }
  return summarize(values);
};
const cases = {};
for (const [name, count, list] of [['paragraphs100', 100, false], ['paragraphs1000', 1000, false], ['list1000', 1000, true]]) {
  const children = () => [{ text: 'Alpha beta ' }, { text: 'gamma delta epsilon', bold: true }];
  const raw = { version: 1, blocks: list ? [{ type: 'list', style: 'bullet', items: Array.from({ length: count }, () => ({ children: children() })) }] : Array.from({ length: count }, () => ({ type: 'paragraph', children: children() })) };
  const value = normalizeDocument(raw); const length = documentText(value).length;
  cases[name] = { blocks: value.blocks.length, textRows: count, utf16Length: length, jsonBytes: Buffer.byteLength(JSON.stringify(value)), normalize: measure(() => normalizeDocument(value)), insert: measure(() => replaceText(value, 10, 10, 'x')), format: measure(() => formatText(value, 0, length, 'italic', true)), stats: measure(() => editorStats(value, 'en')) };
}
const sources = {};
for (const path of ['src/js/editor-model.js', 'src/js/editor-stats.js']) sources[path] = createHash('sha256').update(await readFile(path)).digest('hex');
const report = { timestamp: new Date().toISOString(), revision: execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(), workingTreeChanges: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()), sources, node: process.version, platform: `${platform()} ${arch()}`, cpu: cpus()[0]?.model, methodology: '10 warmups; 31 batches of 10 operations; median/p95 of per-operation batch times. No pass/fail timing threshold.', cases };
const output = process.argv.indexOf('--output');
if (output >= 0) { const path = process.argv[output + 1]; if (!path) throw new Error('Missing output path'); await mkdir(dirname(path), { recursive: true }); await writeFile(path, JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify(report, null, 2));
