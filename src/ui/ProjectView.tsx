import { useState } from 'react';
import { STATUS_LABELS, TOOL_LABELS, type Project } from '../domain/types';
import { totalMeters } from '../domain/project';
import { useStore } from './store';
import { navigate } from './router';
import { ConfirmDialog, TopBar } from './common';
import { Counter } from './Counter';
import { RulesPanel } from './RulesPanel';
import { NotesPanel } from './NotesPanel';
import { Frog } from './Frog';

type Tab = 'rules' | 'notes' | 'info';
const TABS: { id: Tab; label: string }[] = [
  { id: 'rules', label: 'Правила' },
  { id: 'notes', label: 'Заметки' },
  { id: 'info', label: 'О проекте' },
];

export function ProjectView({ project }: { project: Project }) {
  const [tab, setTab] = useState<Tab>('rules');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { remove } = useStore();

  return (
    <>
      <TopBar
        title={<span data-testid="project-title">{project.name}</span>}
        back="/"
        actions={
          <a className="icon-btn" href={`#/p/${project.id}/edit`} aria-label="Редактировать" data-testid="edit-project">
            ✎
          </a>
        }
      />
      <main className="page">
        {project.status === 'done' && (
          <div className="done-banner" data-testid="done-banner">
            <Frog mood="scarf" size={72} />
            <span>Проект готов! Носи с удовольствием.</span>
          </div>
        )}
        <Counter project={project} />

        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'on' : ''}
              onClick={() => setTab(t.id)}
              data-testid={`tab-${t.id}`}
            >
              {t.label}
              {t.id === 'rules' && project.rules.length > 0 && <span className="count">{project.rules.length}</span>}
              {t.id === 'notes' && project.rowNotes.length > 0 && <span className="count">{project.rowNotes.length}</span>}
            </button>
          ))}
        </div>

        {tab === 'rules' && <RulesPanel project={project} />}
        {tab === 'notes' && <NotesPanel project={project} />}
        {tab === 'info' && (
          <section className="info" data-testid="info-panel">
            <dl>
              <dt>Статус</dt>
              <dd data-testid="info-status">{STATUS_LABELS[project.status]}</dd>
              <dt>Инструмент</dt>
              <dd data-testid="info-tool">
                {project.tool.type ? TOOL_LABELS[project.tool.type] : '—'}
                {project.tool.sizeMm ? `, ${project.tool.sizeMm} мм` : ''}
                {project.tool.note ? ` · ${project.tool.note}` : ''}
              </dd>
              <dt>Пряжа</dt>
              <dd data-testid="info-yarn">
                {project.yarns.length === 0
                  ? '—'
                  : project.yarns.map((y) => (
                      <div key={y.id}>
                        {[y.name, y.color, y.composition].filter(Boolean).join(', ')}
                        {y.skeinsUsed !== null ? ` · ${y.skeinsUsed} мот.` : ''}
                      </div>
                    ))}
              </dd>
              {totalMeters(project) !== null && (
                <>
                  <dt>Расход</dt>
                  <dd data-testid="info-meters">≈ {totalMeters(project)} м</dd>
                </>
              )}
              <dt>Создан</dt>
              <dd>{new Date(project.createdAt).toLocaleDateString('ru-RU')}</dd>
            </dl>
            <button type="button" className="btn danger wide" onClick={() => setConfirmDelete(true)} data-testid="delete-project">
              Удалить проект
            </button>
          </section>
        )}
      </main>
      <ConfirmDialog
        open={confirmDelete}
        title="Удалить проект?"
        text={`«${project.name}» исчезнет вместе с правилами и заметками. Это не отменить.`}
        confirmLabel="Удалить"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          setConfirmDelete(false);
          await remove(project.id);
          navigate('/');
        }}
      />
    </>
  );
}
