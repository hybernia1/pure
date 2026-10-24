import { getPureConfig, resolveLocale } from './config.js';

const en = {
  tags: 'Tags', tagAdd: 'Add', tagHelp: 'Separate tags with commas. Press Enter or Add to confirm.', tagSelected: 'Selected tags',
  tagRemove: 'Remove tag {name}', tagAdded: 'Added: {name}.', tagRemoved: 'Removed: {name}.', tagDuplicate: 'Already selected: {name}.', tagLimit: 'Choose at most {count} tags.', tagUnknown: 'Unknown tag: {name}.',
  openNavigation: 'Open navigation', closeNavigation: 'Close navigation',
  sortRecords: 'Sort records',
  pagination: 'Pagination', pageSummary: 'Page {page} of {pages} · {total} records', goPage: 'Go to page {page}', previousPage: 'Previous', nextPage: 'Next',
  dataTable: 'Data table', dataList: 'Records', dataLoading: 'Loading…', dataEmpty: 'No records.', dataError: 'Could not load records.', dataCount: 'Records: {count}', retry: 'Try again',
  clear: 'Clear', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds',
  selection: 'Selection', openSelection: 'Open selection: {label}', selectPlaceholder: 'Choose an option',
  showPassword: 'Show password', hidePassword: 'Hide password', closeFlash: 'Close notification',
  clearSearch: 'Clear search', suggestions: 'Search suggestions', searching: 'Searching…', found: 'Suggestions found: {count}.', noResults: 'No results.', searchFailure: 'Search failed. Try again.',
  invalidDate: 'Enter a valid date in local or YYYY-MM-DD format, optionally with time HH:mm.', invalidTime: 'Enter a valid time HH:mm or HH:mm:ss.',
  previousMonth: 'Previous month', nextMonth: 'Next month', chooseTime: 'Choose a time', closePicker: 'Close picker', apply: 'Apply',
  activity: 'Processing…', progress: 'Progress', pending: 'In progress…', error: 'Error', success: 'Done', info: 'Processing',
  width: 'Width', resizeHelp: 'Drag to resize; arrow keys change the width, Escape cancels dragging.',
};
const cs = {
  tags: 'Štítky', tagAdd: 'Přidat', tagHelp: 'Odděl štítky čárkou. Potvrď Enterem nebo tlačítkem Přidat.', tagSelected: 'Vybrané štítky',
  tagRemove: 'Odebrat štítek {name}', tagAdded: 'Přidáno: {name}.', tagRemoved: 'Odebráno: {name}.', tagDuplicate: 'Již vybráno: {name}.', tagLimit: 'Vyber nejvýše {count} štítků.', tagUnknown: 'Neznámý štítek: {name}.',
  openNavigation: 'Otevřít navigaci', closeNavigation: 'Zavřít navigaci',
  sortRecords: 'Řazení záznamů',
  pagination: 'Stránkování', pageSummary: 'Strana {page} z {pages} · {total} záznamů', goPage: 'Přejít na stranu {page}', previousPage: 'Předchozí', nextPage: 'Další',
  dataTable: 'Datová tabulka', dataList: 'Záznamy', dataLoading: 'Načítání…', dataEmpty: 'Žádné záznamy.', dataError: 'Záznamy se nepodařilo načíst.', dataCount: 'Záznamů: {count}', retry: 'Zkusit znovu',
  clear: 'Vymazat', hours: 'Hodiny', minutes: 'Minuty', seconds: 'Sekundy',
  selection: 'Výběr', openSelection: 'Otevřít výběr: {label}', selectPlaceholder: 'Vyber možnost',
  showPassword: 'Zobrazit heslo', hidePassword: 'Skrýt heslo', closeFlash: 'Zavřít oznámení',
  clearSearch: 'Vymazat hledání', suggestions: 'Návrhy vyhledávání', searching: 'Vyhledávám…', found: 'Nalezeno návrhů: {count}.', noResults: 'Žádné výsledky.', searchFailure: 'Vyhledávání se nezdařilo. Zkus to znovu.',
  invalidDate: 'Zadej platné datum (DD.MM.RRRR nebo YYYY-MM-DD) a případně čas HH:mm.', invalidTime: 'Zadej platný čas HH:mm nebo HH:mm:ss.',
  previousMonth: 'Předchozí měsíc', nextMonth: 'Další měsíc', chooseTime: 'Vyber čas', closePicker: 'Zavřít výběr', apply: 'Použít',
  activity: 'Probíhá zpracování…', progress: 'Průběh', pending: 'Probíhá…', error: 'Chyba', success: 'Hotovo', info: 'Probíhá zpracování',
  width: 'Šířka', resizeHelp: 'Táhni pro změnu šířky; šipky mění velikost, Escape ruší tažení.',
};
export function uiI18n(doc, { locale, messages } = {}) {
  locale = resolveLocale(doc, locale);
  const dictionary = { ...en, ...(locale.toLowerCase().split('-')[0] === 'cs' ? cs : {}), ...getPureConfig().messages, ...messages };
  return { locale, t: (key, values = {}) => String(dictionary[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`)) };
}
