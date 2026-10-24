# Search and AJAX suggestions

```html
<label for="people">User</label>
<input id="people" name="query" type="search" class="input">
```

```js
import { createSearch } from './dist/pure/js/search.js';
const search = createSearch(document.querySelector('#people'), {
  url: '/api/search', // GET /api/search?q=query
  delay: 250, minLength: 2, limit: 8,
  onSelect(item) { console.log(item.value, item.id); },
});
await search.refresh();
search.close();
search.destroy();
```

The endpoint returns a JSON array such as `[{ label: 'Alex Smith', value: 'alex', id: '1' }]`. label and value are strings; extra data is preserved for callbacks. `param` changes the query parameter (default q), encoded with URLSearchParams. For another response format, headers or transport, supply `fetch(query, { signal })` instead of url and return the same array. Pass signal to your request.

Typing waits delay milliseconds and requires minLength characters. New input immediately cancels previous requests and suggestions; stale results are ignored even if the transport ignores abort. IME searches after composition ends. At most limit results are shown. Status text announces loading, empty results or errors. Suggestions are inserted as text, never HTML.

Focus stays in the original combobox input with aria-activedescendant. Arrows select a suggestion; Enter confirms. Tab, Escape, blur and form reset close the list and cancel loading. Selection sets item.value, dispatches input/change, calls onSelect(item) and emits `pure:search-select` with detail:item. Without selection, the original typed query submits. Errors emit `pure:search-error` with detail:Error, allowing normal query submission when suggestions are unavailable.

The source field retains its label, name, validation and FormData. Store a selected ID in your own hidden input if needed, and clear it on further edits. Destroy aborts requests, removes UI/listeners and restores original ARIA/autocomplete attributes. One instance per input. Do not combine this service's search icon with data-input-icon/initInputs on the same input.

CSS: tokens, base, components, forms, controls, search, or pure.css. The list uses Popover API and `--p-search-height`. The [forms example](../examples/forms.html#search-title) fetches and filters local JSON; use url or fetch for a real API.
