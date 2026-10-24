# States, flash, editor and AJAX

All modules are optional with no runtime dependencies. [Runnable example](../examples/modules.html).

## Shared states

Use exactly error, success and info. Muted light/dark tokens express color. data-state sets local variables; classes choose the presentation. Always explain state in text.

```html
<article class="card state" data-state="success">Done: changes saved.</article>
<input class="input state-border" data-state="error" aria-invalid="true" aria-describedby="error">
<p id="error" class="state-text" data-state="error">Error: enter a name.</p>
<span class="badge state" data-state="info">Information: draft</span>
```

state applies text/background/border, state-text only text, state-border only border. Add appropriate aria-invalid and error descriptions to fields. Static states are not live announcements. Exported states is an immutable array of allowed values.

## Flash

```html
<div id="notifications" class="flash-region" aria-label="Notifications"></div>
```

```js
import { createFlash } from '/dist/pure/js/flash.js';
const flash = createFlash(document.querySelector('#notifications'));
const dismiss = flash.show('Done: saved.', { state: 'success' });
// dismiss(); flash.clear(); flash.destroy();
```

`show(message, {state='info',duration=0})` inserts text and a close button, never HTML, and returns a dismissal function. duration is nonnegative milliseconds; zero waits for manual dismissal. Expiration waits while hovered/focused. Errors use a persistent alert announcer, other states status. Dismissing a focused message moves focus to the region. Auto-dismiss only nonessential information.

For transient application feedback, set `configurePure({flash:{duration:5000}})` before creating the region. Each message has its own timer; a new message does not dismiss older messages. Override important errors with `{state:'error',duration:0}`. Hover/focus delays expiration, which is checked again every second. Dismissal also clears the message's live announcement without erasing a newer announcement. The returned dismissal function is safe to call more than once.

clear removes all messages; destroy also removes announcement nodes. One instance per region; show cannot be used after destroy. UI stays in normal flow rather than a fixed toast overlay.

## Editor

```html
<label for="body">Post content</label>
<textarea id="body" name="body">{"version":1,"blocks":[{"type":"paragraph","children":[{"text":"Hello."}]}]}</textarea>
```

```js
import { createEditor } from '/dist/pure/js/editor.js';
const editor = createEditor(document.querySelector('#body'));
editor.setJSON({ version: 1, blocks: [{ type: 'paragraph', children: [
  { text: 'New ' }, { text: 'content', bold: true },
  { text: '.', italic: true, link: '/docs' },
] }] });
const json = editor.getJSON(); // Detached object.
const text = editor.getText(); // Plain text, blocks separated by newlines.
// editor.command('bold'); editor.command('italic');
// editor.command('link', 'https://example.com'); editor.command('unlink');
// editor.command('undo'); editor.command('redo'); editor.destroy();
```

createEditor(source,{label,iconsUrl}) parses textarea JSON. Empty content creates one empty paragraph. Invalid JSON/schema throws before UI creation. The label supplies an accessible name. The textarea retains serialized JSON for FormData/submission and emits input on change. Before initialization it displays JSON source. Reset restores defaultValue; destroy reveals the textarea with current JSON and removes listeners.

Version 1 supports paragraph, heading (level 2/3/4), list (bullet/ordered items) and image blocks. Text runs require text and optionally bold, italic, underline, strike, color, link; an empty paragraph has children:[]. Newlines create blocks/items. Unknown keys, invalid values and unsafe URLs are rejected. Adjacent equal-mark runs merge. getJSON returns a detached copy; setJSON validates an object; getText includes image alt text. Direct textarea edits after initialization are unsupported. See [editor](editor.md), [lists](editor-lists.md) and [media/i18n](editor-media-i18n.md).

Toolbar buttons have accessible names, title, aria-pressed for active formatting and disabled undo/redo states. iconsUrl overrides the sprite resolved relative to the module. Bold/italic/underline/strike toggle the selected range or future typing marks at a collapsed cursor. Selections may span blocks. Link opens a Pure modal; selection is preserved. Applying edits selected text/an existing link, or inserts URL text outside a link. Unlink removes links from the selection or entire link under the cursor. HTTP(S), mailto and relative URLs are allowed. Editor links do not navigate.

Shortcuts: Ctrl/Cmd+B, I, K, Z, Shift+Z and Y. Enter/Shift+Enter split text blocks; lists have their own continuation/exit rules. History retains up to 100 content changes and selection. Clipboard pastes plain text; arbitrary content drops are blocked, while block handles reorder through the shared service. IME is processed after composition. Fullscreen/lists default on; headings/images are optional. Tables and collaborative editing are not supported.

Source textarea must not be required, disabled or readonly. Validate via getJSON/getText and again on the server. Initialize once per textarea. Pure helpers emptyDocument, normalizeDocument and documentText are exported from editor-model.js/index.js. replaceText, formatText and selectionMarks use UTF-16 offsets with one newline between text rows and U+FFFC for images.

The v0.4 API removed getHTML/setHTML. Migrate legacy HTML outside the editor; parse serialized JSON before passing objects to setJSON. Text renders literally through safe DOM nodes, without innerHTML or HTML import/export.

## AJAX HTML allowlist

Only explicit HTML loading uses this allowlist: p, div, br, strong, em, b, i, a, ul, ol, li, blockquote, h2, h3, code, pre. It does not share the editor format. Attributes are removed except validated link href. URLs allow HTTP(S), mailto and relative paths, excluding control characters, backslashes and protocol-relative URLs. Scripts, styles, embedded media, SVG, MathML and templates are dropped with their contents. Other unsupported elements unwrap to text/allowed children.

This is intentionally limited text HTML, not interactive templates with classes/forms. Validate again on the server. cleanHTML, htmlFragment and safeHref are available from html.js.

## AJAX

```js
import { request, createLoader, HttpError } from '/dist/pure/js/ajax.js';
const data = await request('/api/items', { type: 'json' });
const loader = createLoader(document.querySelector('#content'));
try { await loader.load('/partial', { format: 'html' }); }
catch (error) { /* HttpError has status and response; show an application error. */ }
// loader.cancel(); loader.destroy();
```

`request(url,{type='text',...fetchOptions})` returns text/JSON. Non-2xx responses throw HttpError with status/response. Network/JSON errors propagate. Standard fetch options include method, body, headers and AbortSignal; the module does not broaden credentials.

createLoader(target) returns load/cancel/destroy; one instance per target. `load(url,{format='text',...fetchOptions})` sets aria-busy and replaces content only on success. HTML is explicit and sanitized. New requests cancel old ones; stale responses cannot overwrite newer content. An external signal can cancel. Canceled/superseded calls return null; success returns original response text. Errors retain prior content and restore original aria-busy. Destroy cancels pending work and prevents further loads. The application owns messages/retry; no global announcements are added.

Uses standard Fetch, AbortController and DOM Range, not deprecated execCommand.
