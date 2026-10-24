import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import { editorStats } from '../src/js/editor-stats.js';

const root = resolve('dist');
const size = async paths => {
  let bytes = 0; let gzip = 0;
  for (const path of paths) { const data = await readFile(path); bytes += data.length; gzip += gzipSync(data).length; }
  return { files: paths.length, bytes, gzipBytes: gzip };
};
const closure = async entry => {
  const seen = new Set();
  const visit = async path => {
    if (seen.has(path)) return;
    if (!path.startsWith(root + '\\') && !path.startsWith(root + '/')) throw new Error('Import outside dist');
    await stat(path); seen.add(path);
    const source = await readFile(path, 'utf8');
    for (const match of source.matchAll(/\b(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) await visit(resolve(dirname(path), match[1]));
  };
  await visit(resolve(root, entry)); return [...seen];
};
const entries = {};
for (const entry of ['pure.css', 'icons.svg', 'js/lazy.js', 'js/index.js', 'js/editor.js', 'js/search.js', 'js/theme.js', 'js/activity.js']) {
  entries[entry] = await size(entry.endsWith('.js') ? await closure(entry) : [resolve(root, entry)]);
}
const document = { version: 1, blocks: Array.from({ length: 1000 }, () => ({ type: 'paragraph', children: [{ text: 'Alpha beta gamma delta epsilon' }] })) };
for (let index = 0; index < 3; index++) editorStats(document, 'en');
const timings = [];
for (let index = 0; index < 15; index++) { const start = performance.now(); editorStats(document, 'en'); timings.push(performance.now() - start); }
timings.sort((a, b) => a - b);
console.log(JSON.stringify({ node: process.version, gzip: 'Sum of separately compressed files, not an HTTP measurement', entries, statsBenchmark: { blocks: 1000, words: 5000, runs: 15, medianMs: +timings[7].toFixed(3), minMs: +timings[0].toFixed(3) } }, null, 2));
