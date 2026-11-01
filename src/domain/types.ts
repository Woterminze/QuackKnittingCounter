export type ProjectStatus = 'planned' | 'active' | 'paused' | 'done';
export type ToolType = 'needles' | 'circular' | 'hook' | 'machine';

export interface Tool {
  type: ToolType | null;
  /** Размер в мм (спицы, крючок). Для машины обычно пусто. */
  sizeMm: number | null;
  /** Свободный текст: класс машины, «бамбуковые» и т.п. */
  note: string;
}

export interface Yarn {
  id: string;
  name: string;
  composition: string;
  color: string;
  metersPerSkein: number | null;
  skeinsUsed: number | null;
}

/**
 * Правило «каждые N рядов»: срабатывает на рядах
 * startRow, startRow + every, startRow + 2·every, …
 * times = null — бесконечно.
 */
export interface Rule {
  id: string;
  action: string;
  startRow: number;
  every: number;
  times: number | null;
  hint: string;
  enabled: boolean;
}

export interface RowNote {
  id: string;
  row: number;
  text: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  tool: Tool;
  yarns: Yarn[];
  /** Номер ряда, который сейчас вяжется (≥ 1). */
  currentRow: number;
  targetRows: number | null;
  notes: string;
  rowNotes: RowNote[];
  rules: Rule[];
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: 'В планах',
  active: 'В процессе',
  paused: 'На паузе',
  done: 'Готово',
};

export const TOOL_LABELS: Record<ToolType, string> = {
  needles: 'Спицы',
  circular: 'Круговые спицы',
  hook: 'Крючок',
  machine: 'Вязальная машина',
};
