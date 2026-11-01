import { useRef, useState, type ChangeEvent } from 'react';
import { BackupError, createBackup, parseBackup } from '../domain/backup';
import type { Project } from '../domain/types';
import { useStore } from './store';
import { ConfirmDialog, TopBar } from './common';
import { Frog } from './Frog';

export function Settings() {
  const { projects, replaceAll } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Project[] | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const exportData = () => {
    const backup = createBackup(projects ?? []);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kva-schet-${backup.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ kind: 'ok', text: `Сохранено проектов: ${backup.projects.length}` });
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPending(parseBackup(await file.text()));
      setMessage(null);
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof BackupError ? err.message : 'Не удалось прочитать файл' });
    }
  };

  return (
    <>
      <TopBar title="Настройки" back="/" />
      <main className="page">
        <section className="card-like">
          <h3>Резервная копия</h3>
          <p className="muted">
            Всё хранится только в этом браузере. Делай копию, чтобы перенести проекты на другое устройство или не потерять их при
            очистке браузера.
          </p>
          <div className="form-actions start">
            <button type="button" className="btn primary" onClick={exportData} data-testid="export">
              Скачать копию
            </button>
            <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()} data-testid="import">
              Загрузить из файла
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} data-testid="import-file" />
          </div>
          {message && (
            <p className={message.kind === 'ok' ? 'ok-text' : 'field-error'} role="status" data-testid="backup-message">
              {message.text}
            </p>
          )}
        </section>

        <section className="about">
          <Frog mood="happy" size={88} />
          <p>
            <strong>Ква-счёт</strong> v{__APP_VERSION__}
            <br />
            <span className="muted">Frogging — это когда распускаешь вязание: «rip it, rip it» 🐸</span>
          </p>
        </section>
      </main>
      <ConfirmDialog
        open={pending !== null}
        title="Заменить все данные?"
        text={`В файле проектов: ${pending?.length ?? 0}. Текущие проекты (${projects?.length ?? 0}) будут заменены.`}
        confirmLabel="Заменить"
        danger
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          const ps = pending!;
          setPending(null);
          await replaceAll(ps);
          setMessage({ kind: 'ok', text: `Загружено проектов: ${ps.length}` });
        }}
      />
    </>
  );
}
