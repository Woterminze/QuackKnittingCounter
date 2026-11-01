import { describe, expect, it } from 'vitest';
import {
  addRowNote,
  addRule,
  createProject,
  decrementRow,
  emptyDraft,
  incrementRow,
  setRow,
  sortedRowNotes,
  totalMeters,
  validateDraft,
} from '../src/domain/project';
import { BackupError, createBackup, parseBackup } from '../src/domain/backup';

const make = () => createProject({ ...emptyDraft(), name: 'Свитер' }, new Date('2026-11-01T10:00:00Z'));

describe('проект', () => {
  it('создаётся с рядом 1', () => {
    const p = make();
    expect(p.currentRow).toBe(1);
    expect(p.name).toBe('Свитер');
  });

  it('название обязательно', () => {
    expect(validateDraft(emptyDraft()).name).toBeDefined();
    expect(validateDraft({ ...emptyDraft(), name: 'Шарф' })).toEqual({});
  });

  it('счётчик не уходит ниже 1', () => {
    expect(decrementRow(make()).currentRow).toBe(1);
  });

  it('+1 и −1', () => {
    const p = incrementRow(incrementRow(make()));
    expect(p.currentRow).toBe(3);
    expect(decrementRow(p).currentRow).toBe(2);
  });

  it('проект «в планах» переходит в «в процессе» при счёте', () => {
    const p = createProject({ ...emptyDraft(), name: 'X', status: 'planned' });
    expect(incrementRow(p).status).toBe('active');
  });

  it('setRow отбрасывает дробную часть', () => {
    expect(setRow(make(), 7.9).currentRow).toBe(7);
  });

  it('пустые заметки не добавляются', () => {
    const p = make();
    expect(addRowNote(p, 1, '   ')).toBe(p);
  });

  it('заметки сортируются по ряду, свежие сверху', () => {
    let p = make();
    p = addRowNote(p, 2, 'прибавка', new Date('2026-11-01T10:01:00Z'));
    p = addRowNote(p, 5, 'упустила петлю', new Date('2026-11-01T10:02:00Z'));
    expect(sortedRowNotes(p).map((n) => n.row)).toEqual([5, 2]);
  });

  it('расход пряжи', () => {
    const p = { ...make(), yarns: [
      { id: '1', name: 'A', composition: '', color: '', metersPerSkein: 200, skeinsUsed: 2.5 },
      { id: '2', name: 'B', composition: '', color: '', metersPerSkein: null, skeinsUsed: 1 },
    ] };
    expect(totalMeters(p)).toBe(500);
    expect(totalMeters(make())).toBeNull();
  });
});

describe('бэкап', () => {
  it('экспорт → импорт возвращает те же проекты', () => {
    const p = addRule(make(), { action: 'Убавка', startRow: 4, every: 6, times: null, hint: '' });
    const json = JSON.stringify(createBackup([p]));
    expect(parseBackup(json)).toEqual([p]);
  });

  it.each([
    ['не JSON', '{oops', 'JSON'],
    ['чужой файл', '{"app":"other","version":1,"projects":[]}', 'не файл'],
    ['новая версия', '{"app":"kva-schet","version":99,"projects":[]}', 'новой версии'],
    ['нет проектов', '{"app":"kva-schet","version":1}', 'нет проектов'],
  ])('%s → понятная ошибка', (_, json, msg) => {
    expect(() => parseBackup(json)).toThrow(BackupError);
    expect(() => parseBackup(json)).toThrow(msg);
  });

  it('битое правило в проекте', () => {
    const p = { ...make(), rules: [{ action: 'x', startRow: 0, every: 1, times: null }] };
    expect(() => parseBackup(JSON.stringify(createBackup([p as never])))).toThrow('неверное правило');
  });

  it('повтор id', () => {
    const p = make();
    expect(() => parseBackup(JSON.stringify(createBackup([p, p])))).toThrow('повторяются');
  });
});
