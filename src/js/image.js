const abort = signal => { if (signal?.aborted) throw new DOMException('Image preparation canceled.', 'AbortError'); };
const positive = value => Number.isSafeInteger(value) && value > 0;

/** Browser-only, opt-in raster preparation. Never uploads or mutates the source. */
export async function prepareImage(file, {
  maxWidth = 2560, maxHeight = 2560, maxBytes = 5 * 1024 * 1024,
  maxInputBytes = 40 * 1024 * 1024, maxPixels = 40_000_000,
  type = 'image/webp', quality = .85, minQuality = .5, signal,
} = {}) {
  if (!(file instanceof Blob) || !['image/jpeg', 'image/png'].includes(file.type)) throw new TypeError('Prepare JPEG or PNG images only; animated and unsupported formats must be handled explicitly.');
  if (![maxWidth, maxHeight, maxBytes, maxInputBytes, maxPixels].every(positive) || !['image/jpeg', 'image/png', 'image/webp'].includes(type) || !Number.isFinite(quality) || !Number.isFinite(minQuality) || minQuality <= 0 || quality > 1 || minQuality > quality) throw new TypeError('Invalid image preparation limits.');
  if (file.size > maxInputBytes) throw new RangeError('Image exceeds the input byte limit.');
  abort(signal);
  const bytes = new Uint8Array(await file.arrayBuffer()); const view = new DataView(bytes.buffer);
  let dimensions;
  if (file.type === 'image/png') {
    if (bytes.length < 33 || [137, 80, 78, 71, 13, 10, 26, 10].some((byte, i) => bytes[i] !== byte) || String.fromCharCode(...bytes.subarray(12, 16)) !== 'IHDR') throw new TypeError('Invalid PNG header.');
    dimensions = [view.getUint32(16), view.getUint32(20)];
  } else {
    if (bytes[0] !== 255 || bytes[1] !== 216) throw new TypeError('Invalid JPEG header.');
    for (let at = 2; at + 3 < bytes.length;) {
      if (bytes[at++] !== 255) break;
      while (bytes[at] === 255) at++;
      const marker = bytes[at++];
      if (marker === 218 || marker === 217 || at + 2 > bytes.length) break;
      if (marker === 1 || marker >= 208 && marker <= 215) continue;
      const size = view.getUint16(at); if (size < 2 || at + size > bytes.length) break;
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker) && size >= 8) { dimensions = [view.getUint16(at + 5), view.getUint16(at + 3)]; break; }
      at += size;
    }
    if (!dimensions) throw new TypeError('Unsupported or invalid JPEG header.');
  }
  if (dimensions.some(value => !value) || dimensions[0] * dimensions[1] > maxPixels) throw new RangeError('Image exceeds the pixel limit.');
  // APNG would silently lose animation in a canvas. Reject it explicitly.
  if (file.type === 'image/png') {
    for (let at = 8; at + 12 <= bytes.length;) {
      const size = view.getUint32(at); if (at + size + 12 > bytes.length) throw new TypeError('Invalid PNG.');
      const chunk = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
      if (chunk === 'acTL') throw new TypeError('Animated PNG preparation is not supported.');
      if (chunk === 'IDAT' || chunk === 'IEND') break;
      at += size + 12;
    }
    if (type === 'image/jpeg') throw new TypeError('PNG to JPEG requires an explicit application flattening policy. Use PNG or WebP.');
  }
  abort(signal);
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  let canvas;
  try {
    abort(signal);
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > maxPixels) throw new RangeError('Image exceeds the decoded pixel limit.');
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    let width = Math.max(1, Math.floor(bitmap.width * scale)); let height = Math.max(1, Math.floor(bitmap.height * scale));
    canvas = document.createElement('canvas');
    for (let sizeAttempt = 0; sizeAttempt < 8; sizeAttempt++) {
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas is unavailable.');
      context.drawImage(bitmap, 0, 0, width, height);
      const attempts = type === 'image/png' ? 1 : 5;
      for (let step = 0; step < attempts; step++) {
        abort(signal);
        const q = quality - (quality - minQuality) * step / Math.max(1, attempts - 1);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, type, q));
        abort(signal);
        if (!blob || blob.type !== type) throw new Error('Requested image encoder is unavailable.');
        if (blob.size <= maxBytes) {
          const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[type];
          const name = (file.name || 'image').replace(/\.[^.]*$/, '');
          return { file: new File([blob], `${name}.${extension}`, { type, lastModified: file.lastModified ?? Date.now() }), width, height, originalBytes: file.size, bytes: blob.size };
        }
      }
      if (width === 1 && height === 1) break;
      width = Math.max(1, Math.floor(width * .75)); height = Math.max(1, Math.floor(height * .75));
    }
    throw new RangeError('Image cannot meet the output byte limit within the preparation budget.');
  } finally { bitmap.close(); if (canvas) { canvas.width = 0; canvas.height = 0; } }
}
