import {test} from 'node:test';import assert from 'node:assert/strict';
import {getPreloadUrls,preloadComponents} from '../src/js/preload.js';
const manifest={version:1,components:{editor:['js/editor.js','js/shared.js'],modal:['js/modal.js','js/shared.js'],select:['js/select.js']}};
test('preload plans are explicit, ordered and deduplicated without a DOM',()=>{
 assert.deepEqual(getPreloadUrls(['editor','modal'],{manifest,baseUrl:'https://example.test/pure/'}),['https://example.test/pure/js/editor.js','https://example.test/pure/js/shared.js','https://example.test/pure/js/modal.js']);
 assert.throws(()=>getPreloadUrls('editor',{manifest,baseUrl:'https://example.test/pure'}));
 assert.throws(()=>getPreloadUrls('unknown',{manifest,baseUrl:'https://example.test/pure/'}));
 assert.throws(()=>getPreloadUrls('editor',{manifest:{version:1,components:{editor:['../escape.js']}}}));
});
test('preload hints reuse existing links and invalid requests are atomic',()=>{
 const links=[];const doc={baseURI:'https://example.test/app/',head:{append:link=>links.push(link)},querySelectorAll:()=>links,createElement:()=>({})};
 const options={manifest,document:doc,baseUrl:'/pure/'};
 const first=preloadComponents('editor',options);assert.equal(links.length,2);assert.equal(first[0].href,'https://example.test/pure/js/editor.js');
 assert.equal(preloadComponents('editor',options)[0],first[0]);assert.equal(links.length,2);
 assert.throws(()=>preloadComponents(['modal','unknown'],options));assert.equal(links.length,2);
 preloadComponents('select',options);assert.equal(links.length,3);
});
