import { parseDate, pad } from './calendar.js';
export function parsePickerText(text, type, { locale = 'cs-CZ' } = {}) {
  const value = text.trim(); if (!value) return '';
  const date = raw => {
    const local = raw.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/);
    const result = local ? `${local[3]}-${pad(local[2])}-${pad(local[1])}` : raw;
    if (parseDate(result)) return result;
    const numeric = raw.match(/^(\d{1,4})[/.\-\s]+(\d{1,2})[/.\-\s]+(\d{1,4})$/);
    if (!numeric) return null;
    const order = new Intl.DateTimeFormat(locale).formatToParts(new Date(2006, 10, 22)).filter(part => ['year', 'month', 'day'].includes(part.type));
    const parts = {}; order.forEach((part, index) => { parts[part.type] = numeric[index + 1]; });
    const candidate = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
    return parts.year?.length === 4 && parseDate(candidate) ? candidate : null;
  };
  const time = raw => {
    const match = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!match || +match[1] > 23 || +match[2] > 59 || (match[3] && +match[3] > 59)) return null;
    return `${pad(match[1])}:${match[2]}${match[3] ? `:${match[3]}` : ''}`;
  };
  if (type === 'date') return date(value);
  if (type === 'time') return time(value);
  if (type !== 'datetime-local') throw new TypeError('Neznámý typ pickeru.');
  const match = value.match(/^(.+?)[T\s·]+(\d{1,2}:\d{2}(?::\d{2})?)$/);
  if (!match) return null;
  const day = date(match[1].trim()); const clock = time(match[2]); return day && clock ? `${day}T${clock}` : null;
}
