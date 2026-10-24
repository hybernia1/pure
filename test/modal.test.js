import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createModal} from '../src/js/modal.js';
const style=()=>{const values=new Map();return {getPropertyValue:key=>values.get(key)?.[0]||'',getPropertyPriority:key=>values.get(key)?.[1]||'',setProperty(key,value,priority=''){values.set(key,[value,priority]);},removeProperty:key=>values.delete(key)};};
function fixture(){const doc={documentElement:{style:style()},activeElement:null};class Dialog extends EventTarget{tagName='DIALOG';ownerDocument=doc;style=style();open=false;querySelectorAll(){return [];}showModal(){if(this.fail)throw Error('Cannot open');this.open=true;}close(){if(!this.open)return;this.open=false;queueMicrotask(()=>this.dispatchEvent(new Event('close')));}}return {doc,dialog:()=>new Dialog()};}
test('nested modal locks survive individual close and restore exact inline styles',async()=>{
 const {doc,dialog}=fixture();const root=doc.documentElement.style;root.setProperty('overflow','scroll','important');root.setProperty('scrollbar-gutter','stable both-edges');
 const a=createModal(dialog()),b=createModal(dialog());a.open();b.open();assert.equal(root.getPropertyValue('overflow'),'hidden');
 a.close();assert.equal(root.getPropertyValue('overflow'),'hidden');b.close();assert.equal(root.getPropertyValue('overflow'),'scroll');assert.equal(root.getPropertyPriority('overflow'),'important');assert.equal(root.getPropertyValue('scrollbar-gutter'),'stable both-edges');assert.equal(root.getPropertyValue('overscroll-behavior'),'');
 await Promise.resolve();a.destroy();b.destroy();
});
test('queued close cannot unlock a reopened modal; native close, destroy and failures release locks',async()=>{
 const {doc,dialog}=fixture();const node=dialog();node.style.setProperty('overscroll-behavior','none','important');const modal=createModal(node);
 modal.open();node.close();modal.open();await Promise.resolve();assert.equal(doc.documentElement.style.getPropertyValue('overflow'),'hidden');
 node.close();await Promise.resolve();assert.equal(doc.documentElement.style.getPropertyValue('overflow'),'');
 modal.open();modal.destroy();assert.equal(doc.documentElement.style.getPropertyValue('overflow'),'');assert.equal(node.style.getPropertyValue('overscroll-behavior'),'none');assert.equal(node.style.getPropertyPriority('overscroll-behavior'),'important');
 const broken=dialog();broken.fail=true;const controller=createModal(broken);assert.throws(()=>controller.open());assert.equal(doc.documentElement.style.getPropertyValue('overflow'),'');controller.destroy();
});
