# First release audit - October 23, 2026

Historical record based on commit ad2638c. Later [lazy loading](distribution.md), [performance work](release-1.0-audit.md), [minification](minification.md), MIT licensing and layout changes supersede parts of it. Run current checks for current sizes/hashes. Nothing was tagged or published during this audit.

The audit covered CSS/JS/SVG sources, distribution, package contents, lifecycle and selected workloads. Fixes below were implemented and verified; release decisions were open at the time.

## Findings at the time

| Priority | Finding | Next step at the time |
| --- | --- | --- |
| P1 before publication | No LICENSE or package license field | Owner selects license/metadata. Subsequently resolved with MIT. |
| P1 before publication | private:true, working version 0.6.1; npm scope access unverified | Confirm release/distribution/scope before changing npm settings or tagging. |
| P1 for declared support | Chrome verified; no Firefox/Safari or minimum-version matrix | Verify supported browsers. Dialog, Popover, pointer capture and CSS layers are required; no polyfills. |
| P2 large documents | Whole-document normalization/rendering; up to 100 full JSON snapshots, without a byte limit | Measure target workloads; consider incremental rendering/history byte limits. |
| P2 lightweight pages | Browser index.js loads 27 modules; sideEffects does not remove them | Prefer direct modules; application bundlers may tree-shake. |

## Implemented fixes

| Area | Change | Verification |
| --- | --- | --- |
| Statistics | Cache at most 8 Intl.Segmenter instances, no segment arrays/filters, one text/image pass | Count, locale, fallback tests and microbenchmark |
| Drag/drop | One geometry read per item, skip unchanged marker writes, find scroll ancestor once per gesture | Pointer, keyboard, Escape, cancel, editor history |
| Resize | Four global listeners only during gestures, removed on end/cancel/destroy | 0 idle, 4 during drag, 0 afterward |
| Reset | Validation/upload respect prevented reset, wait for native value restoration, cancel timers on destroy | Canceled then valid reset regression and upload tests |
| Build | Validate target path, clear only dist, prevent stale modules | Stale-file removal, exact 46-file/source checks |
| Package | dist/docs/README allowlist, root/module/CSS/SVG exports, CSS side effects, prepack checks | Self-imports, dry-run packing; no sources/tests/dev server/.pure in package |
| Reproducibility | LF text and binary PNG attributes | Two builds produced the same manifest |

## Historical sizes

Readable output, bytes. JS gzip sums individually compressed static dependencies, not a bundle/HTTP transfer. Request overhead/cache effects are excluded.

| Entry | Files | Raw | Gzip |
| --- | ---: | ---: | ---: |
| pure.css | 1 | 37,908 | 6,547 |
| icons.svg | 1 | 3,987 | 1,124 |
| js/index.js with dependencies | 27 | 146,735 | 48,979 |
| js/editor.js with dependencies | 13 | 100,534 | 32,181 |
| js/search.js with dependencies | 5 | 20,822 | 7,418 |
| js/theme.js | 1 | 1,539 | 707 |
| js/activity.js | 1 | 1,563 | 742 |

Initial JS root was 145,589 raw / 48,630 gzip bytes. Fixes added 349 gzip bytes while reducing runtime work; CSS size did not change. No minifier/bundler was added during this audit.

## Workload and evidence

Node v24.15.0, one local machine: 1,000 paragraphs, 5,000 words, 3 warmups, median of 15 editorStats runs. Before 1.704ms, after 1.228ms; another post-change run was 1.102ms. About 28% reduction in compared runs, not whole-editor latency, heap profiling or a mobile guarantee. Timing is not pass/fail.

23 Node and 30 Chrome integration tests passed, including two new regressions. prepack passed. Dry-run packing verified the allowlist without creating/publishing a tarball. check:dist verified source copies, generated utilities, combined CSS, exact files and exports. Two builds produced SHA-256 `74a70c5df011c6be0566f5b21c8668a7445dbccc1c946221ab40f7d5cb16ec5b`.

No DevTools heap profile, large-editor end-to-end workload, cross-browser CI or CDN deployment was included. The upload server is a local example; applications own authentication, mediaId authorization, complete image validation and production storage.

## Reproduce current checks

```sh
npm test
npm run build
npm run check:dist
npm run audit:size
npm pack --dry-run --json --ignore-scripts
```

Start npm run dev and open /test/browser.html. Tables above remain historical snapshots.
