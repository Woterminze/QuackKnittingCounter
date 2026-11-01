import { describe, expect, it } from 'vitest';
import {
  hitsOnRow,
  isFinished,
  lastRow,
  nextHit,
  occurrenceOnRow,
  pluralRows,
  previewRows,
  upcomingHits,
  validateRuleInput,
} from '../src/domain/rules';
import type { Rule } from '../src/domain/types';

const rule = (over: Partial<Rule> = {}): Rule => ({
  id: 'r1',
  action: 'Убавка',
  startRow: 4,
  every: 6,
  times: 3,
  hint: '',
  enabled: true,
  ...over,
});

describe('occurrenceOnRow', () => {
  it.each([
    [4, 1],
    [10, 2],
    [16, 3],
  ])('срабатывает на ряду %i (раз %i)', (row, occ) => {
    expect(occurrenceOnRow(rule(), row)).toBe(occ);
  });

  it.each([1, 3, 5, 9, 11, 22])('не срабатывает на ряду %i', (row) => {
    expect(occurrenceOnRow(rule(), row)).toBeNull();
  });

  it('не срабатывает после исчерпания times', () => {
    expect(occurrenceOnRow(rule(), 22)).toBeNull();
  });

  it('бесконечное правило срабатывает далеко', () => {
    expect(occurrenceOnRow(rule({ times: null }), 4 + 6 * 999)).toBe(1000);
  });

  it('every = 1 срабатывает на каждом ряду начиная со start', () => {
    const r = rule({ startRow: 1, every: 1, times: null });
    expect([1, 2, 3, 50].map((row) => occurrenceOnRow(r, row))).toEqual([1, 2, 3, 50]);
  });

  it('выключенное правило не срабатывает', () => {
    expect(occurrenceOnRow(rule({ enabled: false }), 4)).toBeNull();
  });

  it('times = 1 срабатывает ровно один раз', () => {
    const r = rule({ times: 1 });
    expect(occurrenceOnRow(r, 4)).toBe(1);
    expect(occurrenceOnRow(r, 10)).toBeNull();
  });
});

describe('hitsOnRow', () => {
  it('показывает все совпавшие правила', () => {
    const a = rule({ id: 'a', startRow: 6, every: 6, times: null });
    const b = rule({ id: 'b', action: 'Коса', startRow: 8, every: 8, times: null });
    expect(hitsOnRow([a, b], 24).map((h) => h.rule.id)).toEqual(['a', 'b']);
    expect(hitsOnRow([a, b], 12).map((h) => h.rule.id)).toEqual(['a']);
    expect(hitsOnRow([a, b], 13)).toEqual([]);
  });

  it('откат назад снова показывает напоминание (состояние не хранится)', () => {
    const r = rule();
    expect(hitsOnRow([r], 10)).toHaveLength(1);
    expect(hitsOnRow([r], 11)).toHaveLength(0);
    expect(hitsOnRow([r], 10)).toHaveLength(1);
  });
});

describe('nextHit', () => {
  it('до старта — первый ряд правила', () => {
    expect(nextHit(rule(), 1)).toMatchObject({ row: 4, occurrence: 1, inRows: 3 });
  });

  it('на ряду срабатывания — следующий', () => {
    expect(nextHit(rule(), 4)).toMatchObject({ row: 10, occurrence: 2, inRows: 6 });
  });

  it('между срабатываниями', () => {
    expect(nextHit(rule(), 8)).toMatchObject({ row: 10, inRows: 2 });
  });

  it('после последнего — null', () => {
    expect(nextHit(rule(), 16)).toBeNull();
  });

  it('выключенное — null', () => {
    expect(nextHit(rule({ enabled: false }), 1)).toBeNull();
  });

  it('upcomingHits сортирует по ряду', () => {
    const a = rule({ id: 'a', startRow: 10, every: 10, times: null });
    const b = rule({ id: 'b', startRow: 3, every: 3, times: null });
    expect(upcomingHits([a, b], 4).map((h) => [h.rule.id, h.row])).toEqual([
      ['b', 6],
      ['a', 10],
    ]);
  });
});

describe('lastRow / isFinished / previewRows', () => {
  it('lastRow', () => {
    expect(lastRow(rule())).toBe(16);
    expect(lastRow(rule({ times: null }))).toBeNull();
  });

  it('isFinished', () => {
    expect(isFinished(rule(), 16)).toBe(false);
    expect(isFinished(rule(), 17)).toBe(true);
    expect(isFinished(rule({ times: null }), 9999)).toBe(false);
  });

  it('previewRows ограничен limit и times', () => {
    expect(previewRows(rule())).toEqual([4, 10, 16]);
    expect(previewRows(rule({ times: null }), 4)).toEqual([4, 10, 16, 22]);
  });
});

describe('validateRuleInput', () => {
  const ok = { action: 'Убавка', startRow: '4', every: '6', times: '', hint: '' };

  it('валидный ввод, пустое times = бесконечно', () => {
    const res = validateRuleInput(ok);
    expect(res).toEqual({ ok: true, value: { action: 'Убавка', startRow: 4, every: 6, times: null, hint: '' } });
  });

  it.each(['0', '-1', '1.5', 'abc', '', ' '])('every = %j невалиден', (every) => {
    const res = validateRuleInput({ ...ok, every });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.every).toBeDefined();
  });

  it('пустое действие невалидно', () => {
    const res = validateRuleInput({ ...ok, action: '   ' });
    expect(res.ok).toBe(false);
  });

  it('times = 0 невалиден', () => {
    const res = validateRuleInput({ ...ok, times: '0' });
    expect(res.ok).toBe(false);
  });

  it('обрезает пробелы', () => {
    const res = validateRuleInput({ ...ok, action: '  Прибавка ', startRow: ' 2 ' });
    expect(res.ok && res.value).toMatchObject({ action: 'Прибавка', startRow: 2 });
  });
});

describe('pluralRows', () => {
  it.each([
    [1, 'ряд'],
    [2, 'ряда'],
    [5, 'рядов'],
    [11, 'рядов'],
    [21, 'ряд'],
    [22, 'ряда'],
    [112, 'рядов'],
  ])('%i → %s', (n, word) => expect(pluralRows(n)).toBe(word));
});
