# Forms, date/time, modals and uploads

[Runnable example](../examples/forms.html). Optional forms.css, controls.css, modal.css and upload.css go after base components and before utilities; full pure.css includes them.

## Fields and selects

Original input, textarea and select elements own data. Optional modules provide appearance/interaction. .input shares height, padding and radius; .field spaces labels, controls and descriptions; .field-label, .field-help and .field-error share typography. .control wraps internal icons/actions; .choice is for checkbox/radio.

```html
<div class="field" data-field>
  <label class="field-label" for="email">Email</label>
  <input class="input" data-input-icon="mail" id="email" name="email" type="email" autocomplete="email" required>
  <p class="field-error" data-field-error hidden></p>
</div>
```

Username is a text input with autocomplete=username. The application chooses pattern, minlength, maxlength and required. The demo's `[a-zA-Z0-9_]{3,24}` is not a framework rule. Email uses type=email. Client validation does not verify name availability or email ownership.

```html
<label for="role">Role</label>
<select class="input" data-select id="role" name="role" required>
  <option value="">Choose a role</option>
  <optgroup label="Team"><option value="author">Author</option></optgroup>
  <option value="admin" disabled>Administrator</option>
</select>
```

`initInputs(scope = document)` wraps inputs marked data-input-icon="symbol-id", adds a decorative left icon and a right password toggle where applicable. Typical icons: mail, user, lock. Original labels, autocomplete and validity remain intact. Password fields need IDs. Returned cleanup restores original DOM; initialize once per scope.

`initSelects(scope = document)` enhances select[data-select] and returns cleanup. Alternatively, `createSelect(source, { placeholder })` returns open(), close(), refresh(), destroy(). Do not initialize both on one field. The custom list displays options, groups and disabled items rather than a system popup. Multiple selection toggles with click/Space and stays open; single selection closes after confirmation. Arrows/Home/End/type-ahead move focus; Enter/Space confirms. Escape restores field focus; Tab closes and continues through the form.

The hidden original select retains value, required and disabled, including FormData.getAll(). Selection emits input/change. size no longer controls popup height. After programmatic selectedIndex/value changes, call refresh() or dispatch change; attribute/option mutations are observed automatically. Reset restores defaults. Destroy removes custom UI and reveals the source with its current value.

## Date and time

```html
<label for="date">Date</label>
<input class="input" data-picker id="date" name="date" type="date" min="2026-01-01" max="2027-12-31">
<label for="time">Time</label>
<input class="input" data-picker id="time" name="time" type="time" step="900">
<label for="meeting">Date and time</label>
<input class="input" data-picker id="meeting" name="meeting" type="datetime-local">
```

`initPickers(scope = document)` returns cleanup. Alternatively, `createPicker(source, { locale })` returns open(), close(), refresh(), destroy(). Locale follows [configuration](configuration.md), normally html lang. Supported types: date, time, datetime-local. Pure replaces system picker UI with its own calendar/time columns while the source input owns data.

The visible field remains editable. Accepted dates include 23.10.2026, 23. 10. 2026, 2026-10-23 and numeric locale formats. Times accept 14:30 or 14:30:15; combined values include 23.10.2026 14:30 or 2026-10-23T14:30. Valid input normalizes on blur. Alt+Down opens the picker; typing alone does not.

Invalid/incomplete text remains visible, clears the source value and sets customValidity to prevent submission. Valid input still obeys min/max/step/required. Nonexistent dates are not silently corrected. Panel selection, valid text or reset clears the custom error. The visible proxy has no name: FormData contains only the original canonical field. createForm skips proxies and directs invalid focus to the editable control.

The calendar starts Monday. Arrows move days/weeks; Home/End move within the week; PageUp/PageDown move months, with Shift for years. Click/Enter selects; focus movement alone does not change value. Date confirms immediately. Time/datetime have an Apply button enabled only for valid combinations. Hour/minute/optional-second columns support arrows/Home/End and Enter/Space. Minute-based steps show valid choices (step=900 gives 00/15/30/45). Source validity evaluates min/max/step; unavailable days are disabled and invalid second combinations cannot be confirmed. Clear writes an empty value, which required may reject.

Canonical values: YYYY-MM-DD, HH:mm (optionally HH:mm:ss), YYYY-MM-DDTHH:mm. Visible date formatting uses locale. datetime-local has no time zone; submit the intended zone separately for scheduled events. Whole seconds are supported, fractions are not. Call refresh() or dispatch change after programmatic value changes. Reset closes the popup; destroy restores the source.

Popups use Popover API/top layer and outside dismissal. They are nonmodal: Tab continues normally; Escape closes only the popup. A browser with Popover API is required. Without JavaScript, native fields still work. Use createForm with enhanced required fields to redirect error focus and copy ARIA descriptions. Shared controls.css uses --p-picker-width and --p-time-list-height, without shadows.

```js
import { initInputs, initPickers, initSelects, createForm } from '/dist/pure/js/index.js';
const stopInputs = initInputs();
const stopPickers = initPickers();
const stopSelects = initSelects();
const form = createForm(document.querySelector('form'));
// Cleanup: form.destroy(); stopSelects(); stopPickers(); stopInputs();
```

## Validation

```js
import { createForm } from '/dist/pure/js/forms.js';
const controller = createForm(document.querySelector('form'));
const valid = controller.validate({ focus: true });
// controller.destroy();
```

One instance per form. It temporarily sets noValidate and displays errors in [data-field-error] inside each [data-field], using native validity rules. First validation runs on blur/submit, then input/change updates errors. Messages use localized validationMessage, overridden by data-error-message on the input. Fields without an error node still receive aria-invalid.

Invalid submission is stopped and focuses the first error. Valid submission is neither sent nor prevented by this module. Register custom AJAX handlers after createForm, check event.defaultPrevented, then preventDefault and send your request. validate({focus=true}) returns boolean. Reset clears errors. Destroy restores original noValidate/ARIA and removes listeners. Existing aria-describedby is retained and extended with the error ID. Give each field a wrapper; fieldset/legend can name radio/checkbox groups. Validate again on the server.

## Passwords

```html
<label for="password">Password</label>
<input class="input" data-input-icon="lock" id="password" name="password" type="password" autocomplete="new-password">
```

initInputs adds eye/eye-off icons with dynamic aria-label, title and aria-pressed. For custom markup, `initPasswords(scope = document)` connects button[data-password-toggle][aria-controls="password-id"], replacing its content with an icon and restoring it on cleanup. Do not initialize the same toggle twice. Reset/cleanup hides the password. Use autocomplete=current-password for login. Clipboard/password managers are not blocked and the module never sends the value.

## Modal

```html
<button type="button" data-modal-open="details">Open</button>
<dialog class="modal" id="details" data-modal aria-labelledby="details-title">
  <div class="modal-header"><h2 id="details-title">Details</h2></div>
  <div class="modal-body">Content</div>
  <div class="modal-actions"><button type="button" data-modal-close aria-label="Close dialog" autofocus></button></div>
</dialog>
```

`initModals(scope = document)` connects [data-modal-open="id"] to dialog[data-modal] and returns cleanup. data-modal-close="value" closes with returnValue. Alternatively, `createModal(dialog, {closeOnBackdrop=true})` returns open(trigger=document.activeElement), close(value=''), destroy(). Choose one initializer per dialog.

An empty data-modal-close becomes an icon close button with an accessible name. Explicit return-value actions retain their content. Destroy restores original button content/attributes.

Native showModal provides top layer, contained focus and inert surroundings. Escape works natively. Close restores opener focus if it remains connected. Backdrop dismissal requires pointerdown to have started there; clicking dialog padding does not close it. closeOnBackdrop:false disables dismissal. Provide a named heading and suitable autofocus. Native form method=dialog is supported. Do not set open directly when a modal is intended.

Tokens: --p-modal-width (32rem), --p-backdrop (neutral black, 50% opacity), --p-panel-padding, --p-gutter. No shadow. Destroy closes the dialog and removes listeners.

## File upload and drop

```html
<div class="upload" data-upload>
  <label for="files">Attachments</label>
  <input class="input" id="files" name="files" type="file" accept=".pdf,.txt" multiple aria-describedby="files-status">
  <p id="files-status" class="state-text text-xs" role="status" aria-atomic="true" data-upload-status></p>
  <ul class="upload-list" data-upload-list></ul>
</div>
```

```js
import { createUpload } from '/dist/pure/js/upload.js';
const upload = createUpload(document.querySelector('#files'), {
  maxFiles: 3, maxSize: 5 * 1024 * 1024,
  onChange(files) { /* Current File[] */ },
});
// upload.getFiles(); upload.setFiles(files); upload.clear(); upload.destroy();
```

One instance per file input. dropzone/list/status are inferred from DOM or supplied as options. List/status belong exclusively to this module. maxFiles is a positive integer or Infinity (default for multiple); single inputs allow at most one. maxSize is a positive per-file byte limit, default Infinity. accept reads extensions, MIME types and wildcards from the source. Limits apply to picker, drop and setFiles.

A new selection replaces the old; rejected files retain the old selection and announce an error. `setFiles(files, {emit=true})` returns boolean. Success synchronizes FileList/list and normally emits bubbling change and onChange(File[]). getFiles returns an array copy. Removal/clear also synchronize the input. Reset clears the list. Disabled inputs reject new selections and drops.

Local object URL previews support PNG, JPEG, GIF, WebP and AVIF, not SVG. --p-upload-preview sets their dimensions. URLs are revoked on selection changes/destroy. Destroy retains files in the native input while removing generated UI/listeners. The native picker remains the non-JS fallback; drop is never the only route. Drop state uses data-drag-active.

Files are never uploaded automatically:

```js
import { request } from '/dist/pure/js/ajax.js';
await request('/api/upload', { method: 'POST', body: new FormData(form), type: 'json' });
```

Do not set Content-Type for FormData: the browser supplies its boundary. The application owns the endpoint/authorization. Client checks are advisory; validate actual content on the server. Pure `validateFiles(files, {accept='',maxFiles=Infinity,maxSize=Infinity})` returns error strings and throws TypeError for invalid limits.
