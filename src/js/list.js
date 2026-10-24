import { createDataView, appendValue } from './data-view.js';

export function createList(target, options = {}) {
  const { renderItem, layout = 'rows', label } = options;
  if (typeof renderItem !== 'function' || !['rows', 'cards'].includes(layout)) throw new TypeError('List requires renderItem and rows or cards layout.');
  return createDataView(target, options, ({ doc, root, t }) => {
    const list = doc.createElement('ul'); list.className = `data-list data-list-${layout}`; list.setAttribute('aria-label', label || t('dataList')); root.append(list);
    return { render(state) {
      if (state.status !== 'ready') return;
      const fragment = doc.createDocumentFragment();
      for (const item of state.items) { const row = doc.createElement('li'); appendValue(row, renderItem(item, doc)); fragment.append(row); }
      list.replaceChildren(fragment);
    } };
  });
}
