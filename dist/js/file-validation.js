export function validateFiles(files, { accept = '', maxFiles = Infinity, maxSize = Infinity, translate } = {}) {
  if (!(maxFiles > 0) || !(maxSize > 0) || (maxFiles !== Infinity && !Number.isInteger(maxFiles))) throw new TypeError('Limity musí být kladné; počet musí být celé číslo.');
  const errors = [];
  const rules = accept.toLowerCase().split(',').map(rule => rule.trim()).filter(Boolean);
  if (files.length > maxFiles) errors.push(translate ? translate('maxFiles', { count: maxFiles }) : `Vyber nejvýše ${maxFiles} souborů.`);
  for (const file of files) {
    if (file.size > maxSize) errors.push(translate ? translate('maxSize', { name: file.name, size: maxSize }) : `${file.name}: soubor překračuje limit ${maxSize} bajtů.`);
    const type = file.type.toLowerCase();
    const matches = !rules.length || rules.some(rule => rule.startsWith('.') ? file.name.toLowerCase().endsWith(rule) : rule.endsWith('/*') ? type.startsWith(rule.slice(0, -1)) : type === rule);
    if (!matches) errors.push(translate ? translate('invalidType', { name: file.name }) : `${file.name}: nepovolený typ souboru.`);
  }
  return errors;
}
