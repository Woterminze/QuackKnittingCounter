import { useEffect, useRef, useState } from 'react';
import type { Project } from '../domain/types';
import { hitsOnRow, isDone, missedRows, pluralRows, upcomingHits } from '../domain/rules';
import { decrementRow, incrementRow, patternPosition, setRow, setRuleDone, MAX_ROW } from '../domain/project';
import { useStore } from './store';
import { Frog } from './Frog';

function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
        if (cancelled) lock.release();
      } catch {
        /* браузер может отказать — не страшно */
      }
    };
    const onVis = () => document.visibilityState === 'visible' && acquire();
    acquire();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      lock?.release().catch(() => {});
    };
  }, [enabled]);
}

export function Counter({ project }: { project: Project }) {
  const { update } = useStore();
  const row = project.currentRow;
  const hits = hitsOnRow(project.rules, row);
  const upcoming = upcomingHits(project.rules, row).slice(0, 3);
  const missed = project.rules.map((rule) => ({ rule, rows: missedRows(rule, row) })).filter((m) => m.rows.length > 0);
  const prevRow = useRef(row);
  const [frogging, setFrogging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rowText, setRowText] = useState('');

  useWakeLock(true);

  useEffect(() => {
    const wentUp = row > prevRow.current;
    prevRow.current = row;
    if (wentUp && hits.length > 0) navigator.vibrate?.([70, 50, 70]);
  }, [row, hits.length]);

  const plus = () => update(project.id, (p) => incrementRow(p));
  const minus = () => {
    if (row <= 1) return;
    update(project.id, (p) => decrementRow(p));
    setFrogging(true);
    window.setTimeout(() => setFrogging(false), 700);
  };

  const commitRow = () => {
    const n = Number(rowText);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_ROW) update(project.id, (p) => setRow(p, n));
    setEditing(false);
  };

  const pct = project.targetRows ? Math.min(100, Math.round(((row - 1) / project.targetRows) * 100)) : null;
  const position = project.pattern ? patternPosition(project.pattern, row) : null;

  return (
    <section className="counter" aria-label="Счётчик рядов">
      <div className="counter-display">
        <span className="counter-caption">Сейчас вяжу ряд</span>
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              commitRow();
            }}
          >
            <input
              className="row-input"
              inputMode="numeric"
              autoFocus
              value={rowText}
              onChange={(e) => setRowText(e.target.value)}
              onBlur={commitRow}
              aria-label="Номер ряда"
              data-testid="row-input"
            />
          </form>
        ) : (
          <button
            type="button"
            className="row-number"
            onClick={() => {
              setRowText(String(row));
              setEditing(true);
            }}
            aria-label={`Ряд ${row}. Нажми, чтобы ввести вручную`}
            data-testid="row-number"
          >
            <span className="row-value" key={row}>
              {row}
            </span>
          </button>
        )}
        {project.targetRows && (
          <span className="counter-caption" data-testid="row-target">
            из {project.targetRows}
          </span>
        )}
        {pct !== null && (
          <div className="progress big" aria-hidden>
            <span style={{ width: `${pct}%` }} />
          </div>
        )}
        {project.pattern && (
          <span className="pattern-status" data-testid="pattern-status">
            {position
              ? `Повтор ${position.repeat} · ряд ${position.rowInRepeat} из ${project.pattern.rows}`
              : `Узор начнётся с ряда ${project.pattern.startRow}`}
          </span>
        )}
      </div>

      <div aria-live="polite" data-testid="reminders">
        {hits.map((h) => {
          const done = isDone(h.rule, row);
          return (
            <div className={`reminder ${done ? 'done' : ''}`} key={`${h.rule.id}-${row}`} data-testid="reminder">
              <Frog mood={done ? 'happy' : 'alert'} size={56} className="reminder-frog" />
              <div className="reminder-text">
                <strong data-testid="reminder-action">В этом ряду: {h.rule.action}</strong>
                <div className="muted" data-testid="reminder-count">
                  {h.total ? `${h.occurrence} из ${h.total}` : `${h.occurrence}-й раз`}
                  {h.rule.hint ? ` · ${h.rule.hint}` : ''}
                </div>
              </div>
              <button
                type="button"
                className={`check-btn ${done ? 'on' : ''}`}
                aria-pressed={done}
                onClick={() => update(project.id, (p) => setRuleDone(p, h.rule.id, [row], !done))}
                data-testid="reminder-done"
              >
                {done ? '✓ Сделано' : 'Сделано'}
              </button>
            </div>
          );
        })}
      </div>

      {missed.length > 0 && (
        <ul className="missed" data-testid="missed">
          {missed.map(({ rule, rows }) => (
            <li key={rule.id} data-testid="missed-item">
              <div className="reminder-text">
                <strong>Пропущено: {rule.action}</strong>
                <div className="muted">
                  {rows.length === 1 ? 'ряд' : 'ряды'} {rows.length > 5 ? `…, ${rows.slice(-5).join(', ')}` : rows.join(', ')}
                </div>
              </div>
              <button type="button" className="check-btn" onClick={() => update(project.id, (p) => setRuleDone(p, rule.id, rows, true))} data-testid="missed-done">
                Сделано
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="counter-buttons">
        <button type="button" className={`btn-frog ${frogging ? 'frogging' : ''}`} onClick={minus} disabled={row <= 1} data-testid="row-minus">
          <span aria-hidden>↶</span> Распустить
        </button>
        <button type="button" className="btn-pad" onClick={plus} aria-label="Следующий ряд" data-testid="row-plus">
          +1
        </button>
      </div>
      {frogging && (
        <div className="ribbit" aria-hidden>
          ква…
        </div>
      )}

      {upcoming.length > 0 && (
        <ul className="upcoming" data-testid="upcoming">
          {upcoming.map((u) => (
            <li key={u.rule.id} data-testid="upcoming-item">
              <span>{u.rule.action}</span>
              <span className="muted">
                через {u.inRows} {pluralRows(u.inRows)} · ряд {u.row}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
