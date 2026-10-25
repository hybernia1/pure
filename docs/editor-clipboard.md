# Editor clipboard

For explicitly entering Markdown/HTML source, use the [import modal](editor-import.md). Ordinary clipboard paste does not interpret Markdown syntax.

The editor converts clipboard contents into its JSON model. It never stores pasted HTML or attaches imported DOM to the editable area.

## Import order

Default `pasteMode: 'formatted'` tries validated `application/x-pure-document+json`, then supported `text/html`, then `text/plain`. Invalid formatted data falls back to the next available flavor. Plain text normalizes CRLF/CR to LF and uses destination text marks. Empty/unsupported contents leave the selection unchanged. Structured paste replaces the range as one undoable edit; paragraph edges merge into surrounding text while incoming headings/lists retain boundaries. Offsets use UTF-16.

```js
const editor = createEditor(textarea, { pasteMode: 'plain' });
```

This instance option accepts only `formatted` or `plain`. Plain mode reads the text flavor; it does not derive text from HTML-only data. Image files still use the image modal when enabled.

## Conversion rules

| Source | JSON result |
| --- | --- |
| Paragraphs/block containers | Paragraph blocks |
| `h1`–`h6` | Heading levels clamped to 2–4 when enabled, otherwise paragraphs |
| `ul` / `ol` / `li` | Whole bullet/ordered list blocks |
| Nested lists | Separate flat lists in reading order; nesting is not in the schema |
| `strong`/`b`, `em`/`i`, `u`, `s`/`strike`/`del` | Bold, italic, underline, strike |
| Common inline font-weight/style/text-decoration | Supported boolean marks |
| Safe anchor URLs | Link marks; unsafe URLs lose the link and retain text |
| `br`, preformatted newlines | Row boundaries; preformatted spaces retained |
| Tables | Paragraphs for cells, without table layout |
| HTML images | Alt text only; remote/data images are not imported or fetched |

Arbitrary CSS, fonts, external colors, classes, handlers, scripts, embedded documents and unsupported attributes are discarded. Named colors and durable image IDs survive Pure JSON transfer. Disabled heading/list/image features flatten corresponding imported content; disabled images retain alt text if present. This is a supported-subset converter, not a lossless Word/Google Docs importer. List numbering encoded only in office CSS/plain text is not inferred.

Formatted input is limited to 1,000,000 UTF-16 units. HTML traversal limits depth to 64 and visited nodes to 10,000. Overflow rejects the whole formatted conversion and falls back to available plain text, without inserting partial conversion. Plain text has no additional clipboard-specific length cap.

## Copy and cut

Copy/cut writes plain text, semantic HTML and a validated Pure JSON fragment. Block controls and image action labels are excluded. Partial runs and lists retain structure. HTML carries marks, links, headings and lists; images export alt text. Pure JSON retains images, media IDs and color keys. Applications/browsers that strip custom formats fall back to HTML/text and lose image IDs/template color keys. Cut is undoable.

## Image files

A clipboard image file opens the existing modal with the file selected. Shared validation and optional `prepareFile` processing run before upload. Apply uses the normal `uploadImage` callback; cancel keeps the document unchanged. The callback must return a durable URL or media object; IDs remain in JSON and blob/data URLs are never stored.

Mixed text/file clipboards prioritize text/structured content. Only the first image file is offered. HTML-only images without alt/text and unsupported files leave the selection unchanged.

[Image preparation](image-preparation.md) · [Media adapters](editor-media-i18n.md) · [Example](../examples/clipboard.html) · [Browser checks](../test/editor-clipboard.html) (also `?min`). Checks use synthetic clipboard events; native OS clipboard behavior should also be verified in target browsers.
