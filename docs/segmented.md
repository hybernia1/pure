# Segmented controls

A compact exclusive choice for periods, display modes or filters. Native radio inputs provide keyboard arrows, Tab, form values, validation, reset and disabled state without component JavaScript.

```html
<fieldset class="segmented">
  <legend class="sr-only">Reporting period</legend>
  <label><input type="radio" name="period" value="7" checked><span>7 days</span></label>
  <label><input type="radio" name="period" value="30"><span>30 days</span></label>
  <label><input type="radio" name="period" value="90" disabled><span>90 days</span></label>
</fieldset>
```

Use one shared `name` per group and unique names for independent groups in the same form. Keep each label's input immediately followed by its visible span. The legend names the group; remove `sr-only` if you want it visible. Do not add button roles or `aria-pressed` to radio inputs. Selection, focus and disabled appearance follow native states, semantic tokens and light/dark schemes. Items wrap when space is limited.

Include tokens, base, components and `css/segmented.css`, or use the complete `pure.css` bundle. To load styles only on demand:

```js
import { ensureStyles } from './pure/js/lazy.js';
await ensureStyles('segmented');
```

Listen to the native bubbling `change` event when the choice controls a chart or filter:

```js
group.addEventListener('change', event => {
  const days = Number(event.target.value);
  chart.update(datasets[days]);
});
```

Use [tabs](tabs.md) when switching associated content panels rather than choosing a value. There is no JavaScript instance, configuration, initialization or cleanup API for segmented controls. See the [chart example](../examples/content-chart.html).
