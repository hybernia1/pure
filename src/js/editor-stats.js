export function editorStats(value, locale = 'en') {
  const text = value.blocks.filter(block => block.type !== 'image').map(block => block.children.map(run => run.text).join('')).join('\n');
  let words;
  if (typeof Intl.Segmenter === 'function') {
    let segmenter; try { segmenter = new Intl.Segmenter(locale, { granularity: 'word' }); } catch { segmenter = new Intl.Segmenter('en', { granularity: 'word' }); }
    words = [...segmenter.segment(text)].filter(part => part.isWordLike).length;
  } else words = (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || []).length;
  return { blocks: value.blocks.length, words, images: value.blocks.filter(block => block.type === 'image').length };
}
