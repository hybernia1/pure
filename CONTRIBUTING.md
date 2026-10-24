# Contributing to Pure

Use Node.js 22+ for development. Websites using the prebuilt files do not need Node.js.

```sh
npm ci
npm test
npm run build
npm run check:dist
npm run check:docs
npm run dev
```

Read [AGENTS.md](AGENTS.md) for source and API conventions, [architecture](docs/architecture.md), and [distribution](docs/distribution.md). Edit `src/`; commit generated `dist/` changes with the source. Keep original ESM entry points compatible. The compact profile is generated from those sources, not maintained separately.

Open `/test/browser.html`, `/test/compact.html`, `/test/editor-render.html` and suites relevant to your change; repeat with `?min`. CI runs Node tests and verifies generated artifacts, but browser suites are manual. Report the browsers you actually tested. Do not infer browser support from Node CI.

For performance changes preserve the baseline, record source revisions/hashes, use equivalent tasks and report all samples and conditions. Separate startup, warm-cache navigation and runtime work. See [measurements](docs/performance-experiments.md). Avoid timing thresholds in CI.

Use GitHub issues for bugs and proposals; include a minimal reproduction and the selected distribution/profile. PRs should describe behavior, compatibility and relevant validation. See the [release checklist](docs/releasing.md).
