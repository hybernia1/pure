# Changelog

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
