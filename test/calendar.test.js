import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDate, dateKey, shiftDate, monthGrid } from '../src/js/calendar.js';
import { parsePickerText } from '../src/js/picker-value.js';
test('ruční zápis přijímá české i ISO datum, čas a datum s časem bez tichých oprav', () => {
  assert.equal(parsePickerText('23.10.2026', 'date'), '2026-10-23');
  assert.equal(parsePickerText('2026-10-23', 'date'), '2026-10-23');
  assert.equal(parsePickerText('9:05', 'time'), '09:05');
  assert.equal(parsePickerText('23. 10. 2026 14:30', 'datetime-local'), '2026-10-23T14:30');
  assert.equal(parsePickerText('2026-10-23T14:30:15', 'datetime-local'), '2026-10-23T14:30:15');
  assert.equal(parsePickerText('31.02.2026', 'date'), null);
  assert.equal(parsePickerText('24:00', 'time'), null);
  assert.equal(parsePickerText('', 'date'), '');
});
test('kalendář ověřuje datum, přestupný rok a nepoužívá UTC posun', () => {
  assert.equal(parseDate('2026-02-29'), null);
  assert.equal(dateKey(parseDate('2024-02-29')), '2024-02-29');
  assert.equal(shiftDate('2026-01-31', 0, 1), '2026-02-28');
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01');
});
test('mřížka začíná pondělím a má celé týdny se všemi dny měsíce', () => {
  const cells = monthGrid('2026-10-23');
  assert.equal(cells.length % 7, 0);
  assert.deepEqual(cells.slice(0, 4), [null, null, null, '2026-10-01']);
  assert.equal(cells.filter(Boolean).length, 31);
});
