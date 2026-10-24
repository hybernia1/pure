# JSON editor and optional modules

## Inline formatting

The toolbar includes bold, italic, underline and strikethrough. JSON runs store optional boolean `bold`, `italic`, `underline`, `strike` fields; false values normalize away. Combine marks with colors and links. `editor.command('underline')` and `editor.command('strike')` toggle the current selection or subsequent typing at a caret. Formatting supports list items, undo/redo, reset and safe renderer output (`strong`, `em`, `u`, `s`).

Keyboard shortcuts: Ctrl/Cmd+B for bold, Ctrl/Cmd+I for italic and Ctrl/Cmd+U for underline. Strikethrough is available through its named toolbar button. Native formatting beforeinput events are handled without storing HTML. Older Pure versions reject the new optional JSON fields, so update the editor and renderer together.

## Text colors

Enable the optional picker with `createEditor(textarea, {features:{colors:true}, colors:{blue:'Blue',red:'Red',green:'Green'}})`. Define `--p-blue`, `--p-red`, etc. in template CSS; core supplies no named hex values. Palette keys come from `colorNames`; labels are application-translated nonempty strings. Both options can also be set through `configurePure({editor:{...}})` for future instances. Colors are disabled by default; enabling requires a nonempty palette.

Choose a color for selected text or subsequent typing at a caret. **Default color** removes the mark. Escape closes the palette; choices are native buttons reached with Tab. Color formatting supports undo/redo, list text and JSON synchronization. `editor.command('color','blue')` applies a configured key; `editor.command('color',null)` removes it. Disabled/unconfigured choices return false.

JSON runs may include `color:'blue'`; arbitrary CSS values and unknown names are rejected. Existing version-1 documents remain valid; older Pure versions reject the new optional field, so update the editor and renderer together. The renderer uses safe spans with `var(--p-blue, var(--p-text))`. Valid existing marks survive even if absent from the current picker. Templates own contrast in both modes.

The editor renders compact paragraph, heading, list and image blocks. Each block has one header with a text drag handle and Delete action. UI is excluded from JSON/text offsets. Moves/deletion support undo/redo and use the shared [drag service](drag-drop.md). Lists are true [list blocks](editor-lists.md).

[Example](../examples/modules.html#editor-title). [Statistics, localization and media adapters](editor-media-i18n.md). [Lazy loading and asynchronous UI](distribution.md).

```js
import { createEditor } from '/dist/pure/js/editor.js';
const editor = createEditor(document.querySelector('#article'), {
  features: { headings: true, images: true, fullscreen: true },
  async uploadImage(file, { signal }) {
    const response = await fetch('/api/images', {
      method: 'POST', headers: { 'Content-Type': file.type }, body: file, signal,
    });
    if (!response.ok) throw new Error('Upload failed');
    const result = await response.json();
    return { id: result.id, src: result.url };
  },
});
await editor.ready;
```

Defaults: headings:false, images:false, fullscreen:true, lists:true. Disabling features hides their controls but preserves valid loaded data. createEditor returns synchronously; await editor.ready for current addons. Programmatic dialog/fullscreen opening is asynchronous: await editor.openDialog('link'/'image') and await editor.command('fullscreen'). JSON commands stay synchronous.

editor-model.js is DOM-free; editor.js supplies UI; editor-dialog.js supplies modal forms. Individual CSS needs tokens/base/components/forms/controls/editor/drag-drop plus modal/upload/resize as used; media-library/data add library pagination. pure.css includes everything. Initialize once per source.

## Headings

The style select offers Paragraph and Heading 2/3/4. It changes the cursor block or selected text blocks and skips images. Enter in a heading continues with a paragraph. `command('heading',2)` selects a heading; 0 selects a paragraph. Requires features.headings:true.

## Links

The toolbar or Ctrl/Cmd+K opens a modal without losing the saved selection. Apply updates selected text/the link under the cursor, or inserts URL text when outside a link. Cancel, close, Escape and backdrop leave content unchanged. HTTP(S), mailto and relative URLs are allowed. Links do not navigate while editing. `command('link',url)` and `command('unlink')` also work programmatically.

## Images

The image modal uses a file picker/drop with preview, name and removal, never a URL input. It also offers alt, caption, width, alignment and an optional library. A new image becomes a separate block after the current block, with a paragraph after it for continued typing. Clicking selects it; Edit or Enter on the focused block opens its properties. A new file replaces both source and mediaId; metadata-only edits retain them. Remove through the modal or header. Content edits participate in history.

Image UI groups width in its header, canvas/resize handle, and size/alignment/edit actions below. Smaller/larger changes by 25%; align left/center/right. The [resize service](resize.md) supports pointer drag, arrows and Home/End; Escape cancels. Completed changes create one undo step. This changes display width, not bitmap pixels; cropping, filters and rotation are not included.

```json
{
  "version": 1,
  "blocks": [
    { "type": "heading", "level": 2, "children": [{ "text": "Heading" }] },
    { "type": "image", "src": "/media/photo.webp", "mediaId": "photo-1", "alt": "Landscape", "caption": "Autumn", "width": 75, "align": "center" },
    { "type": "paragraph", "children": [{ "text": "More content." }] }
  ]
}
```

Image schema allows only type, src, mediaId, alt, caption, width, align. Width is 25/50/75/100 (default 100); align is left/center/right (default center). Empty captions are omitted. alt is required as a string, deliberately empty for decorative images. mediaId is a nonempty string, finite number or null; legacy images normalize to null. src accepts HTTP(S)/relative paths and rejects mailto, data, blob and executable protocols. Resolve URLs against the displaying document. Servers must validate schema, media existence and permissions again. getText uses alt; internal documentText uses one U+FFFC per image and newline row separators.

Inserting/replacing files requires uploadImage; without it, UI reports a clear error but the file field remains available. Supported formats: PNG/JPEG/WebP/GIF/AVIF, default 10 MiB or global upload.maxSize. The callback receives File and {signal}, returns {id,src} with a durable URL; legacy URL strings are accepted with mediaId:null. JSON stores no binary data or temporary object URLs. Upload errors leave content unchanged. Inputs lock while uploading but close remains available. Cancel/close/destroy aborts and ignores late results. A changed document invalidates pending insertion. Preview URLs are revoked on close/file changes.

The demo server (`npm run dev`) has POST /api/images accepting raw File bytes with Content-Type, checking basic signatures and a 10 MiB limit, then writing a random filename in ignored .pure/uploads. It returns `{ "url": "/uploads/..." }`; GET serves that image. Restart does not delete files. This is a local example, not production storage/authentication/validation. Callbacks may use FormData if your server expects it.

`command('image',{src,mediaId,alt,caption,width,align})` inserts or edits the currently open image. `command('removeImage')` removes the selected image. Both require images:true.

## Performance

Controlled typing/formatting retains neighboring DOM blocks/images and replaces changed inline runs. Structural changes, history, setJSON and native input may redraw the whole content. History holds at most 100 full JSON snapshots with no byte cap. See the [performance audit](release-1.0-audit.md) for measured limits.

## Fullscreen

The expand icon or command('fullscreen') moves the editor into a top-layer dialog spanning the viewport. Focus stays inside; link/image modals can open above it. Escape closes the highest dialog. Closing restores the editor's original location, content and selection. This is application fullscreen, not browser/OS fullscreen. Destroy closes dialogs, aborts uploads and restores the textarea.

Tokens: --p-editor-height, --p-editor-style-width, --p-panel-padding and --p-space-*. Toolbar stays available while fullscreen content scrolls.
