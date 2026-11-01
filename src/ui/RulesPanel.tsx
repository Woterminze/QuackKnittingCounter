import { useState, type FormEvent } from 'react';
import type { Project, Rule } from '../domain/types';
import { isFinished, lastRow, previewRows, validateRuleInput, type RuleInput } from '../domain/rules';
import { addRule, removeRule, updateRule } from '../domain/project';
import { useStore } from './store';
import { ConfirmDialog, Field } from './common';

const PRESETS = ['Убавка', 'Прибавка', 'Перекрест косы', 'Смена цвета'];
const emptyInput = (row: number): RuleInput => ({ action: 'Убавка', startRow: String(row), every: '', times: '', hint: '' });

function describe(rule: Rule): string {
  const last = lastRow(rule);
  const base = `с ${rule.startRow}-го ряда каждые ${rule.every}`;
  return rule.times === null ? `${base} · без ограничения` : `${base} · ${rule.times} раз (до ряда ${last})`;
}

export function RulesPanel({ project }: { project: Project }) {
  const { update } = useStore();
  const [adding, setAdding] = useState(project.rules.length === 0);
  const [input, setInput] = useState<RuleInput>(() => emptyInput(project.currentRow));
  const [touched, setTouched] = useState(false);
  const [toDelete, setToDelete] = useState<Rule | null>(null);

  const result = validateRuleInput(input);
  const errors = touched && !result.ok ? result.errors : {};
  const preview = result.ok ? previewRows(result.value, 8) : [];

  const set = (k: keyof RuleInput, v: string) => setInput((s) => ({ ...s, [k]: v }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!result.ok) return;
    update(project.id, (p) => addRule(p, result.value));
    setInput(emptyInput(project.currentRow));
    setTouched(false);
    setAdding(false);
  };

  return (
    <section data-testid="rules-panel">
      {project.rules.length > 0 && (
        <ul className="rules" data-testid="rule-list">
          {project.rules.map((r) => {
            const finished = isFinished(r, project.currentRow);
            return (
              <li key={r.id} className={`rule ${!r.enabled || finished ? 'dim' : ''}`} data-testid="rule-item">
                <div className="rule-main">
                  <strong data-testid="rule-action">{r.action}</strong>
                  <span className="muted" data-testid="rule-summary">
                    {describe(r)}
                  </span>
                  {r.hint && <span className="muted">{r.hint}</span>}
                  {finished && <span className="tag">выполнено</span>}
                </div>
                <div className="rule-actions">
                  <label className="switch" title={r.enabled ? 'Выключить' : 'Включить'}>
                    <input
                      type="checkbox"
                      checked={r.enabled}
                      onChange={() => update(project.id, (p) => updateRule(p, { ...r, enabled: !r.enabled }))}
                      aria-label={`Правило «${r.action}» включено`}
                      data-testid="rule-toggle"
                    />
                    <span />
                  </label>
                  <button type="button" className="icon-btn small" onClick={() => setToDelete(r)} aria-label={`Удалить правило «${r.action}»`} data-testid="rule-delete">
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {adding ? (
        <form className="form card-like" onSubmit={onSubmit} noValidate data-testid="rule-form">
          <h3>Новое правило</h3>
          <div className="chips">
            {PRESETS.map((p) => (
              <button key={p} type="button" className={`chip ${input.action === p ? 'on' : ''}`} onClick={() => set('action', p)}>
                {p}
              </button>
            ))}
          </div>
          <Field label="Что сделать *" error={errors.action}>
            <input value={input.action} onChange={(e) => set('action', e.target.value)} data-testid="rule-field-action" />
          </Field>
          <div className="row3">
            <Field label="С ряда *" error={errors.startRow}>
              <input inputMode="numeric" value={input.startRow} onChange={(e) => set('startRow', e.target.value)} data-testid="rule-field-start" />
            </Field>
            <Field label="Каждые N *" error={errors.every}>
              <input inputMode="numeric" value={input.every} onChange={(e) => set('every', e.target.value)} placeholder="6" data-testid="rule-field-every" />
            </Field>
            <Field label="Сколько раз" error={errors.times} hint="пусто = всегда">
              <input inputMode="numeric" value={input.times} onChange={(e) => set('times', e.target.value)} placeholder="∞" data-testid="rule-field-times" />
            </Field>
          </div>
          <Field label="Подсказка" error={errors.hint}>
            <input value={input.hint} onChange={(e) => set('hint', e.target.value)} placeholder="по 1 п. с каждой стороны" data-testid="rule-field-hint" />
          </Field>
          {preview.length > 0 && (
            <p className="preview" data-testid="rule-preview">
              Ряды: {preview.join(', ')}
              {result.ok && (result.value.times === null || result.value.times > preview.length) ? ', …' : ''}
            </p>
          )}
          <div className="form-actions">
            {project.rules.length > 0 && (
              <button type="button" className="btn ghost" onClick={() => setAdding(false)}>
                Отмена
              </button>
            )}
            <button type="submit" className="btn primary" data-testid="rule-save">
              Добавить правило
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn ghost wide" onClick={() => setAdding(true)} data-testid="rule-add">
          + Правило «каждые N рядов»
        </button>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Удалить правило?"
        text={toDelete ? `«${toDelete.action}» — ${describe(toDelete)}` : undefined}
        confirmLabel="Удалить"
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) update(project.id, (p) => removeRule(p, toDelete.id));
          setToDelete(null);
        }}
      />
    </section>
  );
}
