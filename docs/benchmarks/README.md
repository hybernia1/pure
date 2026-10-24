# Performance evidence for 1.4.0

## Built distribution size

Reproduce from this tag with `npm ci`, `npm run build`, then `node scripts/distribution-metrics.mjs`. The committed [JSON](distribution-1.4.0.json) lists every file in each static JavaScript graph. Sizes sum separately compressed files with Node zlib defaults; they exclude CSS, icons, application code, lazy loader, manifest and dynamic addons. These are build measurements, not observed HTTP transfers.

| Minified static graph | Files | Raw | gzip | Brotli |
| --- | ---: | ---: | ---: | ---: |
| Original editor | 10 | 57,288 B | 22,979 B | 20,453 B |
| Compact editor | 10 | 56,639 B | 22,490 B | 20,244 B |
| Original editor + modal + tabs + flash + select | 17 | 79,529 B | 33,262 B | 29,426 B |
| Compact same selection | 20 | 79,272 B | 32,914 B | 29,519 B |

The compact profile has a small gzip saving here. It does **not** guarantee fewer requests or smaller Brotli output: code splitting preserves shared modules and optional addons. The original ESM profile remains the default. Generated preload hints can make dependencies discoverable earlier in either profile; their actual startup benefit depends on the server, cache and application and has not been established by these size measurements. Earlier experimental bundle startup numbers are not evidence for this shipped chunk graph.

## Editor formatting lab

These measurements preceded the release and motivated its editor optimizations. The baseline was Pure 1.3.1 (`2f4c9f9`); the optimized source became the editor implementation in 1.4.0. The lab used an experimental delivery graph, not the final 1.4.0 compact distribution. All editors were initialized before timing.

| Implementation | 100 paragraphs | 1,000 paragraphs |
| --- | ---: | ---: |
| Pure 1.3.1 baseline | 2.7 ms | 18.2 ms |
| Pure optimized | 2.3 ms | 12.7 ms |
| Bootstrap 5.3.8 + Quill 2.0.3 | 2.1 ms | 9.4 ms |
| Tailwind 4.3.3 + Quill 2.0.3 | 2.1 ms | 9.6 ms |

Medians of five per-run medians, 20 measured toggles per document size after four warmups: 800 measured operations overall. Foreground desktop Chrome on Windows, 1280 by 900, CPU 1x and unrestricted network reasserted for every page. Five rotating-order rounds. Documents contain 1,400 / 14,000 words. Each toggle formats the first five UTF-16 units in bold; one animation-frame yield sits outside each timer. Content and final formatting were checked and the original draft restored.

Pure uses DOM selection plus its public command API; Quill uses `formatText` with user source and an explicit range. Both retain history/change handlers and application word-count updates. The measurement includes synchronous model/DOM work, excludes selection/setup, paint and asynchronous follow-up work. It is not native typing latency, field INP, page-load time or a general framework ranking. The two Quill differences are sample variation. Pure improved about 30% on the 1,000-paragraph task and remains slower than Quill in this task.

The [raw samples](round5-edits.json), [summary with run ranges](round5-summary.json) and [exact browser workload](edit-workload.js) are retained. The original comparative application harness lives in the separate local `pure-comparison` project; these files alone do not reproduce its complete fixtures. To repeat the task in another application, adapt the workload's `api` methods, retain the protocol above and report that application's handlers and editor versions. No independent or cross-device reproduction is claimed.

## Validation scope

The release has 63 Node tests, deterministic distribution verification and local documentation-link checks. CI runs these on Node 22 and 24. Browser suites are manual Chrome checks, separate from CI; Firefox, Safari and real-device coverage are not claimed. The new compact integration page checks shared module identity/configuration, generated preloads, asset URLs, heading selection, lazy dialogs/upload/resize, fullscreen, flash and cleanup in both readable and minified output.
