import { useState, type FormEvent } from 'react';
import type { Project } from '../domain/types';
import { addRowNote, removeRowNote, sortedRowNotes, touch, MAX_NOTE } from '../domain/project';
import { useStore } from './store';

export function NotesPanel({ project }: { project: Project }) {
  const { update } = useStore();
  const [text, setText] = useState('');
  const [general, setGeneral] = useState(project.notes);
  const notes = sortedRowNotes(project);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    update(project.id, (p) => addRowNote(p, p.currentRow, text));
    setText('');
  };

  return (
    <section data-testid="notes-panel">
      <form className="note-form" onSubmit={onSubmit}>
        <span className="note-row-tag">ряд {project.currentRow}</span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Упустила петлю, сделала прибавку…"
          maxLength={MAX_NOTE}
          aria-label={`Заметка к ряду ${project.currentRow}`}
          data-testid="note-input"
        />
        <button type="submit" className="btn primary" disabled={!text.trim()} data-testid="note-add">
          Записать
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="muted center">Заметок по рядам пока нет.</p>
      ) : (
        <ul className="notes" data-testid="note-list">
          {notes.map((n) => (
            <li key={n.id} className="note" data-testid="note-item">
              <span className="note-row-tag" data-testid="note-row">ряд {n.row}</span>
              <span className="note-text" data-testid="note-text">{n.text}</span>
              <button
                type="button"
                className="icon-btn small"
                onClick={() => update(project.id, (p) => removeRowNote(p, n.id))}
                aria-label="Удалить заметку"
                data-testid="note-delete"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="field">
        <span className="field-label">Общие заметки к проекту</span>
        <textarea
          rows={5}
          value={general}
          onChange={(e) => setGeneral(e.target.value)}
          onBlur={() => general !== project.notes && update(project.id, (p) => touch({ ...p, notes: general }))}
          placeholder="Схема, размеры, ссылки"
          data-testid="general-notes"
        />
      </label>
    </section>
  );
}
