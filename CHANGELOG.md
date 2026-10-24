# Changelog

## 1.4.0 - 2026-10-24

- Reduce repeated editor normalization, serialization, DOM queries and unchanged footer/active-block updates; preserve UTF-16 selection and JSON behavior.
- Add optional self-contained compact ESM profiles without changing original module imports. Shared configuration and lazy editor addons are retained.
- Generate per-component preload manifests, an opt-in browser helper and HTML hint CLI for both distribution profiles.
- Verify generated compact files/manifests and add preload and editor rendering regressions.
- Publish performance methodology, raw formatting samples and reproducible distribution graph sizes. Compact savings are workload dependent.
- Add GitHub Pages examples, pinned CI actions, contribution instructions, issue/PR templates and release archives.

## Earlier additions

The following modules shipped before 1.4.0; historical version details are recorded in GitHub Releases.

- Sticky positioning/inset utilities with desktop variants and shared tokens.
- WordPress-style post tag picker with comma/Enter entry, removable tags, optional AJAX suggestions and native multiple-select FormData.
- Opt-in browser JPEG/PNG preparation with pixel/input/output limits, cancellation and shared upload/editor/library hooks. Existing setFiles remains synchronous.

## 1.0.0 - 2026-10-24

First versioned GitHub distribution under the MIT license.

- Prebuilt readable `dist/pure/` and minified `dist/pure.min/` trees, without source maps. No Node.js or build step is required for browser use.
- Modular CSS, token-based compact spacing, mobile/desktop utilities and independent light/dark modes and custom color schemes.
- Explicit ES module initialization, global defaults, on-demand JavaScript/CSS loading and English/Czech UI dictionaries.
- Forms, custom date/time/select controls, uploads, search suggestions, modals, shared states, notifications, activity indicators and progress bars.
- JSON block editor with headings, lists, images, media adapters, fullscreen, statistics and undo/redo; reusable drag/drop and resize services.
- Responsive tables/lists/pagination, tabs and navigation.
- English documentation, runnable examples, performance measurements and CI on Node 22/24.

Browser UI verification has been performed in Chrome. Broader browser/device validation remains documented in the release checklist. Large editor documents still have proportional model/serialization work and full-snapshot history. See [release notes and checks](docs/releasing.md) and the [performance audit](docs/release-1.0-audit.md).

This release does not enable npm publication.
