# Performance audit before 1.0.0

Measured October 24, 2026. Baseline commit: 784e4e5; optimizations were subsequently committed as ea751fb. The [earlier audit](release-audit.md) remains historical. Sizes/manifest here predate the minified tree; see [minification](minification.md) and the [release checklist](releasing.md).

## Method

Windows x64, Intel Core i5-12500H, Node v24.15.0, Chrome 156, viewport 1920 x 911, no CPU/network throttling. Browser measurements cover synchronous JavaScript/DOM with loaded modules/CSS: 2 warmups, 15 samples; p95 is the maximum of those 15. Initialization/destroy are individual samples. Scenarios wait for two frames with a timeout fallback for inactive tabs.

This does not measure painted frames, INP, LCP, cold loads or real mobile hardware. Times are not pass/fail thresholds. Typing dispatches controlled beforeinput at the document start; later positions can cost more due to selection calculations.

Node measures normalization/insertion/formatting/statistics: 10 warmups, 31 batches of 10 operations. Its documents have two text runs per row; browser documents have one. Do not compare environments directly.

```sh
npm test
npm run build
npm run check:dist
npm run audit:size
npm run bench -- --output docs/benchmarks/local-node.json
npm run dev
```

Open /test/performance.html for JSON. Avoid concurrent workloads. Raw results: [Node before](benchmarks/baseline-node.json), [Node after](benchmarks/final-node.json), [Chrome before](benchmarks/baseline-browser.json), [Chrome after](benchmarks/final-browser.json).

## Finding and change

Every character previously recreated all content, including headers/images. Controlled inline changes now retain structure, neighboring nodes and resize instances, replacing only changed runs. Block type/count changes, list structure, changed images, native input, setJSON and history still use full rendering. No dependency or public option was introduced by this optimization.

Toolbar updates skip link scans for collapsed selections and avoid unchanged-selection updates. List items share run validation with paragraphs instead of recursively creating a helper document per item. Schema validation/detached copies remain intact.

## Browser results

Milliseconds, median / p95:

| Scenario | Before | After |
| --- | ---: | ---: |
| Typing, 100 paragraphs | 18.6 / 20.1 | 3.0 / 4.0 |
| Typing, 1,000 paragraphs | 167.2 / 201.8 | 19.1 / 23.8 |
| Typing, 1,000-item list | 73.5 / 86.6 | 12.0 / 17.7 |
| 100 unchanged selectionchange events, 1,000 paragraphs | 257.4 / 286.3 | 166.9 / 176.8 |
| Table reload, 100 rows | 13.2 / 17.0 | 13.4 / 21.3 |
| List reload, 100 rows | 3.1 / 6.3 | 2.7 / 5.2 |

Typing improved about 8.8x for paragraphs and 6.1x for the list. A repeated post-change run gave 18.3 and 11.6ms. Table/data-list code was not optimized; small differences are ordinary variability. All editor scenarios verified inserted JSON text and left zero fixture nodes after destroy; this is not proof of no heap leaks.

Node normalization of 1,000 list items dropped from 0.5508 to 0.4603ms. Other small differences are not treated as proven improvements. The main gain is editor DOM work.

## Historical distribution

Bytes; gzip sums individually compressed static files, excluding dynamic addons/CSS from JS graphs, not HTTP transfer.

| Entry | Files | Raw | Gzip |
| --- | ---: | ---: | ---: |
| lazy.js | 3 | 9,527 | 3,597 |
| index.js | 38 | 208,292 | 68,358 |
| editor.js | 9 | 82,587 | 24,665 |
| search.js | 5 | 27,785 | 9,860 |
| pure.css | 1 | 49,141 | 8,098 |
| icons.svg | 1 | 4,309 | 1,205 |

Optimization added 362 gzip bytes to the editor graph. Lazy/other entries did not grow. Actual resource tests confirmed search does not fetch editor, and core editor does not fetch image addons/modal/library before use.

## Verification at the time

42 Node and 67 Chrome tests passed: general 32, lazy 7, data 6, tabs 6, navigation 5, lists/media 8, themes 3. New regression covers stable neighboring/image nodes, pending bold, undo/redo and full rendering when item count changes. Build/check:dist passed; two builds produced the same 62-file manifest: `55213474f1dfd839947b6310a6bd2dfdfef26a77f893d4d28ffb01b650b0ab08`. Dry-run packing passed without publication. Version/private remained unchanged.

## Limits

Typing into 1,000 paragraphs still exceeds a 16.7ms budget for 60fps. Structural changes rebuild full DOM. Model, statistics, serialization and selection reading remain proportional to document length. History retains at most 100 full JSON snapshots without a byte limit. No virtualization/incremental history was added.

At this audit, license, npm scope/distribution and Firefox/Safari/real-mobile verification remained open. MIT is now selected; npm publication remains disabled and broader browser verification remains pending. This audit did not tag/publish 1.0.0.
