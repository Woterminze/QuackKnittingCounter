import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { DexieRepository } from '../src/storage/dexieRepository';
import { createProject, emptyDraft, incrementRow } from '../src/domain/project';

let repo: DexieRepository;
const fresh = () => (repo = new DexieRepository(`test-${crypto.randomUUID()}`));

afterEach(() => repo?.close());

describe('DexieRepository', () => {
  it('save → get → list', async () => {
    fresh();
    const p = createProject({ ...emptyDraft(), name: 'Шапка' });
    await repo.save(p);
    expect(await repo.get(p.id)).toEqual(p);
    expect(await repo.list()).toHaveLength(1);
  });

  it('list сортирует по updatedAt, свежие сверху', async () => {
    fresh();
    const a = createProject({ ...emptyDraft(), name: 'A' }, new Date('2026-01-01'));
    const b = createProject({ ...emptyDraft(), name: 'B' }, new Date('2026-02-01'));
    await repo.save(a);
    await repo.save(b);
    await repo.save(incrementRow(a, new Date('2026-03-01')));
    expect((await repo.list()).map((p) => p.name)).toEqual(['A', 'B']);
  });

  it('remove', async () => {
    fresh();
    const p = createProject({ ...emptyDraft(), name: 'X' });
    await repo.save(p);
    await repo.remove(p.id);
    expect(await repo.get(p.id)).toBeUndefined();
  });

  it('replaceAll заменяет всё', async () => {
    fresh();
    await repo.save(createProject({ ...emptyDraft(), name: 'Старый' }));
    const n = createProject({ ...emptyDraft(), name: 'Новый' });
    await repo.replaceAll([n]);
    expect((await repo.list()).map((p) => p.name)).toEqual(['Новый']);
  });
});
