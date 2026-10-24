import {distRoot} from './distribution.js';
const {loadComponent}=await import(`${distRoot}js/lazy.js`);
const {createEditor}=await loadComponent('editor');
const fixture=document.querySelector('#fixture');let passed=0,failed=0;
const assert=(value,message)=>{if(!value)throw Error(message)};
const paragraph=text=>({type:'paragraph',children:[{text}]});
const model=blocks=>({version:1,blocks});
const image={type:'image',src:'/src/icons.svg',alt:'Alt text is not counted',mediaId:12,width:50,align:'center'};
function counts(editor,expected){const actual=editor.getStats();for(const key of ['blocks','words','images']){assert(actual[key]===expected[key],`${key} API: ${actual[key]}`);const text=fixture.querySelector(`[data-editor-count="${key}"]`).textContent;assert(Number(text.match(/\d+/)?.[0])===expected[key],`${key} footer: ${text}`)}}
async function test(name,blocks,run){const row=document.createElement('li');document.querySelector('#results').append(row);const source=document.createElement('textarea');source.value=JSON.stringify(model(blocks));fixture.append(source);const editor=createEditor(source,{locale:'en',features:{colors:true,images:false},colors:{blue:'Blue'}});try{await editor.ready;await run(editor);row.textContent=`PASS: ${name}`;passed++}catch(error){row.textContent=`FAIL: ${name}: ${error.message}`;failed++}finally{editor.destroy();fixture.replaceChildren()}}
await test('Formatting changes DOM marks, reuses other blocks and leaves counters intact',[paragraph('Alpha beta'),image,paragraph('Gamma')],editor=>{
 const footer=fixture.querySelector('.editor-footer'),counter=footer.firstChild,text=fixture.querySelector('[data-editor-text]').firstChild,untouched=fixture.querySelectorAll('[data-editor-text]')[1].firstChild,figure=fixture.querySelector('[data-editor-image]');
 const range=document.createRange();range.setStart(text,0);range.setEnd(text,5);getSelection().removeAllRanges();getSelection().addRange(range);document.dispatchEvent(new Event('selectionchange'));
 for(const mark of ['bold','italic','underline','strike'])editor.command(mark);editor.command('link','/docs');editor.command('color','blue');
 const changed=fixture.querySelector('[data-editor-text]');for(const tag of ['strong','em','u','s','a'])assert(changed.querySelector(tag),`Missing ${tag}`);assert(changed.querySelector('[data-text-color="blue"]'),'Color changed');
 assert(footer.firstChild===counter,'Unchanged footer reused');assert(fixture.querySelectorAll('[data-editor-text]')[1].firstChild===untouched,'Other text node reused');assert(fixture.querySelector('[data-editor-image]')===figure,'Image reused');counts(editor,{blocks:3,words:3,images:1});
 editor.command('undo');assert(!changed.querySelector('[data-text-color]'),'Color undo repaints');editor.command('redo');assert(changed.querySelector('[data-text-color="blue"]'),'Color redo repaints');assert(footer.firstChild===counter,'History keeps unchanged counters');
});
await test('Text changes invalidate cached words',[paragraph('One')],editor=>{counts(editor,{blocks:1,words:1,images:0});editor.setJSON(model([paragraph('One two three')]));counts(editor,{blocks:1,words:3,images:0});editor.setJSON(model([paragraph('')]));counts(editor,{blocks:1,words:0,images:0})});
await test('Equal text with a different block structure refreshes block count',[paragraph('One'),paragraph('Two')],editor=>{counts(editor,{blocks:2,words:2,images:0});editor.setJSON(model([{type:'list',style:'bullet',items:[{children:[{text:'One'}]},{children:[{text:'Two'}]}]}]));counts(editor,{blocks:1,words:2,images:0})});
await test('Image count changes even when document text uses the same placeholder',[paragraph('\ufffc')],editor=>{counts(editor,{blocks:1,words:0,images:0});editor.setJSON(model([image]));counts(editor,{blocks:1,words:0,images:1});editor.setJSON(model([paragraph('\ufffc')]));counts(editor,{blocks:1,words:0,images:0})});
await test('Active block follows selection and full document replacement',[paragraph('One'),paragraph('Two')],editor=>{
 const rows=fixture.querySelectorAll('[data-editor-text]'),old=fixture.querySelector('[data-active]');const range=document.createRange();range.selectNodeContents(rows[1]);getSelection().removeAllRanges();getSelection().addRange(range);document.dispatchEvent(new Event('selectionchange'));
 assert(!old.hasAttribute('data-active'),'Previous active block cleared');assert(rows[1].closest('[data-editor-block]').hasAttribute('data-active'),'Selection activates second block');
 editor.setJSON(model([paragraph('Replacement')]));assert(fixture.querySelectorAll('[data-editor-block][data-active]').length===1,'Replacement has exactly one active block');assert(fixture.querySelector('[data-active] [data-editor-text]').textContent==='Replacement','Replacement is active');
});
document.querySelector('#summary').textContent=`${passed} passed, ${failed} failed`;document.documentElement.dataset.testResult=failed?'fail':'pass';
