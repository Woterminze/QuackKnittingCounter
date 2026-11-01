import type { Project } from '../domain/types';

/**
 * Единый интерфейс хранения. UI работает только с ним.
 * Сейчас реализация — IndexedDB (Dexie); на этапе 3 появится HttpRepository для REST-бэкенда.
 */
export interface ProjectRepository {
  list(): Promise<Project[]>;
  get(id: string): Promise<Project | undefined>;
  save(project: Project): Promise<void>;
  remove(id: string): Promise<void>;
  /** Полная замена данных (импорт бэкапа). */
  replaceAll(projects: Project[]): Promise<void>;
}
