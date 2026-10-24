# Drag and drop

`createDragDrop` is a standalone vertical sorting service for a container's direct children. It supports mouse, touch, pen and keyboard without the editor, icons or another library. File upload and transfer between lists are separate concerns.

```html
<ul id="tasks">
  <li data-drag-item data-id="a"><button type="button" data-drag-handle>First task</button></li>
  <li data-drag-item data-id="b"><button type="button" data-drag-handle>Second task</button></li>
</ul>
```

```js
import { createDragDrop } from './dist/pure/js/drag-drop.js';
const drag = createDragDrop(document.querySelector('#tasks'), {
  items: '[data-drag-item]', handle: '[data-drag-handle]',
  onMove({ from, to, item, items }) {
    // DOM is already reordered; indices are zero-based and to is the final index.
    console.log(from, to, items.map(item => item.dataset.id));
  },
});
drag.move(0, 1);
drag.cancel(); // Cancel only the current gesture.
drag.destroy(); // Remove listeners/indicators, retain order.
```

The selectors shown are defaults. A named button handle must be inside its item. New direct children are recognized automatically. One instance per container. onMove runs once for an actual order change; identical indices do nothing. The application synchronizes data and saves to its API. It can reverse a failed save with move(to, from), guarding against recursive saving.

Dragging starts after a small movement on the handle; body text remains selectable. An indicator previews the final position; DOM moves only on release. Release outside, Escape, pointercancel or window blur cancels. Near edges, the closest scroll container or page scrolls automatically.

Keyboard: Space/Enter picks up, Up/Down changes position, Home/End jumps to ends, Space/Enter commits, Escape/Tab cancels. role=status announces progress and position. Focus stays on the moved handle.

`nested:true, reorder:false` supports items under grouping elements. In that mode no DOM move occurs: onMove receives `{from,to,item,items}` with original items order so the application can update its model/render. Use both options together; nested with automatic DOM reordering is rejected. The editor uses direct children because an entire list is one block.

`translate(key, values)` customizes announcements. Keys dragMoved, dragMoving, dragCanceled, dragPicked and dragPosition with index/count parameters match editorLocales. Without a callback, the service retains its original Czech defaults.

CSS drag-drop.css uses data-dragging, data-drop-before and data-drop-end with neutral tokens. When using custom selectors, retain data-drag-item/data-drag-handle attributes or supply equivalent CSS, especially touch-action:none on handles. Also included in pure.css. [Standalone example](../examples/modules.html#drag-title).

## Editor integration

The entire block header, including empty space beside its type/width, is draggable up to the separate Delete action. Document text stays selectable. UI labels never enter JSON or text offsets. Moves and deletion each form one undo step.

```js
editor.command('moveBlock', { from: 0, to: 2 });
editor.command('removeBlock', 1);
```

Deleting the last block leaves an empty paragraph. Include drag-drop.css when loading editor styles individually.
