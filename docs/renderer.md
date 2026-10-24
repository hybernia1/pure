# JSON content renderer

Render the editor's versioned JSON through safe DOM nodes, without initializing the editor or parsing HTML.

```js
import { loadComponent } from './pure/js/lazy.js';
const { createRenderer } = await loadComponent('renderer');
const content = createRenderer(document.querySelector('#article'), savedDocument);
content.update(anotherDocument);
content.destroy();
```

`createRenderer(target, value)` appends one owned `.content` wrapper and returns `{element, update(value), getJSON(), destroy()}`. Existing target children remain untouched. `update` validates the entire document before replacing content, so invalid data leaves the previous view intact. `getJSON` returns a detached canonical document. Destroy removes only the wrapper. Updating after destroy throws.

`renderDocument(value, {document = globalThis.document} = {})` returns a detached DocumentFragment for applications managing their own DOM. Append it to a `.content` container to use the optional content styles. It has no initialization side effects.

The renderer shares `normalizeDocument` and URL validation with the editor. It supports paragraphs, heading levels 2–4, bold/italic/link runs, ordered and bullet list blocks, and images with alt text, captions, width and alignment. Legacy adjacent list items normalize to a single list. Images preserve their ID as `data-media-id` on the figure, use lazy loading and asynchronous decoding, and keep durable sources from the model. No upload or media-library code is imported.

Strings become text nodes, never HTML. Unsafe links/image URLs, unknown fields and invalid schemas throw before rendering. Links navigate in the same browsing context. This is model validation, not authorization or a substitute for server-side validation; applications remain responsible for which external URLs their content may reference.

Direct imports use `js/renderer.js` plus tokens/base and `css/renderer.css`. See the [live example](../examples/content-chart.html) and [editor documentation](editor.md).
