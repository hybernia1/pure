# Lazy-loading placeholders

Reserve space before an asynchronous component arrives. Load `css/placeholder.css` **in the page head**, alongside the layout styles needed for the first viewport, or use the complete `pure.css`. Loading placeholder styles lazily defeats their purpose.

```html
<section class="placeholder" style="--p-placeholder-height:24rem" aria-busy="true" id="slot">
  <div id="skeleton" aria-hidden="true">
    <div class="skeleton skeleton-line"></div>
  </div>
  <div id="content" hidden><!-- editor source / component mount --></div>
</section>
<p role="status" id="status">Loading editor…</p>
```

`.placeholder` reserves a minimum block size through `--p-placeholder-height` (default 12rem). `.skeleton` supplies a neutral surface; `.skeleton-line` has a one-em height. Layout, widths, gaps, image aspect ratios and the reserved height belong to the template. Skeletons are static, have no focus targets and should be `aria-hidden`. Use one readable status outside the busy area rather than announcing each decorative line.

Await `loadComponent(...)` **and** `editor.ready` before hiding the skeleton, revealing content and setting `aria-busy="false"`. Clear the busy state on errors too, show a readable retry/error message and keep space reserved. Guard asynchronous completion after navigation or destroy.

Placeholder CSS cannot infer a component's final dimensions. For stable layout, match its expected geometry, set image dimensions/aspect ratios, and load critical navigation/form shell styles before first paint. Do not briefly render raw textareas/selects and then replace them. Keep currently displayed content during background refreshes when possible. A minimum reserved height does not eliminate shifts when actual content exceeds it.

The [lazy editor example](../examples/lazy.html) demonstrates reserved space and readiness. There is no JavaScript instance or animation API. `ensureStyles('placeholder')` is supported when an application can load it ahead of showing the slot; it should not be the first request after the user already sees that slot.
