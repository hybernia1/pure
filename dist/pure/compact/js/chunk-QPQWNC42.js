import {
  __name
} from "./chunk-SHUYVCID.js";

// src/js/file-validation.js
function validateFiles(files, { accept = "", maxFiles = Infinity, maxSize = Infinity, translate } = {}) {
  if (!(maxFiles > 0) || !(maxSize > 0) || maxFiles !== Infinity && !Number.isInteger(maxFiles)) throw new TypeError("Limity mus\xED b\xFDt kladn\xE9; po\u010Det mus\xED b\xFDt cel\xE9 \u010D\xEDslo.");
  const errors = [];
  const rules = accept.toLowerCase().split(",").map((rule) => rule.trim()).filter(Boolean);
  if (files.length > maxFiles) errors.push(translate ? translate("maxFiles", { count: maxFiles }) : `Vyber nejv\xFD\u0161e ${maxFiles} soubor\u016F.`);
  for (const file of files) {
    if (file.size > maxSize) errors.push(translate ? translate("maxSize", { name: file.name, size: maxSize }) : `${file.name}: soubor p\u0159ekra\u010Duje limit ${maxSize} bajt\u016F.`);
    const type = file.type.toLowerCase();
    const matches = !rules.length || rules.some((rule) => rule.startsWith(".") ? file.name.toLowerCase().endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule);
    if (!matches) errors.push(translate ? translate("invalidType", { name: file.name }) : `${file.name}: nepovolen\xFD typ souboru.`);
  }
  return errors;
}
__name(validateFiles, "validateFiles");

export {
  validateFiles
};
