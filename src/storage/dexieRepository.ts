import Dexie, { type Table } from 'dexie';
import type { Project } from '../domain/types';
import type { ProjectRepository } from './repository';

class KvaDb extends Dexie {
  projects!: Table<Project, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({ projects: 'id, status, updatedAt' });
  }
}

export class DexieRepository implements ProjectRepository {
  private db: KvaDb;

  constructor(dbName = 'kva-schet') {
    this.db = new KvaDb(dbName);
  }

  async list(): Promise<Project[]> {
    const all = await this.db.projects.toArray();
    return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  get(id: string) {
    return this.db.projects.get(id);
  }

  async save(project: Project) {
    await this.db.projects.put(project);
  }

  async remove(id: string) {
    await this.db.projects.delete(id);
  }

  async replaceAll(projects: Project[]) {
    await this.db.transaction('rw', this.db.projects, async () => {
      await this.db.projects.clear();
      await this.db.projects.bulkPut(projects);
    });
  }

  close() {
    this.db.close();
  }
}
