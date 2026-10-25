# Markdown and HTML import

The editor toolbar's code icon opens an import modal. Choose Markdown or HTML, enter source, preview the converted content, then Apply. Preview does not edit the document. Apply replaces the saved editor selection as one undoable JSON edit. Cancel, Escape and close leave content unchanged.

```js
await editor.openDialog('import'); // Markdown selected
await editor.openDialog('import', { format: 'html' });
```

The optional dialog, Markdown converter, custom select and renderer load only when opened. Existing JSON APIs remain synchronous. `editor.ready` does not preload import UI; await `openDialog` for it. Disable the toolbar and API through `features: { import: false }`, including global `configurePure({ editor: { features: { import: false } } })`. Import is enabled by default.

Import uses the destination's heading/list/image feature settings, independently of clipboard `pasteMode`. If the editor model changes while opening, the dialog is canceled. A model change after opening prevents insertion into an obsolete selection; reopen the dialog. Reset/setJSON close it; destroying the editor cleans up the dialog and prevents late initialization.

## Supported Markdown subset

- ATX headings (`#` through `######`), clamped to editor levels 2–4.
- Paragraphs, bullet lists (`-`, `+`, `*`) and ordered lists (`1.` / `1)`). Indentation flattens list items because the model has no nesting. Ordered numbering starts at the model default.
- Bold (`**` / `__`), italic (`*` / `_`), combined emphasis and strike (`~~`).
- Inline links with safe HTTP(S), mailto or relative addresses. Image syntax contributes alt text without fetching/importing remote images.
- Backslash escapes, inline backticks and fenced code. Code becomes literal text; there is no code mark/block in the JSON schema. Fenced lines become paragraph rows.
- Quote prefixes become ordinary paragraphs. Raw HTML in Markdown remains literal text; choose HTML mode to convert tags.

This is the editor's supported subset, not full CommonMark/GFM. Tables, task state, reference links, automatic URL detection, setext headings, horizontal rules, complex link destinations and office-specific extensions are not interpreted. Unsupported syntax may remain literal text. Blank lines separate blocks; ordinary wrapped paragraph lines join with spaces. No Markdown/HTML source is retained after insertion.

Markdown is limited to 1,000,000 UTF-16 units and 10,000 lines. Empty/invalid/oversized input stays in the modal with an error. HTML follows the [clipboard conversion rules and limits](editor-clipboard.md); if conversion yields no supported content it is rejected. There is no plain-text fallback for explicit HTML import.

## Safe preview

The preview renders only the validated JSON result through Pure's renderer. It never displays imported HTML directly. Scripts, styles, event handlers and embedded content are discarded; HTML image sources are not fetched. Preview links do not navigate. The dialog uses the editor's Czech/English translations and supports message overrides.

[Try the clipboard/import example](../examples/clipboard.html). [Browser checks](../test/editor-clipboard.html) also accept `?min`.
