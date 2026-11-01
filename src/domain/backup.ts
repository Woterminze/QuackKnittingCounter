import type { Project } from './types';

export const BACKUP_APP = 'kva-schet';
export const BACKUP_VERSION = 1;

export interface Backup {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  projects: Project[];
}

export class BackupError extends Error {}

export function createBackup(projects: Project[], now = new Date()): Backup {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), projects };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isPosInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1;
const isNullableNum = (v: unknown) => v === null || (typeof v === 'number' && Number.isFinite(v));

function checkProject(p: unknown, i: number): Project {
  const where = `Проект №${i + 1}`;
  if (!isObj(p)) throw new BackupError(`${where}: неверный формат`);
  if (!isStr(p.id) || !p.id) throw new BackupError(`${where}: нет id`);
  if (!isStr(p.name) || !p.name.trim()) throw new BackupError(`${where}: нет названия`);
  if (!['planned', 'active', 'paused', 'done'].includes(p.status as string)) throw new BackupError(`${where}: неизвестный статус`);
  if (!isPosInt(p.currentRow)) throw new BackupError(`${where}: неверный номер ряда`);
  if (!isNullableNum(p.targetRows)) throw new BackupError(`${where}: неверное число рядов`);
  if (!isObj(p.tool)) throw new BackupError(`${where}: нет инструмента`);
  for (const key of ['yarns', 'rowNotes', 'rules'] as const) {
    if (!Array.isArray(p[key])) throw new BackupError(`${where}: поле ${key} должно быть списком`);
  }
  for (const r of p.rules as unknown[]) {
    if (!isObj(r) || !isStr(r.action) || !isPosInt(r.startRow) || !isPosInt(r.every) || !(r.times === null || isPosInt(r.times))) {
      throw new BackupError(`${where}: неверное правило`);
    }
  }
  for (const n of p.rowNotes as unknown[]) {
    if (!isObj(n) || !isPosInt(n.row) || !isStr(n.text)) throw new BackupError(`${where}: неверная заметка`);
  }
  return p as unknown as Project;
}

/** Разбирает и проверяет файл бэкапа. Бросает BackupError с понятным текстом. */
export function parseBackup(json: string): Project[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new BackupError('Файл не похож на JSON');
  }
  if (!isObj(data) || data.app !== BACKUP_APP) throw new BackupError('Это не файл Ква-счёта');
  if (typeof data.version !== 'number' || data.version > BACKUP_VERSION) {
    throw new BackupError('Файл из более новой версии приложения');
  }
  if (!Array.isArray(data.projects)) throw new BackupError('В файле нет проектов');
  const projects = data.projects.map(checkProject);
  const ids = new Set(projects.map((p) => p.id));
  if (ids.size !== projects.length) throw new BackupError('В файле повторяются id проектов');
  return projects;
}
