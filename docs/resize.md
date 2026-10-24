# Resize service

`createResize` changes a wrapper's width as a percentage of its container. Images keep their aspect ratio. It does not resize image files or change their resolution, and does not depend on the editor.

```js
import { createResize } from './dist/pure/js/resize.js';
const resize = createResize(document.querySelector('#photo'), {
  width: 50, min: 25, max: 100, step: 5,
  onChange: width => console.log('Preview', width),
  onCommit: width => console.log('Save', width),
});
resize.smaller();
resize.larger();
resize.setWidth(75);
resize.getWidth();
resize.destroy();
```

Use a wrapper such as `<figure id="photo"><img src="photo.jpg" alt="Description"></figure>`, not an img directly. CSS: tokens, base, components and resize, or full pure.css. The handle uses the resize sprite icon.

Options: `container` (parent), `width` (100), `min` (10), `max` (100), `step` (1), localized `label`, `help`, `iconsUrl`, `onChange`, `onCommit`. Percentages must satisfy `0 < min <= max <= 100`; step is positive. Values snap from min and clamp to bounds. Container width must be independent of the resized element, and the wrapper must accept a handle child.

Mouse, touch and keyboard are supported. Arrows change by one step; Home/End select min/max. Escape, window blur or pointer cancellation revert the active drag. onChange reports previews, including rollback. onCommit runs once after a completed drag or keyboard/API change, only when width changed. Initialization does not invoke callbacks.

Destroy removes listeners and the handle and restores original inline width without callbacks. Use one instance per element. The editor uses this service with 25% steps and records only completed changes in JSON/history. [Standalone example](../examples/modules.html#resize-title).
