const segmenters = new Map();
export function editorStats(value, locale = 'en') {
  const parts = []; let images = 0;
  for (const block of value.blocks) {
    if (block.type === 'image') images++;
    else parts.push(block.children.map(run => run.text).join(''));
  }
  const text = parts.join('\n'); let words = 0;
  if (typeof Intl.Segmenter === 'function') {
    let segmenter = segmenters.get(locale);
    if (!segmenter) {
      try { segmenter = new Intl.Segmenter(locale, { granularity: 'word' }); } catch { segmenter = new Intl.Segmenter('en', { granularity: 'word' }); }
      if (segmenters.size >= 8) segmenters.delete(segmenters.keys().next().value);
      segmenters.set(locale, segmenter);
    }
    for (const part of segmenter.segment(text)) if (part.isWordLike) words++;
  } else words = (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || []).length;
  return { blocks: value.blocks.length, words, images };
}
