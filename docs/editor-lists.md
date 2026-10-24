# Lists in the JSON editor

Bullet and ordered lists are enabled by default (`features.lists:true`). false hides tools and disables commands while preserving loaded list data.

```json
{
  "version": 1,
  "blocks": [
    { "type": "list", "style": "bullet", "items": [
      { "children": [{ "text": "First item", "bold": true }] },
      { "children": [{ "text": "Second item" }] }
    ] },
    { "type": "paragraph", "children": [{ "text": "A paragraph." }] },
    { "type": "list", "style": "ordered", "items": [{ "children": [{ "text": "First step" }] }] }
  ]
}
```

A list is one block with a nonempty items array, one header, one drag handle and one Delete action. Items are plain li elements in semantic ul/ol without independent controls or frames. Move/delete applies to the entire list. Adjacent canonical lists remain separate; ordered lists each start at 1. Only one level is supported: no nested lists or HTML.

normalizeDocument automatically merges adjacent legacy list-item blocks of the same style into one list. getJSON emits the new format. Paragraphs, headings and images are unchanged; application validators must support list/items.

Items use the same text runs as paragraphs: text, bold, italic, link. Selection/formatting may start inside an item and span other items/blocks. Links and undo/redo work. Statistics count a list as one block and count all item words, excluding markers and UI. getText/copy produces item text separated by newlines, not HTML or Markdown.

## Interaction and API

- Toolbar tools combine selected text blocks into a bullet/ordered list. Inside a list they change the whole block's style. Toggling an active tool converts items to paragraphs.
- Enter adds an item. Enter on an empty item converts it to a paragraph and exits the list.
- Backspace at an item's start converts it to a paragraph without deleting the preceding block. In the middle of a list this splits the remaining items into separate lists before/after it.
- The shared header moves/deletes the whole block; undo restores every item.

```js
editor.command('bulletList');
editor.command('orderedList');
editor.command('list', 'bullet'); // Explicit setting, not a toggle.
editor.command('list', 'ordered');
editor.command('list', null); // Paragraphs.
```

Commands are synchronous and affect blocks intersecting the current selection. Unknown styles throw. Images are skipped. Conversion to headings/paragraphs preserves each item's text in its own text block.

The pure `setList(documentJSON, from, to, style)` export from editor-model.js/index.js returns a normalized copy. Ranges use UTF-16 offsets as with formatText/setHeading; one newline separates items. replaceText preserves item type when splitting with a newline.

Translation keys: bulletList, orderedList, listItem. Sprite icons: list-bullet and list-ordered. [Example](../examples/modules.html#editor-title), [model tests](../test/editor-model.test.js), [integration tests](../test/editor-lists.html).
