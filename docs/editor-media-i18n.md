# Editor statistics, languages and media

The footer and editor.getStats() expose blocks, words and images. All blocks count, including empty paragraphs; a list is one block but all item words count. Image alt/caption and controls are excluded from words. Intl.Segmenter is used with a Unicode letter/number fallback. Updates follow typing, setJSON, reset and undo/redo, including fullscreen.

Pure `editorStats(documentJSON,locale)` provides the same counts for a normalized document. createUpload/validateFiles accept translate(key,values) for file messages: uploadRemove, uploadRemoveFile, uploadSelected, uploadEmpty, uploadError, maxFiles, maxSize, invalidType from editorLocales. Without a callback, createUpload uses global locale/messages; pure validateFiles retains its original Czech defaults.

## Localization

```js
createEditor(textarea, {
  locale: 'en', // Omit to inherit html lang; missing lang falls back to English.
  messages: { words: 'Word count: {count}', remove: 'Remove' },
});
```

Built-in dictionaries: cs/en. Regional variants such as cs-CZ use the base language. Unsupported languages use English UI, with custom messages for any locale. Locale is selected per instance at initialization; changing document language does not relocalize existing instances. JSON content is never translated.

editorLocales exports complete keys/dictionaries. messages is a flat string object. Parameters include count, index, title, level, page, name, size and errors in braces. Missing keys fall back. Toolbars, blocks, footer, dialogs, upload messages, resize and drag announcements are localized. Applications translate their own server/callback messages; programmer errors are not UI dictionary entries. Format markers/percent signs stay unchanged.

## Direct uploads without a library

```js
const editor = createEditor(textarea, {
  features: { images: true },
  async uploadImage(file, { signal }) {
    const data = new FormData(); data.append('file', file);
    const response = await fetch('/my-api/media', { method: 'POST', body: data, signal });
    if (!response.ok) throw new Error('Upload failed');
    const item = await response.json();
    return { id: item.id, src: item.url, alt: item.alt || '', name: file.name };
  },
});
```

A file picker, preview and drop work independently of the library, without a URL field. The callback owns endpoint, headers, authorization, transport and response adaptation. Raw File with request() is also supported. Forward the abort signal; closed dialogs ignore late results. PNG/JPEG/WebP/GIF/AVIF default to a 10 MiB limit (or global upload.maxSize); servers validate again. These are image blocks, not arbitrary attachment blocks.

Return `{id,src,alt?,name?}`. Legacy URL strings remain accepted with mediaId:null. Editing alt/caption/size does not reupload and retains ID. A new file/library choice replaces the original ID.

## Library integration

```js
createEditor(textarea, {
  features: { images: true }, uploadImage: myUpload,
  mediaLibrary: {
    async load({ query, page, pageSize, signal }) {
      const url = new URL('/my-api/media', location.origin);
      url.search = new URLSearchParams({ q: query, page, limit: pageSize });
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error('Load failed');
      return response.json(); // { items: [{id,src,alt?,name?}], total: 42 }
    },
    upload: myUpload, pageSize: 12,
  },
});
```

The image dialog gains a Media library button. Its modal supports search, pagination and selection. Choosing fills the image preview/alt; insertion occurs only on Apply. Opening/loading/uploading does not itself change the document. Document changes invalidate stale selections. Library upload is optional and independent of uploadImage.

load receives one-based page and should return `{items,total}` where total is all matching media. Shared numbered pagination becomes compact previous/current/next on mobile. Query changes reset to page 1. If total removes the current page, the library reloads the nearest valid page once. Response item count must not exceed pageSize or total.

A plain array means the entire filtered dataset and is paginated locally. Legacy `{items,hasMore}` without total retains previous/next navigation without invented totals/page counts. For numbered pages return total. If an old array response contained just one server page, wrap it with total or hasMore.

Items require durable safe src and id: nonempty string or finite number, including zero. blob/data/javascript URLs are rejected. Cards display preview/name/ID. name is a library label, not stored in image JSON. Closing aborts requests; stale responses are ignored. Loading/errors retain previous content; errors offer retry.

Search/upload/cards/footer are separate areas. --p-media-library-width defaults to 52rem, constrained by viewport. Include data.css for pagination. Media keys include mediaCount, mediaChoose, mediaRetry; pagination uses shared [data UI keys](data.md).

## Standalone modal

```js
import { createMediaLibrary } from './dist/pure/js/media-library.js';
const library = createMediaLibrary({
  load: myLoad, upload: myUpload, locale: 'en', messages: {}, pageSize: 12,
  onSelect(media, { signal }) { console.log(media.id, media.src); },
});
await library.open(button); // Waits for loading, not selection.
await library.refresh();
library.close();
library.destroy();
```

onSelect may be async: success closes the modal; errors show a message. document can target another DOM document. load is required; upload/onSelect are optional. normalizeMedia(item) publicly validates this contract. CSS: tokens/base/components/forms/controls/modal/media-library/data, or full pure.css. Await open for CSS/items. Closing/destroying while loading prevents late opening.

## JSON compatibility

```json
{"type":"image","src":"/media/42.webp","mediaId":42,"alt":"Landscape","width":50,"align":"center"}
```

Document version stays 1. Old images normalize to mediaId:null without fake IDs. IDs survive text edits, resize, moves, undo/redo and getJSON/setJSON. Servers must revalidate media existence and authorization for both ID and src. Deleting a block does not delete media from the server.

[Editor/library example](../examples/modules.html#editor-title) - [English editor with custom text](../examples/modules.html#editor-i18n-title).
