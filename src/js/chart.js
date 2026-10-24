import { uiI18n } from './i18n.js';
const ns = 'http://www.w3.org/2000/svg';

/** Detached, finite chart data. Null values create gaps instead of misleading zeroes. */
export function normalizeChart(value) {
  if (!value || !Array.isArray(value.labels) || !value.labels.length || !Array.from(value.labels).every(label => typeof label === 'string') || !Array.isArray(value.series) || !value.series.length) throw new TypeError('Chart requires labels and series.');
  const labels = [...value.labels];
  const series = Array.from(value.series, item => {
    if (!item || typeof item.name !== 'string' || !item.name.trim() || !Array.isArray(item.values) || item.values.length !== labels.length || !Array.from(item.values).every(number => number === null || typeof number === 'number' && Number.isFinite(number) && Math.abs(number) <= 1e100)) throw new TypeError('Invalid chart series.');
    return { name: item.name, values: [...item.values] };
  });
  return { labels, series };
}

export function createChart(target, data, { title, description = '', type = 'line', area = false, locale, messages, formatValue, dataLabel, columnLabel } = {}) {
  if (!['line', 'bar'].includes(type) || typeof formatValue !== 'function' && formatValue !== undefined) throw new TypeError('Invalid chart options.');
  const doc = target.ownerDocument; const root = doc.createElement('figure'); root.className = 'chart';
  const i18n = uiI18n(doc, { locale, messages }); locale = i18n.locale;
  title ??= i18n.t('chart'); dataLabel ??= i18n.t('chartData'); columnLabel ??= i18n.t('chartLabel');
  const format = formatValue || (value => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value));
  const html = (tag, text) => { const node = doc.createElement(tag); if (text !== undefined) node.textContent = text; return node; };
  const svgNode = (tag, attrs = {}, text) => { const node = doc.createElementNS(ns, tag); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value)); if (text !== undefined) node.textContent = text; return node; };
  let model; let destroyed = false; let renderedWidth;
  const measure = () => Math.max(320, Math.round(root.clientWidth || target.clientWidth || 720));
  function update(next) {
    if (destroyed) throw new Error('Chart is destroyed.');
    const normalized = normalizeChart(next); const fragment = doc.createDocumentFragment();
    const width = measure(); const span = width - 80; const expanded = root.querySelector?.('details')?.open || false;
    const caption = html('figcaption', title); caption.className = 'chart-title'; fragment.append(caption);
    if (description) fragment.append(html('p', description));
    const svg = svgNode('svg', { viewBox: `0 0 ${width} 280`, role: 'img', 'aria-label': title, class: 'chart-svg' });
    svg.append(svgNode('title', {}, title), svgNode('desc', {}, description || dataLabel));
    const values = normalized.series.flatMap(series => series.values.filter(value => value !== null));
    const low = values.reduce((min, value) => Math.min(min, value), 0); const high = values.reduce((max, value) => Math.max(max, value), 0); const range = high - low || 1;
    const y = value => 230 - (value - low) / range * 200;
    const x = index => type === 'bar' ? 64 + (index + .5) * span / normalized.labels.length : 64 + (normalized.labels.length === 1 ? span / 2 : index * span / (normalized.labels.length - 1));
    for (let tick = 0; tick <= 4; tick++) {
      const value = low + range * tick / 4; const py = y(value);
      svg.append(svgNode('line', { x1: 64, x2: width - 16, y1: py, y2: py, class: 'chart-grid' }), svgNode('text', { x: 56, y: py + 4, 'text-anchor': 'end', class: 'chart-label' }, String(format(value))));
    }
    if (low < 0 && high > 0) svg.append(svgNode('line', { x1: 64, x2: width - 16, y1: y(0), y2: y(0), class: 'chart-zero' }));
    const stride = Math.max(1, Math.ceil(normalized.labels.length / Math.max(2, Math.floor(span / 64))));
    normalized.labels.forEach((label, index) => { if (index % stride === 0 || index === normalized.labels.length - 1) svg.append(svgNode('text', { x: x(index), y: 258, 'text-anchor': 'middle', class: 'chart-label' }, label)); });
    const legend = html('ul'); legend.className = 'chart-legend';
    normalized.series.forEach((series, seriesIndex) => {
      const group = svgNode('g', { 'data-series': seriesIndex % 4 }); const dash = ['', '7 4', '2 4', '9 3 2 3'][seriesIndex % 4];
      if (type === 'bar') {
        const slot = span / normalized.labels.length; const width = Math.min(40, slot * .75 / normalized.series.length);
        series.values.forEach((value, index) => { if (value === null) return; const center = x(index); const bar = svgNode('rect', { x: center - width * normalized.series.length / 2 + seriesIndex * width, y: Math.min(y(0), y(value)), width, height: Math.abs(y(value) - y(0)), class: 'chart-bar' }); bar.append(svgNode('title', {}, `${series.name}, ${normalized.labels[index]}: ${format(value)}`)); group.append(bar); });
      } else {
        let segment = [];
        const flush = () => { if (!segment.length) return; const path = segment.map(([px, py], index) => `${index ? 'L' : 'M'}${px},${py}`).join(' '); if (area) group.append(svgNode('path', { d: `${path} L${segment.at(-1)[0]},${y(0)} L${segment[0][0]},${y(0)} Z`, class: 'chart-area' })); group.append(svgNode('path', { d: path, class: 'chart-line', 'stroke-dasharray': dash })); segment = []; };
        series.values.forEach((value, index) => { if (value === null) { flush(); return; } segment.push([x(index), y(value)]); }); flush();
        series.values.forEach((value, index) => { if (value === null) return; const point = svgNode('circle', { cx: x(index), cy: y(value), r: 3, class: 'chart-point' }); point.append(svgNode('title', {}, `${series.name}, ${normalized.labels[index]}: ${format(value)}`)); group.append(point); });
      }
      svg.append(group); const item = html('li'); item.dataset.series = String(seriesIndex % 4); const swatch = html('span'); swatch.className = 'chart-swatch'; swatch.setAttribute('aria-hidden', 'true'); item.append(swatch, doc.createTextNode(series.name)); legend.append(item);
    });
    fragment.append(svg, legend);
    const details = html('details'); details.append(html('summary', dataLabel)); const scroll = html('div'); scroll.className = 'chart-data'; const table = html('table'); table.append(html('caption', title)); const head = html('thead'); const row = html('tr');
    for (const label of [columnLabel, ...normalized.series.map(series => series.name)]) { const cell = html('th', label); cell.setAttribute('scope', 'col'); row.append(cell); } head.append(row); table.append(head); const body = html('tbody');
    normalized.labels.forEach((label, index) => { const row = html('tr'); const heading = html('th', label); heading.setAttribute('scope', 'row'); row.append(heading); for (const series of normalized.series) row.append(html('td', series.values[index] === null ? '—' : String(format(series.values[index])))); body.append(row); }); table.append(body); scroll.append(table); details.append(scroll); fragment.append(details);
    details.open = expanded; root.replaceChildren(fragment); model = normalized; renderedWidth = width;
  }
  update(data); target.append(root);
  const Observer = doc.defaultView?.ResizeObserver;
  const observer = Observer ? new Observer(() => { if (!destroyed && measure() !== renderedWidth) update(model); }) : null;
  observer?.observe(root);
  return { element: root, update, getData: () => normalizeChart(model), destroy() { destroyed = true; observer?.disconnect(); root.remove(); } };
}
