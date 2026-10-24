import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyDocument, normalizeDocument, documentText, plainText, replaceText, formatText, selectionMarks, setHeading, setList, exitListItem } from '../src/js/editor-model.js';
import { editorStats } from '../src/js/editor-stats.js';
import { editorI18n, editorLocales } from '../src/js/editor-i18n.js';
import { normalizeMedia } from '../src/js/media-library.js';

test('underline and strike combine with italic, preserve offsets and normalize boolean marks',()=>{
  const input=normalizeDocument({version:1,blocks:[{type:'paragraph',children:[{text:'Hello world',italic:true}]}]});
  let value=formatText(input,0,5,'underline',true);value=formatText(value,0,5,'strike',true);
  assert.deepEqual(selectionMarks(value,0,5),{italic:true,underline:true,strike:true});
  assert.equal(selectionMarks(value,0,11).underline,undefined);
  const typed=replaceText(value,5,5,'!',{italic:true,underline:true,strike:true});assert.equal(typed.blocks[0].children[0].text,'Hello!');
  value=formatText(value,0,5,'underline',false);value=formatText(value,0,5,'strike',false);assert.deepEqual(value,input);
  assert.throws(()=>formatText(input,0,5,'underline','true'));
  assert.throws(()=>normalizeDocument({version:1,blocks:[{type:'paragraph',children:[{text:'x',strike:1}]}]}));
});

test('named text colors split and merge safely, survive edits and reject CSS values', () => {
  const value=normalizeDocument({version:1,blocks:[{type:'paragraph',children:[{text:'Hello world',bold:true}]}]});
  const colored=formatText(value,0,5,'color','blue');
  assert.deepEqual(colored.blocks[0].children,[{text:'Hello',bold:true,color:'blue'},{text:' world',bold:true}]);
  assert.equal(selectionMarks(colored,0,5).color,'blue');assert.equal(selectionMarks(colored,0,11).color,undefined);
  const typed=replaceText(colored,5,5,'!',{color:'blue',bold:true});assert.equal(typed.blocks[0].children[0].text,'Hello!');
  assert.deepEqual(formatText(colored,0,5,'color',null),value);
  const list=setList(colored,0,5,'bullet');assert.equal(list.blocks[0].items[0].children[0].color,'blue');
  for(const color of ['#fff','var(--evil)','unknown',null]) assert.throws(()=>normalizeDocument({version:1,blocks:[{type:'paragraph',children:[{text:'x',color}]}]}));
  assert.throws(()=>formatText(value,0,5,'color','#fff'));assert.equal(value.blocks[0].children.length,1);
});

test('seznamy zachovají formátování, řádky, sourozence a umí převod zpět na odstavce', () => {
  const input = normalizeDocument({ version: 1, blocks: [{ type: 'paragraph', children: [{ text: 'One', bold: true }] }, { type: 'paragraph', children: [{ text: 'Two' }] }] });
  const list = setList(input, 0, 7, 'ordered');
  assert.equal(input.blocks[0].type, 'paragraph');
  assert.deepEqual(list.blocks.map(block => [block.type, block.style]), [['list', 'ordered']]);
  assert.equal(list.blocks[0].items[0].children[0].bold, true);
  const split = replaceText(list, 1, 1, '\n');
  assert.equal(split.blocks.length, 1); assert.equal(split.blocks[0].items.length, 3);
  assert.equal(documentText(split), 'O\nne\nTwo');
  const formatted = formatText(list, 2, 6, 'italic', true);
  assert.equal(formatted.blocks[0].style, 'ordered'); assert.equal(formatted.blocks[0].items.length, 2);
  assert.equal(setHeading(list, 0, 0, 2).blocks[0].type, 'heading');
  assert.equal(setList(list, 0, 0, null).blocks[0].type, 'paragraph');
  assert.deepEqual(editorStats(list), { blocks: 1, words: 2, images: 0 });
  for (const bad of [{ type: 'list-item', children: [] }, { type: 'list-item', style: 'nested', children: [] }, { type: 'paragraph', style: 'bullet', children: [] }]) assert.throws(() => normalizeDocument({ version: 1, blocks: [bad] }));
  assert.throws(() => setList(input, 0, 2, 'bad'));
});

test('skutečný list blok drží hranice, migraci a ukončení prostřední položky', () => {
  const legacy = normalizeDocument({ version: 1, blocks: ['A', 'B', 'C'].map(text => ({ type: 'list-item', style: 'bullet', children: [{ text }] })) });
  assert.equal(legacy.blocks.length, 1); assert.equal(legacy.blocks[0].items.length, 3);
  const exited = exitListItem(legacy, 2);
  assert.deepEqual(exited.blocks.map(block => block.type), ['list', 'paragraph', 'list']);
  assert.equal(documentText(exited), 'A\nB\nC');
  const pair = normalizeDocument({ version: 1, blocks: [legacy.blocks[0], legacy.blocks[0]] });
  assert.equal(formatText(pair, 0, documentText(pair).length, 'italic', true).blocks.length, 2);
  assert.equal(replaceText(pair, 1, 1, 'X').blocks.length, 2);
  const merged = replaceText(legacy, 1, 2, '');
  assert.equal(merged.blocks.length, 1); assert.equal(merged.blocks[0].items.length, 2);
  assert.equal(documentText(merged), 'AB\nC');
  for (const block of [{ type: 'list', style: 'bullet', items: [] }, { type: 'list', style: 'ordered', items: [{ children: [], html: '<li>' }] }, { type: 'list', style: 'bad', items: [{ children: [] }] }]) assert.throws(() => normalizeDocument({ version: 1, blocks: [block] }));
});

test('mediaId je kompatibilní, validované a přežije textové operace', () => {
  const value = normalizeDocument({ version: 1, blocks: [{ type: 'paragraph', children: [{ text: 'Text' }] }, { type: 'image', src: '/image.webp', alt: 'Obrázek', mediaId: 0 }] });
  assert.equal(value.blocks[1].mediaId, 0);
  assert.equal(replaceText(value, 0, 1, 'X').blocks[1].mediaId, 0);
  assert.equal(formatText(value, 0, documentText(value).length, 'bold', true).blocks[1].mediaId, 0);
  assert.equal(normalizeDocument({ version: 1, blocks: [{ type: 'image', src: '/old.png', alt: '' }] }).blocks[0].mediaId, null);
  for (const mediaId of ['', ' ', {}, [], NaN, Infinity, true]) assert.throws(() => normalizeDocument({ version: 1, blocks: [{ type: 'image', src: '/a.png', alt: '', mediaId }] }), TypeError);
  assert.equal(normalizeMedia({ id: 0, src: '/a.png' }).id, 0);
  for (const item of [{ src: '/a.png' }, { id: 'a', src: 'data:image/png,bad' }, { id: {}, src: '/a.png' }]) assert.throws(() => normalizeMedia(item), TypeError);
});

test('statistiky počítají textové bloky a slova napříč běhy, bez alt a popisku', () => {
  const value = normalizeDocument({ version: 1, blocks: [{ type: 'heading', level: 2, children: [{ text: 'Hel' }, { text: 'lo', bold: true }, { text: ', světe! 2026.' }] }, { type: 'image', src: '/a.png', alt: 'Mnoho slov navíc', caption: 'Další slova' }, { type: 'paragraph', children: [] }] });
  assert.deepEqual(editorStats(value, 'cs'), { blocks: 3, words: 3, images: 1 });
  assert.deepEqual(editorStats(emptyDocument()), { blocks: 1, words: 0, images: 0 });
  assert.equal(editorStats(value, '!invalid').words, 3);
});

test('i18n přebírá jazyk dokumentu, region, fallback a vlastní překlady', () => {
  const doc = { documentElement: { lang: 'cs-CZ' } };
  assert.equal(editorI18n(doc).t('paragraph'), 'Odstavec');
  assert.equal(editorI18n(doc, { locale: 'en' }).t('paragraph'), 'Paragraph');
  assert.equal(editorI18n(doc, { locale: 'fr', messages: { words: 'Mots : {count}' } }).t('words', { count: 4 }), 'Mots : 4');
  assert.equal(editorI18n(doc, { locale: 'fr' }).t('paragraph'), 'Paragraph');
  assert.deepEqual(Object.keys(editorLocales.cs).sort(), Object.keys(editorLocales.en).sort());
});
test('nadpisy a obrázky přežijí textové úpravy a zachovají čistý JSON', () => {
  const value = normalizeDocument({ version: 1, blocks: [
    { type: 'heading', level: 2, children: [{ text: 'Nadpis' }] },
    { type: 'image', src: '/image.png', alt: 'Ukázka', width: 50, align: 'right' },
    { type: 'paragraph', children: [{ text: 'Text' }] },
  ] });
  const next = replaceText(value, 1, 2, 'X');
  assert.equal(next.blocks[0].type, 'heading'); assert.equal(next.blocks[0].level, 2);
  assert.deepEqual(next.blocks[1], value.blocks[1]);
  assert.deepEqual(formatText(next, 0, documentText(next).length, 'bold', true).blocks[1], value.blocks[1]);
  assert.equal(plainText(value), 'Nadpis\nUkázka\nText');
  assert.equal(setHeading(value, 9, 13, 3).blocks[2].type, 'heading');
  for (const src of ['javascript:alert(1)', 'data:image/svg+xml,bad', 'blob:temporary', 'mailto:test@example.com']) assert.throws(() => normalizeDocument({ version: 1, blocks: [{ type: 'image', src, alt: '' }] }), TypeError);
});

test('JSON model normalizuje běhy a odděluje data od vstupního objektu', () => {
  const input = { version: 1, blocks: [{ type: 'paragraph', children: [{ text: 'A', bold: true }, { text: 'B', bold: true }, { text: '', italic: true }] }] };
  const value = normalizeDocument(input);
  assert.deepEqual(value.blocks[0].children, [{ text: 'AB', bold: true }]);
  value.blocks[0].children[0].text = 'Z'; assert.equal(input.blocks[0].children[0].text, 'A');
});
test('schéma odmítá HTML, cizí vlastnosti, verze a nebezpečné odkazy', () => {
  for (const input of ['<p>text</p>', { version: 2, blocks: [] }, { version: 1, blocks: [], html: '<p>x</p>' }, { version: 1, blocks: [{ type: 'paragraph', children: [{ text: 'x', html: '<b>x</b>' }] }] }, { version: 1, blocks: [{ type: 'paragraph', children: [{ text: 'x', link: 'javascript:alert(1)' }] }] }]) assert.throws(() => normalizeDocument(input), TypeError);
  const literal = replaceText(emptyDocument(), 0, 0, '<script>alert(1)</script>');
  assert.equal(documentText(literal), '<script>alert(1)</script>');
});
test('formátování rozdělí pouze vybraný text a umí ho odstranit', () => {
  const original = replaceText(emptyDocument(), 0, 0, 'Ahoj světe');
  const bold = formatText(original, 0, 4, 'bold', true);
  assert.deepEqual(bold.blocks[0].children, [{ text: 'Ahoj', bold: true }, { text: ' světe' }]);
  assert.deepEqual(selectionMarks(bold, 0, 4), { bold: true });
  assert.deepEqual(selectionMarks(bold, 0, 6), {});
  assert.deepEqual(formatText(bold, 1, 3, 'bold', false).blocks[0].children, [{ text: 'A', bold: true }, { text: 'ho' }, { text: 'j', bold: true }, { text: ' světe' }]);
  assert.equal(original.blocks[0].children.length, 1);
});
test('vkládání a mazání přes odstavce zachová okolní formátování', () => {
  let value = replaceText(emptyDocument(), 0, 0, 'První\r\nDruhý');
  value = formatText(value, 0, 5, 'bold', true);
  value = replaceText(value, 3, 8, 'X\nY', { italic: true });
  assert.equal(documentText(value), 'PrvX\nYuhý');
  assert.deepEqual(value.blocks[0].children, [{ text: 'Prv', bold: true }, { text: 'X', italic: true }]);
  const empty = replaceText(value, 0, documentText(value).length, '');
  assert.deepEqual(empty, emptyDocument());
});
test('odkazy se upravují jako atribut textu a rozsahy se kontrolují', () => {
  const value = replaceText(emptyDocument(), 0, 0, 'Pure');
  const linked = formatText(value, 0, 4, 'link', '/docs');
  assert.deepEqual(selectionMarks(linked, 0, 4), { link: '/docs' });
  assert.deepEqual(formatText(linked, 0, 4, 'link', null), value);
  assert.throws(() => replaceText(value, 0, 99, 'x'), RangeError);
});
