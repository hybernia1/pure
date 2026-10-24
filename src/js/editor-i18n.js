import { getPureConfig, resolveLocale } from './config.js';
export const editorLocales = {
  cs: {
    underline: 'Podtržení (Ctrl/Cmd+U)', strike: 'Přeškrtnutí',
    textColor: 'Barva textu', defaultColor: 'Výchozí barva',
    uploadPreparing: 'Připravuji soubory…',
    bulletList: 'Odrážkový seznam', orderedList: 'Číslovaný seznam', listItem: 'Položka seznamu', mediaCount: 'Médií: {count}', mediaChoose: 'Vybrat {name}', mediaRetry: 'Zkusit znovu',
    editor: 'Textový editor', formatting: 'Formátování textu', paragraph: 'Odstavec', heading: 'Nadpis {level}', image: 'Obrázek', remove: 'Smazat',
    moveBlock: 'Přesunout blok {index}: {title}', removeBlock: 'Smazat blok {index}', dragHelp: 'Táhni pro přesun. Klávesnice: mezerník, šipky, mezerník; Escape zruší.',
    imageActions: 'Akce obrázku', smaller: 'Zmenšit obrázek', larger: 'Zvětšit obrázek', leftAction: 'Zarovnat vlevo', centerAction: 'Zarovnat na střed', rightAction: 'Zarovnat vpravo', editImage: 'Upravit obrázek',
    size: 'Velikost', alignment: 'Zarovnání', imageManagement: 'Správa obrázku', imageWidth: 'Šířka obrázku', width: 'Šířka', left: 'Vlevo', center: 'Na střed', right: 'Vpravo',
    resizeHelp: 'Táhni pro změnu šířky; šipky mění velikost, Escape ruší tažení.',
    bold: 'Tučně (Ctrl/Cmd+B)', italic: 'Kurzíva (Ctrl/Cmd+I)', link: 'Vložit nebo upravit odkaz (Ctrl/Cmd+K)', unlink: 'Odstranit odkaz', undo: 'Zpět (Ctrl/Cmd+Z)', redo: 'Znovu (Ctrl/Cmd+Shift+Z)',
    insertImage: 'Vložit obrázek', fullscreen: 'Celá obrazovka', exitFullscreen: 'Ukončit celou obrazovku', textStyle: 'Styl textu', formatted: 'Formátování upraveno.',
    linkTitle: 'Vložit nebo upravit odkaz', linkAddress: 'Adresa odkazu', linkPlaceholder: 'https://… nebo /cesta', invalidLink: 'Zadej platnou HTTP(S), mailto nebo relativní adresu.',
    uploadImage: 'Nahrát obrázek', alt: 'Alternativní text', caption: 'Popisek', currentImage: 'Aktuální obrázek', chooseImage: 'Vyber obrázek k nahrání.', uploadMissing: 'Nahrávání obrázků není nakonfigurované. Připoj uploadImage callback.', changed: 'Obsah se mezitím změnil. Otevři obrázek znovu.',
    close: 'Zavřít dialog', cancel: 'Zrušit', apply: 'Použít', removeImage: 'Odebrat obrázek', failure: 'Změnu se nepodařilo provést.', uploadHelp: 'Vyber nebo přetáhni obrázek. PNG, JPEG, WebP, GIF či AVIF.',
    uploadRemove: 'Odebrat', uploadRemoveFile: 'Odebrat {name}', uploadSelected: 'Vybráno souborů: {count}.', uploadEmpty: 'Žádné vybrané soubory.', uploadError: 'Chyba: {errors} Původní výběr zachován.', maxFiles: 'Vyber nejvýše {count} souborů.', maxSize: '{name}: soubor překračuje limit {size} bajtů.', invalidType: '{name}: nepovolený typ souboru.',
    statistics: 'Statistiky dokumentu', blocks: 'Bloky: {count}', words: 'Slova: {count}', images: 'Obrázky: {count}',
    library: 'Knihovna médií', search: 'Hledat', searchMedia: 'Hledat média', loading: 'Načítání…', noMedia: 'Žádná média.', mediaError: 'Média se nepodařilo načíst.', previous: 'Předchozí', next: 'Další', page: 'Strana {page}', upload: 'Nahrát', invalidMedia: 'API musí vrátit médium s id a bezpečným src.',
    dragMoved: 'Blok přesunut na pozici {index} z {count}.', dragMoving: 'Přesouvání. Uvolni pro vložení, Escape pro zrušení.', dragCanceled: 'Přesun zrušen.', dragPicked: 'Blok vybrán. Šipkami nahoru a dolů vyber pozici, mezerníkem potvrď, Escape zruš.', dragPosition: 'Cílová pozice {index} z {count}.',
  },
  en: {
    underline: 'Underline (Ctrl/Cmd+U)', strike: 'Strikethrough',
    textColor: 'Text color', defaultColor: 'Default color',
    uploadPreparing: 'Preparing files…',
    bulletList: 'Bullet list', orderedList: 'Numbered list', listItem: 'List item', mediaCount: 'Media: {count}', mediaChoose: 'Choose {name}', mediaRetry: 'Try again',
    editor: 'Text editor', formatting: 'Text formatting', paragraph: 'Paragraph', heading: 'Heading {level}', image: 'Image', remove: 'Delete',
    moveBlock: 'Move block {index}: {title}', removeBlock: 'Delete block {index}', dragHelp: 'Drag to move. Keyboard: Space, arrows, Space; Escape cancels.',
    imageActions: 'Image actions', smaller: 'Make image smaller', larger: 'Make image larger', leftAction: 'Align left', centerAction: 'Align center', rightAction: 'Align right', editImage: 'Edit image',
    size: 'Size', alignment: 'Alignment', imageManagement: 'Image management', imageWidth: 'Image width', width: 'Width', left: 'Left', center: 'Center', right: 'Right',
    resizeHelp: 'Drag to resize; arrow keys change the width, Escape cancels dragging.',
    bold: 'Bold (Ctrl/Cmd+B)', italic: 'Italic (Ctrl/Cmd+I)', link: 'Insert or edit link (Ctrl/Cmd+K)', unlink: 'Remove link', undo: 'Undo (Ctrl/Cmd+Z)', redo: 'Redo (Ctrl/Cmd+Shift+Z)',
    insertImage: 'Insert image', fullscreen: 'Fullscreen', exitFullscreen: 'Exit fullscreen', textStyle: 'Text style', formatted: 'Formatting updated.',
    linkTitle: 'Insert or edit link', linkAddress: 'Link address', linkPlaceholder: 'https://… or /path', invalidLink: 'Enter a valid HTTP(S), mailto or relative address.',
    uploadImage: 'Upload image', alt: 'Alternative text', caption: 'Caption', currentImage: 'Current image', chooseImage: 'Choose an image to upload.', uploadMissing: 'Image uploads are not configured. Provide an uploadImage callback.', changed: 'The document has changed. Open the image again.',
    close: 'Close dialog', cancel: 'Cancel', apply: 'Apply', removeImage: 'Remove image', failure: 'The change could not be completed.', uploadHelp: 'Choose or drop an image. PNG, JPEG, WebP, GIF or AVIF.',
    uploadRemove: 'Remove', uploadRemoveFile: 'Remove {name}', uploadSelected: 'Selected files: {count}.', uploadEmpty: 'No files selected.', uploadError: 'Error: {errors} Previous selection preserved.', maxFiles: 'Choose at most {count} files.', maxSize: '{name}: file exceeds {size} bytes.', invalidType: '{name}: file type is not allowed.',
    statistics: 'Document statistics', blocks: 'Blocks: {count}', words: 'Words: {count}', images: 'Images: {count}',
    library: 'Media library', search: 'Search', searchMedia: 'Search media', loading: 'Loading…', noMedia: 'No media found.', mediaError: 'Could not load media.', previous: 'Previous', next: 'Next', page: 'Page {page}', upload: 'Upload', invalidMedia: 'The API must return media with an id and a safe src.',
    dragMoved: 'Block moved to position {index} of {count}.', dragMoving: 'Moving. Release to drop, Escape to cancel.', dragCanceled: 'Move canceled.', dragPicked: 'Block selected. Use Up and Down to choose a position, Space to confirm, Escape to cancel.', dragPosition: 'Target position {index} of {count}.',
  },
};

export function editorI18n(doc, { locale, messages = {} } = {}) {
  locale = resolveLocale(doc, locale);
  const language = String(locale).toLowerCase().split('-')[0];
  const dictionary = { ...editorLocales.en, ...(editorLocales[language] || {}), ...getPureConfig().messages, ...messages };
  return { locale, t: (key, values = {}) => String(dictionary[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`)) };
}
