export const pad = value => String(value).padStart(2, '0');
export const dateKey = date => `${String(date.getFullYear()).padStart(4, '0')}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number); const date = new Date(0); date.setHours(12, 0, 0, 0); date.setFullYear(year, month - 1, day);
  return year > 0 && dateKey(date) === value ? date : null;
}
export function shiftDate(value, days = 0, months = 0) {
  const date = parseDate(value); if (!date) throw new TypeError('Neplatné datum.');
  if (months) { const day = date.getDate(); date.setDate(1); date.setMonth(date.getMonth() + months); const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(); date.setDate(Math.min(day, last)); }
  date.setDate(date.getDate() + days); return dateKey(date);
}
export function monthGrid(value) {
  const date = parseDate(value); if (!date) throw new TypeError('Neplatné datum.'); date.setDate(1);
  const start = (date.getDay() + 6) % 7;
  const count = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const cells = Array(start).fill(null);
  for (let day = 1; day <= count; day++) { date.setDate(day); cells.push(dateKey(date)); }
  while (cells.length % 7) cells.push(null);
  return cells;
}
