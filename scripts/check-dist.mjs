import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { utilities } from './utilities.mjs';
import { minifiedFile } from './minify.mjs';

const files = async (directory, prefix = '') => {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory()) result.push(...await files(`${directory}/${entry.name}`, `${path}/`)); else result.push(path);
  }
  return result.sort();
};
const sourceFiles = await files('src');
const readable = [...sourceFiles, 'pure.css', 'css/utilities.css'].sort();
const expected = [...readable, ...readable.flatMap(path => [`min/${path}`, ...(/\.(js|css)$/.test(path) ? [`min/${path}.map`] : [])])].sort();
assert.deepEqual(await files('dist'), expected, 'Missing or stale dist files');
const combined = await readFile('dist/pure.css', 'utf8');
for (const path of sourceFiles) {
  const source = await readFile(`src/${path}`); assert.deepEqual(await readFile(`dist/${path}`), source, `Stale dist/${path}`);
  if (path.endsWith('.css')) assert.ok(combined.includes(source.toString()), `Missing ${path} in pure.css`);
}
assert.equal(await readFile('dist/css/utilities.css', 'utf8'), utilities());
assert.ok(combined.endsWith(utilities()));
for (const path of readable) {
  const result = await minifiedFile(path, await readFile(`dist/${path}`));
  assert.deepEqual(await readFile(`dist/min/${path}`), Buffer.from(result.code), `Stale min/${path}`);
  if (result.map) assert.equal(await readFile(`dist/min/${path}.map`, 'utf8'), result.map, `Stale map ${path}`);
}
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
for (const [name, path] of Object.entries(manifest.exports)) if (!name.includes('*')) await readFile(path);
assert.deepEqual(Object.keys(await import('@pure-ui/core')), Object.keys(await import('../src/js/index.js')));
assert.equal(typeof (await import('@pure-ui/core/js/theme.js')).initTheme, 'function');
assert.equal(typeof (await import('@pure-ui/core/lazy')).loadComponent, 'function');
assert.deepEqual(Object.keys(await import('@pure-ui/core/min')), Object.keys(await import('@pure-ui/core')));
assert.equal(typeof (await import('@pure-ui/core/min/lazy')).loadComponent, 'function');
assert.equal((await import('@pure-ui/core/min/js/theme.js')).initTheme.name, 'initTheme');
const hash = createHash('sha256');
for (const path of expected) { hash.update(path); hash.update(await readFile(`dist/${path}`)); }
console.log(JSON.stringify({ files: expected.length, sha256: hash.digest('hex'), exports: 'ok' }));
