import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFlash } from '../src/js/flash.js';
import { configurePure } from '../src/js/config.js';

function fixture() {
  const doc = { activeElement: null, createElement: () => new Node() };
  class Node extends EventTarget {
    ownerDocument = doc; children = []; dataset = {}; attributes = {}; textContent = ''; hovered = false;
    append(...nodes) { for (const node of nodes) { node.parent = this; this.children.push(node); } }
    setAttribute(key, value) { this.attributes[key] = value; }
    remove() { this.parent.children = this.parent.children.filter(node => node !== this); }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    matches() { return this.hovered || this.contains(doc.activeElement); }
    focus() { doc.activeElement = this; }
  }
  const region = new Node(); return {region,doc};
}
test('flash timers expire independently, retain hovered messages and clean announcements',t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  configurePure({flash:{duration:5000}});
  const {region}=fixture();const flash=createFlash(region);
  try {
    const first=flash.show('First');t.mock.timers.tick(0);assert.equal(region.children[0].textContent,'First');
    t.mock.timers.tick(1000);flash.show('Second');t.mock.timers.tick(0);assert.equal(region.children[0].textContent,'Second');
    first();first();assert.equal(region.children[0].textContent,'Second','Older dismissal must not clear newer announcement');
    t.mock.timers.tick(4000);assert.equal(region.children.filter(node=>node.className==='flash').length,1);
    t.mock.timers.tick(1000);assert.equal(region.children.filter(node=>node.className==='flash').length,0);assert.equal(region.children[0].textContent,'');
    flash.show('Hovered',{duration:100});const item=region.children.at(-1);item.hovered=true;t.mock.timers.tick(100);assert.ok(region.children.includes(item));item.hovered=false;t.mock.timers.tick(1000);assert.ok(!region.children.includes(item));
    flash.show('Persistent error',{state:'error',duration:0});t.mock.timers.tick(10000);assert.equal(region.children[1].textContent,'Persistent error');
    flash.clear();assert.equal(region.children.length,2);assert.ok(region.children.every(node=>node.textContent===''));
    flash.show('Pending');flash.destroy();t.mock.timers.tick(10000);assert.equal(region.children.length,0);assert.throws(()=>flash.show('Late'));
  } finally {configurePure({flash:{duration:0}})}
});
test('manual flash dismissal returns focused close button to region',()=>{
 const {region,doc}=fixture();const flash=createFlash(region);const dismiss=flash.show('Saved');doc.activeElement=region.children.at(-1).children[1];dismiss();assert.equal(doc.activeElement,region);flash.destroy();
});
