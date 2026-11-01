import type { PatternRepeat, Project, ProjectStatus, Rule, RowNote, Tool, Yarn } from './types';

export const newId = (): string => crypto.randomUUID();

export const emptyTool = (): Tool => ({ type: null, sizeMm: null, note: '' });

export const emptyYarn = (): Yarn => ({
  id: newId(),
  name: '',
  composition: '',
  color: '',
  metersPerSkein: null,
  skeinsUsed: null,
});

export interface ProjectDraft {
  name: string;
  status: ProjectStatus;
  tool: Tool;
  yarns: Yarn[];
  targetRows: number | null;
  pattern: PatternRepeat | null;
  notes: string;
}

export const emptyDraft = (): ProjectDraft => ({
  name: '',
  status: 'active',
  tool: emptyTool(),
  yarns: [],
  targetRows: null,
  pattern: null,
  notes: '',
});

export const MAX_NAME = 80;

type DraftErrors = Partial<Record<'name' | 'targetRows' | 'sizeMm' | 'patternRows' | 'patternStart', string>>;

export function validateDraft(draft: ProjectDraft): DraftErrors {
  const errors: DraftErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = 'Как назовём проект?';
  else if (name.length > MAX_NAME) errors.name = `Не длиннее ${MAX_NAME} символов`;
  if (draft.targetRows !== null && (!Number.isInteger(draft.targetRows) || draft.targetRows < 1)) {
    errors.targetRows = 'Целое число от 1 или пусто';
  }
  if (draft.tool.sizeMm !== null && !(draft.tool.sizeMm > 0 && draft.tool.sizeMm <= 50)) {
    errors.sizeMm = 'Размер от 0 до 50 мм';
  }
  if (draft.pattern) {
    if (!Number.isInteger(draft.pattern.rows) || draft.pattern.rows < 1) errors.patternRows = 'Целое число от 1 или пусто';
    if (!Number.isInteger(draft.pattern.startRow) || draft.pattern.startRow < 1) errors.patternStart = 'Целое число от 1 или пусто';
  }
  return errors;
}

export function createProject(draft: ProjectDraft, now = new Date()): Project {
  const ts = now.toISOString();
  return {
    id: newId(),
    name: draft.name.trim(),
    status: draft.status,
    tool: draft.tool,
    yarns: cleanYarns(draft.yarns),
    currentRow: 1,
    targetRows: draft.targetRows,
    pattern: draft.pattern,
    notes: draft.notes,
    rowNotes: [],
    rules: [],
    createdAt: ts,
    updatedAt: ts,
  };
}

export function applyDraft(project: Project, draft: ProjectDraft, now = new Date()): Project {
  return touch(
    {
      ...project,
      name: draft.name.trim(),
      status: draft.status,
      tool: draft.tool,
      yarns: cleanYarns(draft.yarns),
      targetRows: draft.targetRows,
      pattern: draft.pattern,
      notes: draft.notes,
    },
    now,
  );
}

export function toDraft(p: Project): ProjectDraft {
  return {
    name: p.name,
    status: p.status,
    tool: { ...p.tool },
    yarns: p.yarns.map((y) => ({ ...y })),
    targetRows: p.targetRows,
    pattern: p.pattern ?? null,
    notes: p.notes,
  };
}

export interface PatternPosition {
  /** Номер текущего повтора раппорта, с 1. */
  repeat: number;
  /** Номер ряда внутри повтора, от 1 до pattern.rows. */
  rowInRepeat: number;
}

/** Где внутри раппорта находится ряд. null — узор ещё не начался. */
export function patternPosition(pattern: PatternRepeat, row: number): PatternPosition | null {
  const offset = row - pattern.startRow;
  if (offset < 0) return null;
  return { repeat: Math.floor(offset / pattern.rows) + 1, rowInRepeat: (offset % pattern.rows) + 1 };
}

/** Пустые строки пряжи (без названия и цвета) не сохраняем. */
function cleanYarns(yarns: Yarn[]): Yarn[] {
  return yarns
    .map((y) => ({ ...y, name: y.name.trim(), composition: y.composition.trim(), color: y.color.trim() }))
    .filter((y) => y.name || y.color || y.composition);
}

export const touch = (p: Project, now = new Date()): Project => ({ ...p, updatedAt: now.toISOString() });

export const MAX_ROW = 100000;

export function setRow(p: Project, row: number, now = new Date()): Project {
  const clamped = Math.min(MAX_ROW, Math.max(1, Math.trunc(row)));
  const status: ProjectStatus = p.status === 'planned' && clamped > 1 ? 'active' : p.status;
  return touch({ ...p, currentRow: clamped, status }, now);
}

/** Новый ряд снимает проект с паузы: раз вяжем, значит он снова в процессе. */
export function incrementRow(p: Project, now?: Date): Project {
  const next = setRow(p, p.currentRow + 1, now);
  return next.status === 'paused' ? { ...next, status: 'active' } : next;
}

export const decrementRow = (p: Project, now?: Date) => setRow(p, p.currentRow - 1, now);

export const setStatus = (p: Project, status: ProjectStatus, now?: Date) => touch({ ...p, status }, now);

export function addRule(p: Project, value: Omit<Rule, 'id' | 'enabled'>, now?: Date): Project {
  return touch({ ...p, rules: [...p.rules, { ...value, id: newId(), enabled: true }] }, now);
}

export function updateRule(p: Project, rule: Rule, now?: Date): Project {
  return touch({ ...p, rules: p.rules.map((r) => (r.id === rule.id ? rule : r)) }, now);
}

export function removeRule(p: Project, ruleId: string, now?: Date): Project {
  return touch({ ...p, rules: p.rules.filter((r) => r.id !== ruleId) }, now);
}

export const MAX_NOTE = 1000;

export function addRowNote(p: Project, row: number, text: string, now = new Date()): Project {
  const trimmed = text.trim().slice(0, MAX_NOTE);
  if (!trimmed) return p;
  const note: RowNote = { id: newId(), row, text: trimmed, createdAt: now.toISOString() };
  return touch({ ...p, rowNotes: [...p.rowNotes, note] }, now);
}

export function removeRowNote(p: Project, noteId: string, now?: Date): Project {
  return touch({ ...p, rowNotes: p.rowNotes.filter((n) => n.id !== noteId) }, now);
}

/** Заметки по рядам: свежие ряды сверху, внутри ряда — по времени. */
export function sortedRowNotes(p: Project): RowNote[] {
  return [...p.rowNotes].sort((a, b) => b.row - a.row || a.createdAt.localeCompare(b.createdAt));
}

export function totalMeters(p: Project): number | null {
  let sum = 0;
  let any = false;
  for (const y of p.yarns) {
    if (y.metersPerSkein !== null && y.skeinsUsed !== null) {
      sum += y.metersPerSkein * y.skeinsUsed;
      any = true;
    }
  }
  return any ? Math.round(sum) : null;
}
