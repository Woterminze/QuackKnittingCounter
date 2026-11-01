import { useMemo, useState } from 'react';
import { STATUS_LABELS, TOOL_LABELS, type ProjectStatus } from '../domain/types';
import { hitsOnRow } from '../domain/rules';
import { useStore } from './store';
import { TopBar } from './common';
import { Frog } from './Frog';

type Filter = 'all' | ProjectStatus;
const FILTERS: Filter[] = ['all', 'active', 'planned', 'paused', 'done'];

export function ProjectList() {
  const { projects } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (projects ?? [])
      .filter((p) => filter === 'all' || p.status === filter)
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [projects, filter, query]);

  const total = projects?.length ?? 0;

  return (
    <>
      <TopBar
        title="Ква-счёт"
        actions={
          <a className="icon-btn" href="#/settings" aria-label="Настройки" data-testid="open-settings">
            ⚙
          </a>
        }
      />
      <main className="page">
        {total === 0 ? (
          <section className="empty" data-testid="empty-state">
            <Frog mood="sleepy" size={140} />
            <h2>Тут пока тихо, как в пруду</h2>
            <p>Создай первый проект — свитер, шарф или что угодно.</p>
            <a className="btn primary big" href="#/new" data-testid="create-first">
              Создать проект
            </a>
          </section>
        ) : (
          <>
            <input
              className="search"
              type="search"
              placeholder="Поиск по названию"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Поиск по названию"
              data-testid="search"
            />
            <div className="chips" role="tablist" aria-label="Фильтр по статусу">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  className={`chip ${filter === f ? 'on' : ''}`}
                  onClick={() => setFilter(f)}
                  data-testid={`filter-${f}`}
                >
                  {f === 'all' ? 'Все' : STATUS_LABELS[f]}
                </button>
              ))}
            </div>
            <ul className="cards" data-testid="project-list">
              {visible.map((p) => {
                const pct = p.targetRows ? Math.min(100, Math.round(((p.currentRow - 1) / p.targetRows) * 100)) : null;
                const hasHit = p.status === 'active' && hitsOnRow(p.rules, p.currentRow).length > 0;
                return (
                  <li key={p.id}>
                    <a className="card" href={`#/p/${p.id}`} data-testid="project-card">
                      <div className="card-top">
                        <span className="card-name" data-testid="project-card-name">
                          {p.name}
                        </span>
                        <span className={`status s-${p.status}`}>{STATUS_LABELS[p.status]}</span>
                      </div>
                      <div className="card-meta">
                        <span data-testid="project-card-row">Ряд {p.currentRow}{p.targetRows ? ` из ${p.targetRows}` : ''}</span>
                        {p.tool.type && (
                          <span>
                            {TOOL_LABELS[p.tool.type]}
                            {p.tool.sizeMm ? ` ${p.tool.sizeMm} мм` : ''}
                          </span>
                        )}
                        {hasHit && <span className="badge-hit">🐸 есть напоминание</span>}
                      </div>
                      {pct !== null && (
                        <div className="progress" aria-hidden>
                          <span style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
            {visible.length === 0 && (
              <p className="muted center" data-testid="nothing-found">
                Ничего не нашлось
              </p>
            )}
          </>
        )}
      </main>
      {total > 0 && (
        <a className="fab" href="#/new" aria-label="Новый проект" data-testid="new-project">
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
            <path d="M14 4 V24 M4 14 H24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </a>
      )}
    </>
  );
}
