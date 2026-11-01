import { useState, type FormEvent } from 'react';
import { applyDraft, createProject, emptyDraft, emptyYarn, toDraft, validateDraft, type ProjectDraft } from '../domain/project';
import { STATUS_LABELS, TOOL_LABELS, type Project, type ProjectStatus, type ToolType, type Yarn } from '../domain/types';
import { useStore } from './store';
import { navigate } from './router';
import { Field, TopBar, parseOptionalNumber } from './common';

const numText = (n: number | null) => (n === null ? '' : String(n));

export function ProjectForm({ project }: { project?: Project }) {
  const { save } = useStore();
  const [draft, setDraft] = useState<ProjectDraft>(() => (project ? toDraft(project) : emptyDraft()));
  const [targetText, setTargetText] = useState(numText(draft.targetRows));
  const [sizeText, setSizeText] = useState(numText(draft.tool.sizeMm));
  const [patternRowsText, setPatternRowsText] = useState(numText(draft.pattern?.rows ?? null));
  const [patternStartText, setPatternStartText] = useState(numText(draft.pattern?.startRow ?? null));
  const [touched, setTouched] = useState(false);

  const patternRows = parseOptionalNumber(patternRowsText);
  const full: ProjectDraft = {
    ...draft,
    targetRows: parseOptionalNumber(targetText),
    tool: { ...draft.tool, sizeMm: parseOptionalNumber(sizeText) },
    pattern: patternRows === null ? null : { rows: patternRows, startRow: parseOptionalNumber(patternStartText) ?? 1 },
  };
  const errors = validateDraft(full);
  const show = (k: keyof typeof errors) => (touched ? errors[k] : undefined);

  const set = <K extends keyof ProjectDraft>(k: K, v: ProjectDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setYarn = (id: string, patch: Partial<Yarn>) =>
    set('yarns', draft.yarns.map((y) => (y.id === id ? { ...y, ...patch } : y)));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) return;
    const p = project ? applyDraft(project, full) : createProject(full);
    save(p);
    navigate(`/p/${p.id}`);
  };

  const back = project ? `/p/${project.id}` : '/';

  return (
    <>
      <TopBar title={project ? 'Редактировать' : 'Новый проект'} back={back} />
      <main className="page">
        <form className="form" onSubmit={onSubmit} noValidate data-testid="project-form">
          <Field label="Название *" error={show('name')}>
            <input
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Например, свитер с косами"
              autoFocus={!project}
              maxLength={120}
              data-testid="field-name"
            />
          </Field>

          <Field label="Статус">
            <select value={draft.status} onChange={(e) => set('status', e.target.value as ProjectStatus)} data-testid="field-status">
              {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>

          <fieldset className="group">
            <legend>Инструмент</legend>
            <div className="segmented" role="radiogroup" aria-label="Тип инструмента">
              {(Object.keys(TOOL_LABELS) as ToolType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={draft.tool.type === t}
                  className={draft.tool.type === t ? 'on' : ''}
                  onClick={() => set('tool', { ...draft.tool, type: draft.tool.type === t ? null : t })}
                  data-testid={`tool-${t}`}
                >
                  {TOOL_LABELS[t]}
                </button>
              ))}
            </div>
            <div className="row2">
              <Field label="Размер, мм" error={show('sizeMm')}>
                <input inputMode="decimal" value={sizeText} onChange={(e) => setSizeText(e.target.value)} placeholder="4" data-testid="field-size" />
              </Field>
              <Field label="Заметка">
                <input
                  value={draft.tool.note}
                  onChange={(e) => set('tool', { ...draft.tool, note: e.target.value })}
                  placeholder="бамбуковые, класс 5…"
                  data-testid="field-tool-note"
                />
              </Field>
            </div>
          </fieldset>

          <fieldset className="group">
            <legend>Пряжа</legend>
            {draft.yarns.map((y, i) => (
              <div className="yarn" key={y.id} data-testid="yarn-row">
                <div className="yarn-head">
                  <span className="muted">Пряжа {i + 1}</span>
                  <button
                    type="button"
                    className="link danger"
                    onClick={() => set('yarns', draft.yarns.filter((x) => x.id !== y.id))}
                    data-testid="yarn-remove"
                  >
                    Убрать
                  </button>
                </div>
                <div className="row2">
                  <Field label="Название">
                    <input value={y.name} onChange={(e) => setYarn(y.id, { name: e.target.value })} data-testid="yarn-name" />
                  </Field>
                  <Field label="Цвет">
                    <input value={y.color} onChange={(e) => setYarn(y.id, { color: e.target.value })} data-testid="yarn-color" />
                  </Field>
                </div>
                <Field label="Состав">
                  <input value={y.composition} onChange={(e) => setYarn(y.id, { composition: e.target.value })} placeholder="100% мериносовая шерсть" data-testid="yarn-composition" />
                </Field>
                <div className="row2">
                  <Field label="Метров в мотке">
                    <input
                      inputMode="numeric"
                      value={numText(y.metersPerSkein)}
                      onChange={(e) => {
                        const n = parseOptionalNumber(e.target.value);
                        setYarn(y.id, { metersPerSkein: n !== null && Number.isFinite(n) && n >= 0 ? n : null });
                      }}
                      data-testid="yarn-meters"
                    />
                  </Field>
                  <Field label="Ушло мотков">
                    <input
                      inputMode="decimal"
                      value={numText(y.skeinsUsed)}
                      onChange={(e) => {
                        const n = parseOptionalNumber(e.target.value);
                        setYarn(y.id, { skeinsUsed: n !== null && Number.isFinite(n) && n >= 0 ? n : null });
                      }}
                      data-testid="yarn-skeins"
                    />
                  </Field>
                </div>
              </div>
            ))}
            <button type="button" className="btn ghost" onClick={() => set('yarns', [...draft.yarns, emptyYarn()])} data-testid="yarn-add">
              + Добавить пряжу
            </button>
          </fieldset>

          <Field label="Сколько рядов всего" error={show('targetRows')} hint="Необязательно — для прогресса">
            <input inputMode="numeric" value={targetText} onChange={(e) => setTargetText(e.target.value)} placeholder="120" data-testid="field-target" />
          </Field>

          <div className="row2">
            <Field label="Раппорт узора, рядов" error={show('patternRows')} hint="Необязательно — для счётчика повторов">
              <input inputMode="numeric" value={patternRowsText} onChange={(e) => setPatternRowsText(e.target.value)} placeholder="8" data-testid="field-pattern-rows" />
            </Field>
            <Field label="Узор начинается с ряда" error={show('patternStart')} hint="Если пусто — с первого">
              <input inputMode="numeric" value={patternStartText} onChange={(e) => setPatternStartText(e.target.value)} placeholder="1" data-testid="field-pattern-start" />
            </Field>
          </div>

          <Field label="Заметки">
            <textarea
              rows={4}
              value={draft.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Схема, ссылки, что угодно"
              data-testid="field-notes"
            />
          </Field>

          <div className="form-actions">
            <a className="btn ghost" href={`#${back}`}>
              Отмена
            </a>
            <button type="submit" className="btn primary" data-testid="save-project">
              {project ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
