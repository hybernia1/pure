# Publishing and release checklist

The canonical repository is https://github.com/hybernia1/pure. Code and documentation are MIT licensed. Version 1.0.0 is distributed through Git tag `v1.0.0`, including the prebuilt `dist/pure/` and `dist/pure.min/` trees. Using those files needs no Node.js or npm. Node.js 22+ is required only for development/build tooling. GitHub source publication and npm publication are separate; the package stays private to prevent accidental npm publication.

## Before a versioned release

1. Review the API and changelog; choose a version and update package.json/package-lock.json together.
2. Run npm ci, npm test, npm run check:docs, npm run build and npm run check:dist.
3. Run browser suites against readable and ?min output: browser, lazy, data, tabs, navigation, editor-lists and themes. Verify Firefox, Safari and real mobile before declaring support beyond tested Chrome. Pure needs ES modules, dialog, Popover API, pointer APIs and CSS layers; no polyfills are bundled.
4. Review npm run audit:size and relevant benchmarks. Timings are not cross-device guarantees.
5. After build/check:dist, run npm pack --dry-run --json --ignore-scripts. Verify LICENSE and both dist trees, without .map, sourceMappingURL or local uploads.
6. Commit generated output with sources, push without force and verify CI. Create a version tag/release only when ready.

GitHub CI runs Node tests, documentation-link checks, build, distribution verification and dry-run packing on Node 22 and 24. Browser suites remain manual; CI does not claim cross-browser UI coverage.

## Distributing files

Copy dist/pure or dist/pure.min, retaining its js, css, icons.svg and pure.css structure. Editor data/application media are not release assets. Source maps are absent.

## Optional npm publication

Verify access to @pure-ui, choose an available package name/version and review packed files before changing private:true and configuring publication. GitHub access does not establish npm scope rights. No npm publishing workflow is included.
