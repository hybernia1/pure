# Browser image preparation

Optional, lazy and independent of upload/editor UI. prepareImage transforms local JPEG/PNG files into a new File before sending. It does not send data or mutate the original. Browser use requires no Node.js or external codec dependency.

```js
const { prepareImage } = await loadComponent('image', { styles: false });
const result = await prepareImage(file, {
  maxWidth: 2560, maxHeight: 2560, maxBytes: 5 * 1024 * 1024,
  type: 'image/webp', quality: 0.85, minQuality: 0.5, signal,
});
// result: { file, width, height, originalBytes, bytes }
await uploadImage(result.file, { signal });
```

Defaults are shown above; maxInputBytes defaults to 40 MiB and maxPixels to 40 million. All size limits are positive safe integers. Input byte/header pixel limits are checked before decoding and dimensions checked again after decoding. This bounds accepted input but is not a guarantee of browser memory availability. Images are not upscaled. Aspect ratio and EXIF orientation are respected. Output types: WebP, JPEG or PNG, subject to browser encoder availability. PNG to JPEG is rejected rather than silently flattening transparency; use PNG or WebP for PNG sources. Color/metadata may change when re-encoding; original metadata is not preserved.

The service tries up to five quality levels per size and up to eight dimensions, decreasing each side to 75% between size attempts. PNG ignores quality and only reduces dimensions. Every candidate is checked against maxBytes. Unsupported encoders, invalid files, limits or an unattainable output budget reject; an oversized original is never silently returned. Processing has a finite attempt budget and may fail before reaching the smallest conceivable size. AbortSignal is checked between stages; native decode/encoding already running may finish before cancellation takes effect. Bitmaps/canvas resources are released afterward.

Input is deliberately limited to JPEG and nonanimated PNG. APNG, GIF, WebP, AVIF, HEIC and SVG are not transformed by this first version, avoiding accidental animation loss or unsupported decoding. An application can retain other formats unchanged if they meet upload limits, or supply its own prepareFile implementation.

## Shared upload hook

```js
configurePure({ upload: {
  maxSize: 6 * 1024 * 1024,
  prepareFile: async (file, { signal }) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) return file;
    const { prepareImage } = await loadComponent('image', { styles: false });
    return (await prepareImage(file, { maxBytes: 5 * 1024 * 1024, signal })).file;
  },
} });
```

The callback defaults to null. createUpload, createEditor and createMediaLibrary also accept local prepareFile (null disables it). Editor and library use it before their upload callback. Existing editor JSON/mediaId contracts remain unchanged. Native picker/drop validates count/type, prepares sequentially, then validates output type/size. The field's accept list must allow the output format too (for example image/jpeg,image/png,image/webp for WebP conversion). Without the hook, upload behavior stays synchronous as before. The original input-byte limit belongs in your preparation service, distinct from upload.maxSize.

createUpload adds prepareAndSetFiles(files,{emit=true}), Promise<boolean> ready and isProcessing(). setFiles() stays synchronous and does not prepare; applications needing preparation must use prepareAndSetFiles. Form submission is blocked during pending preparation; retry after completion or await ready before custom submission. Native change/onChange receives the accepted prepared selection. A newer selection, clear, reset or destroy cancels pending work; stale results are ignored and errors preserve the previous selection. clear does not reset the native file input's defaultValue.

Server limits are application configuration, not automatically discoverable by Pure. A 6 MiB per-file cap also needs adequate total request capacity (PHP post_max_size, other fields, multiple files and multipart overhead). Always validate actual files/authorization on the server. [Example](../examples/enhancements.html) prepares to 5 MiB before upload with a 6 MiB output cap. [Tests](../test/enhancements.html) cover both distributions.
