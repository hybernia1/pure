import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ensureStyles, loadComponent } from '../src/js/lazy.js';

function documentFixture(failOnce = '') {
  const links = []; const requests = []; let failed = false;
  class Link extends EventTarget {
    dataset = {}; href = ''; sheet = null; isConnected = false;
    remove() { const index = links.indexOf(this); if (index >= 0) links.splice(index, 1); this.isConnected = false; }
  }
  const doc = {
    head: { append(link) {
      links.push(link); link.isConnected = true; requests.push(link.href);
      queueMicrotask(() => {
        if (!failed && failOnce && link.href.endsWith(failOnce)) { failed = true; link.dispatchEvent(new Event('error')); }
        else { link.sheet = {}; link.dispatchEvent(new Event('load')); }
      });
    } },
    querySelectorAll: () => [...links], createElement: () => new Link(),
  };
  return { doc, links, requests };
}

test('CSS loader deduplikuje souběh a odděluje dokumenty', async () => {
  const first = documentFixture();
  await Promise.all([ensureStyles('search', { document: first.doc }), ensureStyles(['search', 'controls'], { document: first.doc })]);
  assert.equal(new Set(first.requests).size, first.requests.length);
  const count = first.requests.length; await ensureStyles('search', { document: first.doc }); assert.equal(first.requests.length, count);
  const second = documentFixture(); await ensureStyles('search', { document: second.doc }); assert.equal(second.requests.length, count);
});

test('CSS loader umožní retry chyby a neopakuje hotové závislosti', async () => {
  const fixture = documentFixture('/progress.css');
  await assert.rejects(ensureStyles('progress', { document: fixture.doc }), /Could not load stylesheet/);
  assert.ok(!fixture.links.some(link => link.href.endsWith('/progress.css')));
  await ensureStyles('progress', { document: fixture.doc });
  assert.equal(fixture.requests.filter(href => href.endsWith('/progress.css')).length, 2);
  assert.equal(fixture.requests.filter(href => href.endsWith('/tokens.css')).length, 1);
});

test('Hotový full bundle se použije bez jednotlivých CSS a vadný cizí link neblokuje retry', async () => {
  const fixture = documentFixture('/progress.css');
  const link = fixture.doc.createElement('link'); link.href = new URL('../src/css/progress.css', import.meta.url).href; fixture.doc.head.append(link);
  await assert.rejects(ensureStyles('progress', { document: fixture.doc }));
  assert.ok(fixture.links.includes(link), 'Cizí link nesmí loader odstranit');
  await ensureStyles('progress', { document: fixture.doc });
  assert.ok(fixture.links.some(candidate => candidate !== link && candidate.href.endsWith('/progress.css') && candidate.sheet));
  const bundled = documentFixture(); const bundle = bundled.doc.createElement('link'); bundle.href = 'https://example.test/pure.css'; bundle.sheet = {}; bundle.isConnected = true; bundled.links.push(bundle);
  await ensureStyles('editor', { document: bundled.doc }); assert.equal(bundled.requests.length, 0);
});

test('Lazy JS lze načíst bez DOM se styles:false; neplatná jména se odmítají', async () => {
  const theme = await loadComponent('theme', { styles: false }); assert.equal(typeof theme.initTheme, 'function');
  assert.equal(typeof (await loadComponent('chart', { styles: false })).createChart, 'function');
  assert.equal(typeof (await loadComponent('renderer', { styles: false })).renderDocument, 'function');
  await assert.rejects(loadComponent('constructor', { styles: false }), TypeError);
  await assert.rejects(ensureStyles('constructor', { document: documentFixture().doc }), TypeError);
  for (const name of ['disclosure', 'ajax', 'forms', 'select', 'picker', 'modal', 'upload', 'resize', 'editor', 'media-library', 'search', 'flash', 'activity', 'progress', 'drag-drop', 'data', 'table', 'list', 'pagination', 'tabs', 'navigation']) assert.ok(Object.keys(await loadComponent(name, { styles: false })).length, name);
});

test('partial CSS bundles cover declared modules while missing styles remain lazy', async () => {
  const fixture=documentFixture();const bundle=fixture.doc.createElement('link');bundle.href='https://example.test/shell.css';bundle.dataset.pureStyles='tokens base components controls forms';bundle.sheet={};bundle.isConnected=true;fixture.links.push(bundle);
  await ensureStyles(['search','editor'],{document:fixture.doc});
  assert.ok(fixture.requests.some(href=>href.endsWith('/search.css')));assert.ok(fixture.requests.some(href=>href.endsWith('/editor.css')));
  assert.ok(!fixture.requests.some(href=>/\/(tokens|base|components|controls|forms)\.css$/.test(href)));
  const loading=documentFixture();const pending=loading.doc.createElement('link');pending.href='https://example.test/pending.css';pending.dataset.pureStyles='tokens base';loading.doc.head.append(pending);
  await ensureStyles('base',{document:loading.doc});assert.equal(loading.requests.length,1);
  const failed=documentFixture('/shell.css');const broken=failed.doc.createElement('link');broken.href='https://example.test/shell.css';broken.dataset.pureStyles='tokens base';failed.doc.head.append(broken);
  await assert.rejects(ensureStyles('base',{document:failed.doc}),/Could not load/);
  await ensureStyles('base',{document:failed.doc});assert.ok(failed.requests.some(href=>href.endsWith('/base.css')));
});
