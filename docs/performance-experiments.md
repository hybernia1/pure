# Delivery experiments

These are local lab observations from 24 October 2026, not release guarantees or a public preload API. Pure 1.3.0 still ships the documented readable and minified ESM distributions. The experimental application and recorded fixtures live outside this repository in the local `pure-comparison` project.

## Equivalent application comparison

The same publishing workspace was implemented with Pure 1.3.0, Bootstrap 5.3.8 plus Quill 2.0.3, and Tailwind 4.3.3 plus Quill 2.0.3. Each has an editor, metadata tabs, form validation, preview modal, notification, local save, table filtering and pagination. The application and layout logic are shared; editor interfaces and JSON models differ.

Every optimized page receives page-specific modulepreload hints for its application, adapter and required startup dependencies. Pure also preloads the select module because headings are enabled. Optional editor dialogs and media UI stay on demand.

| Complete stack | Startup gzip | Desktop ready | Mobile ready | Mobile without hints |
| --- | ---: | ---: | ---: | ---: |
| Pure | 45.1 KiB | 196 ms | 845 ms | 1,409 ms |
| Bootstrap + Quill | 88.3 KiB | 169 ms | 881 ms | 1,183 ms |
| Tailwind + Quill | 71.5 KiB | 170 ms | 840 ms | 1,186 ms |

Values are medians of five fresh samples per group: 45 page loads and 150 successful functional checks. Gzip totals include unique startup HTML, CSS, JavaScript and SVG files, excluding optional UI loaded after interaction. Much of the external stacks' JavaScript is Quill. This is a comparison of complete selected tasks, not CSS frameworks in isolation.

Mobile startup ranges overlap; the few-millisecond difference between Pure and Tailwind is not evidence of a universal winner. Median CLS was zero for all three stacks. One small nonzero Tailwind sample was retained. The fixed editor toolbar reserves its optional heading selector before loading it.

## Method and limits

Foreground desktop Chrome on Windows, local gzip server, no-store and cache disabled. Desktop: 1280 × 900, CPU 1×, unrestricted network. Mobile lab: 390 × 844, CPU 4×, latency 80ms, download 200,000 B/s and upload 93,750 B/s. Stack/policy order rotates. Initial three-round groups were extended to five because of observed variation; no samples were discarded.

Ready is an application mark after editor/controller initialization and two animation frames. It is not a standard web vital. OS/JIT caches remain; mobile is emulation rather than a physical device. These measurements do not certify Lighthouse, field INP, accessibility or a production HTTP/2/HTTP/3 deployment. Earlier three-run experiments used a narrower preload policy and must not be mixed with this table.

## Working direction

- Keep source modules and standalone component APIs independently usable.
- Investigate generated dependency metadata and selective preload support first. Preload changes discovery timing; it does not initialize components or remove code.
- Test compact production entry groups separately from source organization, preserving dynamic optional addons.
- Compare combined strategies in new runs before adopting a distribution change. No automatic preload or compiled entry profile has been added to the release by these experiments.

Current loading contracts remain in [Distribution](distribution.md). Run `npm run audit:size` for current static graph sizes.
