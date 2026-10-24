# Post tag picker

WordPress-style tag entry: text field, Add button, Enter/comma confirmation, and removable tags below the field. New labels are allowed by default. This is separate from the generic multiple select.

```html
<label for="tags">Post tags</label>
<select id="tags" name="tags[]" multiple>
  <option value="42" selected>JavaScript</option>
  <option value="7">CSS</option>
</select>
```

```js
const { createTagPicker } = await loadComponent('tag-picker');
const picker = createTagPicker(document.querySelector('#tags'), {
  allowCreate: true, maxTags: 8,
  async fetch(query, { signal }) {
    const response = await fetch(`/api/tags?q=${encodeURIComponent(query)}`, { signal });
    if (!response.ok) throw new Error('Tag lookup failed');
    return response.json(); // [{ label: 'JavaScript', value: '42' }]
  },
});
picker.add('New tag');
picker.getTags(); // [{ value, label, created }]
picker.refresh();
// picker.destroy();
```

The original multiple select owns selected values and FormData.getAll('tags[]'). Known tags retain their values/IDs; newly typed tags use their label as value. A new label colliding with an existing value is rejected rather than selecting an unrelated ID. `created` marks options added by this instance (including remote suggestions absent from the source). It is not a persistent server ID or an instruction to create a database record. Applications must resolve/authorize submitted values and manage new terms on the server.

Options: allowCreate=true, maxTags=Infinity, fetch(query,{signal}), url (same response and q parameter as search), delay=250, minLength=1, limit=8, locale, messages and onChange(tags). With neither fetch nor url, suggestions come from source options. allowCreate:false rejects unknown typed labels but accepts explicit API suggestions. Duplicate values/normalized labels are not selected twice; label comparison trims whitespace and ignores case. Labels must not contain commas. Source values must be unique/nonempty. Commas in pasted text are split when confirmed.

Enter or comma confirms typed tags; Add does the same. Arrows/Enter choose a suggestion; Escape dismisses it. Each selected tag has a named remove button. IME confirmation is not intercepted. Tab does not silently create a tag. Form submit confirms pending text and is blocked if it cannot be accepted. Duplicate text is ignored. Limits/unknown tags produce visible status text. Multiple-entry addition is partial: accepted tags remain, rejected labels stay in the entry for correction.

Reset restores default selections and removes instance-created options. Disabled source/fieldset state is respected. Existing disabled options cannot be selected or removed. Programmatic source value changes need refresh() or change. With required enhanced fields use createForm() so validation focuses the visible proxy. Destroy removes listeners, timers, suggestions and generated UI, restores source visibility and retains current selected options/values. Initialize once per select; do not combine with createSelect.

CSS: tag-picker.css with search/controls/forms/components/base/tokens and states, or full pure.css. Locale defaults to document/global configuration; cs/en and local messages are supported. [Example](../examples/enhancements.html) - [Browser tests](../test/enhancements.html), also with ?min.
