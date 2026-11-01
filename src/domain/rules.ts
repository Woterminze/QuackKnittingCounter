import type { Rule } from './types';

export interface RuleHit {
  rule: Rule;
  /** Какое по счёту срабатывание (с 1). */
  occurrence: number;
  /** Всего срабатываний или null, если бесконечно. */
  total: number | null;
}

export interface NextHit {
  rule: Rule;
  row: number;
  occurrence: number;
  /** Через сколько рядов от текущего. */
  inRows: number;
}

/**
 * Номер срабатывания правила на ряду row (с 1) или null.
 * Состояние не хранится: всё вычисляется из номера ряда,
 * поэтому откат счётчика назад работает автоматически.
 */
export function occurrenceOnRow(rule: Rule, row: number): number | null {
  if (!rule.enabled) return null;
  if (row < rule.startRow) return null;
  const offset = row - rule.startRow;
  if (offset % rule.every !== 0) return null;
  const occurrence = offset / rule.every + 1;
  if (rule.times !== null && occurrence > rule.times) return null;
  return occurrence;
}

/** Все правила, срабатывающие на этом ряду. */
export function hitsOnRow(rules: Rule[], row: number): RuleHit[] {
  const hits: RuleHit[] = [];
  for (const rule of rules) {
    const occurrence = occurrenceOnRow(rule, row);
    if (occurrence !== null) hits.push({ rule, occurrence, total: rule.times });
  }
  return hits;
}

/** Последний ряд правила или null, если оно бесконечное. */
export function lastRow(rule: Rule): number | null {
  if (rule.times === null) return null;
  return rule.startRow + (rule.times - 1) * rule.every;
}

/** Правило отработало полностью (текущий ряд уже за последним срабатыванием). */
export function isFinished(rule: Rule, currentRow: number): boolean {
  const last = lastRow(rule);
  return last !== null && currentRow > last;
}

export const isDone = (rule: Rule, row: number): boolean => rule.doneRows?.includes(row) ?? false;

/** Пройденные ряды, где правило сработало, а действие не отмечено. */
export function missedRows(rule: Rule, currentRow: number): number[] {
  const done = new Set(rule.doneRows);
  const rows: number[] = [];
  for (let row = rule.startRow; row < currentRow; row += rule.every) {
    if (occurrenceOnRow(rule, row) === null) break;
    if (!done.has(row)) rows.push(row);
  }
  return rows;
}

/** Ближайшее срабатывание строго после ряда row. */
export function nextHit(rule: Rule, row: number): NextHit | null {
  if (!rule.enabled) return null;
  let candidate: number;
  if (row < rule.startRow) {
    candidate = rule.startRow;
  } else {
    const passed = Math.floor((row - rule.startRow) / rule.every);
    candidate = rule.startRow + (passed + 1) * rule.every;
  }
  const occurrence = (candidate - rule.startRow) / rule.every + 1;
  if (rule.times !== null && occurrence > rule.times) return null;
  return { rule, row: candidate, occurrence, inRows: candidate - row };
}

/** Ближайшие срабатывания всех правил, отсортированные по ряду. */
export function upcomingHits(rules: Rule[], row: number): NextHit[] {
  return rules
    .map((r) => nextHit(r, row))
    .filter((h): h is NextHit => h !== null)
    .sort((a, b) => a.row - b.row);
}

/** Превью рядов для формы: первые limit срабатываний. */
export function previewRows(rule: Pick<Rule, 'startRow' | 'every' | 'times'>, limit = 8): number[] {
  const count = rule.times === null ? limit : Math.min(rule.times, limit);
  return Array.from({ length: count }, (_, i) => rule.startRow + i * rule.every);
}

export interface RuleInput {
  action: string;
  startRow: string;
  every: string;
  times: string;
  hint: string;
}

export type RuleErrors = Partial<Record<keyof RuleInput, string>>;

function parsePositiveInt(raw: string): number | null {
  const s = raw.trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && Number.isSafeInteger(n) ? n : null;
}

export const RULE_LIMITS = { maxRow: 100000, maxAction: 60, maxHint: 200 } as const;

/** Валидация ввода формы правила. Возвращает либо ошибки, либо готовые значения. */
export function validateRuleInput(
  input: RuleInput,
): { ok: true; value: Omit<Rule, 'id' | 'enabled'> } | { ok: false; errors: RuleErrors } {
  const errors: RuleErrors = {};
  const action = input.action.trim();
  if (!action) errors.action = 'Напиши, что нужно сделать';
  else if (action.length > RULE_LIMITS.maxAction) errors.action = `Не длиннее ${RULE_LIMITS.maxAction} символов`;

  const startRow = parsePositiveInt(input.startRow);
  if (startRow === null || startRow > RULE_LIMITS.maxRow) errors.startRow = 'Целое число от 1';

  const every = parsePositiveInt(input.every);
  if (every === null || every > RULE_LIMITS.maxRow) errors.every = 'Целое число от 1';

  let times: number | null = null;
  if (input.times.trim() !== '') {
    times = parsePositiveInt(input.times);
    if (times === null || times > RULE_LIMITS.maxRow) errors.times = 'Целое число от 1 или пусто';
  }

  const hint = input.hint.trim();
  if (hint.length > RULE_LIMITS.maxHint) errors.hint = `Не длиннее ${RULE_LIMITS.maxHint} символов`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { action, startRow: startRow!, every: every!, times, hint } };
}

/** «ряд», «ряда», «рядов». */
export function pluralRows(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'ряд';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'ряда';
  return 'рядов';
}
