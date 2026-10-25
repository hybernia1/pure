import {
  safeImageSource
} from "./chunk-KL7ILSU2.js";
import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/media.js
function normalizeMedia(item) {
  if (!item || !(typeof item.id === "string" && item.id.trim() || typeof item.id === "number" && Number.isFinite(item.id)) || typeof item.src !== "string" || !safeImageSource(item.src)) throw new TypeError("Invalid media: expected id and a safe src.");
  const alt = typeof item.alt === "string" ? item.alt : "";
  return { id: item.id, src: safeImageSource(item.src), alt, name: typeof item.name === "string" ? item.name : alt || String(item.id) };
}
__name(normalizeMedia, "normalizeMedia");

export {
  normalizeMedia
};
