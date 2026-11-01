import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Project } from '../domain/types';
import type { ProjectRepository } from '../storage/repository';

interface Store {
  projects: Project[] | null;
  save: (p: Project) => void;
  update: (id: string, fn: (p: Project) => Project) => void;
  remove: (id: string) => Promise<void>;
  replaceAll: (ps: Project[]) => Promise<void>;
  error: string | null;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ repo, children }: { repo: ProjectRepository; children: ReactNode }) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<Project[]>([]);

  const commit = (next: Project[]) => {
    ref.current = next;
    setProjects(next);
  };

  useEffect(() => {
    repo
      .list()
      .then(commit)
      .catch(() => {
        setError('Не получилось открыть хранилище браузера. Возможно, включён приватный режим.');
        commit([]);
      });
  }, [repo]);

  const persist = useCallback(
    (p: Project) => {
      repo.save(p).catch(() => setError('Не удалось сохранить изменения'));
    },
    [repo],
  );

  const save = useCallback(
    (p: Project) => {
      const exists = ref.current.some((x) => x.id === p.id);
      commit(exists ? ref.current.map((x) => (x.id === p.id ? p : x)) : [p, ...ref.current]);
      persist(p);
    },
    [persist],
  );

  const update = useCallback(
    (id: string, fn: (p: Project) => Project) => {
      const cur = ref.current.find((x) => x.id === id);
      if (!cur) return;
      const next = fn(cur);
      if (next === cur) return;
      commit(ref.current.map((x) => (x.id === id ? next : x)));
      persist(next);
    },
    [persist],
  );

  const remove = useCallback(
    async (id: string) => {
      commit(ref.current.filter((x) => x.id !== id));
      await repo.remove(id);
    },
    [repo],
  );

  const replaceAll = useCallback(
    async (ps: Project[]) => {
      await repo.replaceAll(ps);
      commit(ps);
    },
    [repo],
  );

  const value = useMemo(
    () => ({ projects, save, update, remove, replaceAll, error }),
    [projects, save, update, remove, replaceAll, error],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider missing');
  return s;
}
