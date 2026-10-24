import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDataController, paginationPages } from '../src/js/data.js';
import { configurePure, getPureConfig } from '../src/js/config.js';

test('data: global defaults, local priority, query/sort/pageSize reset page and pass API parameters', async () => {
  const original = getPureConfig(); let controller;
  try {
    configurePure({ data: { pageSize: 7 } });
    const calls = [];
    controller = createDataController({ pageSize: 2, load: async args => { calls.push(args); return { items: [{ id: 1 }], total: 30 }; } });
    assert.equal(calls.length, 0);
    await controller.setPage(3); assert.equal(calls.at(-1).page, 3); assert.equal(calls.at(-1).pageSize, 2);
    await controller.setQuery('hello'); assert.equal(calls.at(-1).page, 1); assert.equal(calls.at(-1).query, 'hello');
    await controller.setSort({ key: 'name', direction: 'desc' }); assert.deepEqual(calls.at(-1).sort, { key: 'name', direction: 'desc' });
    await controller.setPageSize(5); assert.equal(calls.at(-1).page, 1); assert.equal(calls.at(-1).pageSize, 5);
    const snapshot = controller.getState(); snapshot.sort.key = 'bad'; snapshot.items.length = 0;
    assert.equal(controller.getState().sort.key, 'name'); assert.equal(controller.getState().items.length, 1);
    assert.throws(() => controller.setPage(0)); assert.throws(() => controller.setSort({ key: 'x', direction: 'bad' }));
  } finally { controller?.destroy(); configurePure(original); }
});
test('data: newest response wins even when API ignores abort, destroy blocks late completion', async () => {
  const tasks = [];
  const controller = createDataController({ load: args => new Promise(resolve => tasks.push({ ...args, resolve })) });
  const first = controller.reload(); const second = controller.setQuery('new');
  assert.equal(tasks[0].signal.aborted, true);
  tasks[1].resolve({ items: ['new'], total: 1 }); assert.equal(await second, true);
  tasks[0].resolve({ items: ['old'], total: 1 }); assert.equal(await first, false);
  assert.deepEqual(controller.getState().items, ['new']);
  let notifications = 0; controller.subscribe(() => notifications++);
  const pending = controller.reload(); const before = notifications; controller.destroy();
  tasks[2].resolve({ items: ['late'], total: 1 }); assert.equal(await pending, false);
  assert.equal(notifications, before); assert.equal(tasks[2].signal.aborted, true);
  assert.throws(() => controller.setPage(2));
});
test('data: disappeared page is clamped once and invalid/error responses retain previous items', async () => {
  let mode = 'normal'; const pages = [];
  const controller = createDataController({ pageSize: 2, load: async ({ page }) => {
    pages.push(page);
    if (mode === 'failure') throw new Error('HTTP 500');
    if (mode === 'invalid') return { items: [], total: -1 };
    if (mode === 'shrunk') return { items: page > 2 ? [] : ['kept'], total: 3 };
    return { items: ['original'], total: 10 };
  } });
  await controller.setPage(5); mode = 'shrunk'; await controller.reload();
  assert.deepEqual(pages.slice(-2), [5, 2]); assert.equal(controller.getState().page, 2);
  mode = 'failure'; assert.equal(await controller.reload(), false);
  assert.equal(controller.getState().status, 'error'); assert.deepEqual(controller.getState().items, ['kept']);
  mode = 'invalid'; await controller.reload(); assert.ok(controller.getState().error instanceof TypeError);
  controller.destroy();
});
test('data: empty response, unsubscribing and bounded correction', async () => {
  let calls = 0;
  const controller = createDataController({ page: 8, pageSize: 1, load: async () => ({ items: [], total: ++calls === 1 ? 5 : 0 }) });
  let notifications = 0; const unsubscribe = controller.subscribe(() => notifications++); unsubscribe();
  assert.equal(await controller.reload(), false); assert.equal(calls, 2); assert.equal(controller.getState().status, 'error'); assert.equal(notifications, 1);
  assert.equal(await controller.reload(), true); assert.equal(controller.getState().page, 1); assert.equal(controller.getState().pages, 1);
  controller.destroy();
});
test('pagination window keeps boundaries, fills single gaps and rejects invalid inputs', () => {
  assert.deepEqual(paginationPages(1, 1), [1]);
  assert.deepEqual(paginationPages(5, 10), [1, null, 4, 5, 6, null, 10]);
  assert.deepEqual(paginationPages(3, 5), [1, 2, 3, 4, 5]);
  assert.deepEqual(paginationPages(1, 1000000, 0), [1, null, 1000000]);
  assert.throws(() => paginationPages(0, 1)); assert.throws(() => paginationPages(2, 1)); assert.throws(() => paginationPages(1, 5, 11));
});
