import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { preloadManifest as regular } from '../dist/pure.min/js/preload-manifest.js';
import { preloadManifest as compact } from '../dist/pure.min/compact/js/preload-manifest.js';

const entries = {};
for (const [profile, manifest] of [['esm', regular], ['compact', compact]]) {
  const root = `dist/pure.min/${profile === 'compact' ? 'compact/' : ''}`;
  for (const names of [['editor'], ['editor', 'modal', 'tabs', 'flash', 'select']]) {
    const paths = [...new Set(names.flatMap(name => manifest.components[name]))];
    const files = await Promise.all(paths.map(path => readFile(root + path)));
    entries[`${profile}:${names.join('+')}`] = {
      files: files.length,
      bytes: files.reduce((sum, file) => sum + file.length, 0),
      gzipBytes: files.reduce((sum, file) => sum + gzipSync(file).length, 0),
      brotliBytes: files.reduce((sum, file) => sum + brotliCompressSync(file).length, 0),
      paths
    };
  }
}
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const report = {
  version,
  scope: 'Static JavaScript closure only. Per-file compression sums, not HTTP transfer. Excludes CSS, icons, app, loader, manifest and dynamic addons. Node zlib defaults.',
  entries
};
const json = JSON.stringify(report, null, 2) + '\n';
if (process.argv.includes('--write')) await writeFile(`docs/benchmarks/distribution-${version}.json`, json);
console.log(json);
