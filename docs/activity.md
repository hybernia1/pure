# Activity indicator and progress bar

[Example](../examples/modules.html#activity-title). These modules are independent of AJAX and the editor, have no runtime dependencies and require explicit initialization.

## Activity indicator

```js
import { createActivity } from './dist/pure/js/activity.js';
const activity = createActivity();
const finish = activity.start('Saving...');
try { await save(); } finally { finish(); }
const result = await activity.run(() => save(), 'Saving...');
activity.isActive();
activity.destroy();
```

`createActivity({ target, global, label })` defaults to `document.body`; global mode defaults to true for body and false elsewhere. The default label is localized. A local target keeps its existing content. The global indicator is fixed, nonblocking and does not steal focus or disable the page. For native dialogs, put a local indicator inside the dialog.

Each `start(text)` returns its own idempotent finish callback. Concurrent activities are counted separately; the indicator stays visible until all finish, showing the most recent active label. `run(fn, text)` returns the operation's result, propagates errors and finishes only its own activity in finally. It does not cancel the operation; the application owns cancellation. `destroy()` removes UI and safely ignores late finish callbacks.

Use `activity.css`, `--p-spinner-size` and `--p-activity-z`. A static spinner is `<span class="spinner" aria-hidden="true"></span>` inside a `role="status"` container with activity text. Animation respects reduced motion.

## Progress bar

```js
import { createProgress } from './dist/pure/js/progress.js';
const progress = createProgress(document.querySelector('#progress'), {
  max: 100, value: 0, label: 'Uploading',
});
progress.set(45);
progress.set(null); // Indeterminate: no aria-valuenow.
progress.setState('info', 'Processing');
progress.set(100);
progress.setState('success', 'Done');
progress.getValue(); // 100, or null when indeterminate.
progress.setState(null); // Neutral state and original label.
progress.destroy();
```

Defaults are max 100, value 0 and a localized progress label. Maximum must be finite and positive. `set(value)` clamps finite numbers to 0..max; null selects indeterminate progress. The application supplies actual values: Pure does not estimate them or change state automatically at maximum.

`setState(state, message)` accepts error, success, info or null and includes text as well as color. Omitted messages use localized defaults; null restores the original label. UI has role progressbar, an accessible name and bounds. State messages use role status. Destroy removes only generated UI; one instance per container.

Use `progress.css` and `states.css`, or full `pure.css`. Height uses `--p-progress-height`; colors inherit light/dark tokens. `createLoader(target)` remains the AJAX content API; `createActivity()` is the visual indicator for arbitrary work.
