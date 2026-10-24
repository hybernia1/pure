# Charts

Dependency-free responsive SVG line and grouped bar charts. Load only when needed:

```js
import { loadComponent } from './pure/js/lazy.js';
const { createChart } = await loadComponent('chart');
const chart = createChart(document.querySelector('#visits'), {
  labels: ['Mon', 'Tue', 'Wed'],
  series: [
    { name: 'Visits', values: [120, 180, 150] },
    { name: 'Previous week', values: [90, null, 130] },
  ],
}, { title: 'Weekly visits', area: true });
```

`createChart(target, data, options)` appends an owned figure and returns `{element, update(data), getData(), destroy()}`. Updates replace the complete dataset. Invalid data leaves the previous view intact. `getData()` returns a detached copy. Destroy removes only the owned figure; updating after destroy throws.

Data is `{labels: string[], series: {name: string, values: (number|null)[]}[]}`. Labels and series must be nonempty; every series needs a nonblank name and one value per label. Numbers must be finite with absolute value at most `1e100`. Negative values are supported. `null` represents missing data: lines break and bars are omitted. All missing or zero values use a 0–1 axis. `normalizeChart(data)` validates and returns a detached copy without accessing the DOM.

Options:

| Option | Default | Meaning |
| --- | --- | --- |
| `title` | `Chart` | Figure caption and SVG accessible name |
| `description` | empty | Visible context and SVG description |
| `type` | `line` | `line` or grouped `bar` |
| `area` | `false` | Fill beneath line segments to zero |
| `locale` | document / global locale | Number formatting and shared UI language |
| `messages` | shared cs/en dictionary | Instance translation overrides for `chart`, `chartData`, `chartLabel` |
| `formatValue` | Intl formatter | Synchronous `(number) => text`, for ticks, titles and table |
| `dataLabel` | `View data` | Expandable data table label |
| `columnLabel` | `Label` | Table's first column heading |

The chart includes a legend, SVG titles and a keyboard-accessible native details/table view with every value. It does not depend on hover or animation. A ResizeObserver adapts SVG geometry and label density to the container, preserving readable text and the expanded table state; destroy disconnects it. Without ResizeObserver, geometry updates when you call `update`. Hidden containers use a fallback width until visible. Line patterns distinguish series in addition to color. Four token colors/patterns repeat for additional series; use a small number of series for clarity. Dense x-axis labels are sampled; the data table preserves all labels. Keep labels and formatted values short to fit the SVG axes.

Override `--p-chart-1` through `--p-chart-4` on a parent or `.chart`. Defaults use semantic action, subtle, info and success tokens, so light/dark and custom schemes work automatically. No chart interaction, network request, aggregation or date parsing is implicit. Applications supply data and drive period/filter controls through `update`.

Direct imports use `js/chart.js` plus tokens/base and `css/chart.css`. See the [live example](../examples/content-chart.html).
