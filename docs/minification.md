# Distribution minification

Current directories are dist/pure and dist/pure.min; package imports stay stable. Production build generates no .map files or sourceMappingURL comments. check:dist verifies both trees and rejects maps (124 files). Use the readable distribution for debugging.

## Historical measurement with source maps

The report below predates directory renaming and map removal. Current JS/CSS files are additionally smaller by the removed map-reference comments. Run npm run audit:size for current values.

Measured October 24, 2026 after commit ea751fb with esbuild 0.28.2 as a development-only dependency. Each JS/CSS file is transformed separately, without bundling/runtime libraries. [Loading instructions](distribution.md).

Bytes; JS includes static dependencies, not dynamic imports. Gzip sums individually compressed files with default Node zlib settings. Map files are excluded but reference comments were included. This measures size, not HTTP/execution latency.

| Entry | Readable raw -> minified | Readable gzip -> minified | Gzip reduction |
| --- | ---: | ---: | ---: |
| lazy.js | 9,527 -> 7,363 | 3,597 -> 3,271 | 9.1% |
| index.js | 208,292 -> 137,934 | 68,358 -> 60,412 | 11.6% |
| editor.js | 82,587 -> 53,030 | 24,665 -> 21,535 | 12.7% |
| search.js | 27,785 -> 19,558 | 9,860 -> 8,791 | 10.8% |
| theme.js | 8,255 -> 5,853 | 2,897 -> 2,484 | 14.3% |
| pure.css | 49,141 -> 42,379 | 8,098 -> 7,742 | 4.4% |
| icons.svg | 4,309 -> 4,309 | 1,205 -> 1,205 | 0% |

The complete JS graph shrank 33.8% raw, saving about 7.9kB gzip. CSS gzip already removes most repetition; additional savings were 356 bytes. SVG stays unchanged to preserve public symbol IDs/currentColor.

Preserving function names/module boundaries trades some savings for API/lazy stability. No property mangling. Network/parsing benefits are possible, but this audit proves only size reduction and functional checks, not faster editing or INP.

## Reproduction

```sh
npm ci
npm test
npm run build
npm run check:dist
npm run audit:size -- --output docs/benchmarks/local-minification.json
npm run dev
```

[Historical raw report](benchmarks/minification.json). Current check:dist verifies exact content/exports/function names and absence of maps. The same browser assertions run with ?min for browser, lazy, data, tabs, navigation, editor-lists and themes. Lazy tests ensure JS/CSS/sprite requests stay in the selected graph. Rebuild both trees after changes.

At the historical measurement, 42 Node tests and 68 tests per distribution (136 total, Chrome 156) passed. Two builds gave the same 185-file manifest `43f96102b8cc65e657c7a981cda8518e04e880bee7474e1d615f3029aee903ea`. Dry-run packing included maps without publishing. Both trees/maps then occupied about 1.26MB unpacked / 344kB tarball; these are historical package sizes, not page transfer sizes or current map-free sizes.
