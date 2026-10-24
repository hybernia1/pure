import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createChart, normalizeChart } from '../src/js/chart.js';
import { createRenderer, renderDocument } from '../src/js/renderer.js';

// Minimal DOM tree for structural/security checks; real browser coverage is in content-chart.html.
function fixture() {
  class Node {
    constructor(tag, text = '') { this.tag = tag; this.children = []; this.attrs = {}; this.dataset = {}; this.text = text; this.ownerDocument = doc; }
    append(...nodes) { for (const node of nodes) { if (node.tag === '#fragment') this.append(...node.children); else { node.parent = this; this.children.push(node); } } }
    replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
    setAttribute(name, value) { this.attrs[name] = String(value); }
    set textContent(value) { this.text = String(value); this.children = []; }
    get textContent() { return this.text + this.children.map(child => child.textContent).join(''); }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
  }
  const doc = { createElement: tag => new Node(tag), createElementNS: (_, tag) => new Node(tag), createTextNode: text => new Node('#text', text), createDocumentFragment: () => new Node('#fragment') };
  return { doc, target: doc.createElement('main') };
}
const find = (node, tag) => [ ...(node.tag === tag ? [node] : []), ...node.children.flatMap(child => find(child, tag)) ];
const data = () => ({labels:['A','B','C'],series:[{name:'First',values:[-10,null,20]},{name:'Second',values:[0,5,10]}]});

test('chart data rejects non-finite/mismatched values and detaches arrays',()=>{
  const original=data();const copy=normalizeChart(original);original.series[0].values[0]=100;assert.equal(copy.series[0].values[0],-10);
  for(const value of [NaN,Infinity,'2',undefined,1e101]) assert.throws(()=>normalizeChart({labels:['A'],series:[{name:'Test',values:[value]}]}),TypeError);
  assert.throws(()=>normalizeChart({labels:['A'],series:[{name:'Test',values:[]}]}));
  assert.throws(()=>normalizeChart({labels:['A'],series:[{name:'Test',values:Array(1)}]}));
});
test('chart adapts geometry to its container and disconnects its observer',()=>{
  const {doc,target}=fixture();let notify;let disconnected=false;
  doc.defaultView={ResizeObserver:class {constructor(callback){notify=callback}observe(){}disconnect(){disconnected=true}}};
  target.clientWidth=720;const chart=createChart(target,data());
  chart.element.clientWidth=390;notify();assert.equal(find(chart.element,'svg')[0].attrs.viewBox,'0 0 390 280');
  const retained=chart.element.children;notify();assert.equal(chart.element.children,retained);
  chart.destroy();assert.ok(disconnected);notify();assert.equal(target.children.length,0);
});
test('chart renders gaps, zero baseline, exact accessible data and atomic updates',()=>{
  const {target}=fixture();const chart=createChart(target,data(),{title:'<script>plain text</script>',area:true});
  assert.equal(find(chart.element,'script').length,0);
  assert.equal(find(chart.element,'table').length,1);
  assert.equal(find(chart.element,'td').length,6);
  assert.equal(find(chart.element,'td')[2].textContent,'—');
  const paths=find(chart.element,'path').filter(node=>node.attrs.class==='chart-line');assert.equal(paths.length,3);
  const old=chart.element.textContent;assert.throws(()=>chart.update({}));assert.equal(chart.element.textContent,old);
  chart.update({labels:['Only'],series:[{name:'Zero',values:[0]}]});
  assert.ok(!JSON.stringify(chart.element.attrs).includes('NaN'));
  const result=chart.getData();result.labels[0]='Changed';assert.equal(chart.getData().labels[0],'Only');
  chart.destroy();assert.equal(target.children.length,0);assert.throws(()=>chart.update(data()));
});
test('negative bars have finite positive geometry, with labels centered over groups',()=>{
  const {target}=fixture();const chart=createChart(target,data(),{type:'bar'});
  const bars=find(chart.element,'rect');assert.equal(bars.length,5);
  for(const bar of bars)for(const key of ['x','y','width','height'])assert.ok(Number.isFinite(Number(bar.attrs[key])));
  assert.ok(bars.every(bar=>Number(bar.attrs.height)>=0));assert.throws(()=>createChart(target,data(),{type:'pie'}));
});
const documentValue=()=>({version:1,blocks:[{type:'paragraph',children:[{text:'<img onerror=alert(1)>',bold:true,italic:true,link:'/safe'}]},{type:'list',style:'ordered',items:[{children:[{text:'One'}]},{children:[{text:'Two'}]}]},{type:'image',src:'/image.png',alt:'<alt>',mediaId:42,width:50,align:'right',caption:'A caption'}]});
test('renderer preserves semantics and media IDs without parsing strings as markup',()=>{
  const {doc,target}=fixture();const preserved=doc.createElement('aside');target.append(preserved);
  const renderer=createRenderer(target,documentValue());
  assert.equal(find(renderer.element,'strong').length,1);assert.equal(find(renderer.element,'em').length,1);assert.equal(find(renderer.element,'ol').length,1);assert.equal(find(renderer.element,'li').length,2);
  const image=find(renderer.element,'img')[0];assert.equal(image.attrs.alt,'<alt>');assert.equal(image.attrs.src,'/image.png');assert.equal(find(renderer.element,'figure')[0].dataset.mediaId,'42');
  assert.equal(find(renderer.element,'a')[0].attrs.href,'/safe');
  const old=renderer.element.textContent;const invalid=documentValue();invalid.blocks[2].src='javascript:alert(1)';assert.throws(()=>renderer.update(invalid));assert.equal(renderer.element.textContent,old);
  const badLink=documentValue();badLink.blocks[0].children[0].link='data:text/html,evil';assert.throws(()=>renderDocument(badLink,{document:doc}));
  const copy=renderer.getJSON();copy.blocks[0].children[0].text='Mutated';assert.notEqual(renderer.getJSON().blocks[0].children[0].text,'Mutated');
  renderer.destroy();assert.deepEqual(target.children,[preserved]);assert.throws(()=>renderer.update(documentValue()));
});
