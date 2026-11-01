import { useEffect, useRef, type ReactNode } from 'react';
import { Frog } from './Frog';

export function TopBar({ title, back, actions }: { title: ReactNode; back?: string; actions?: ReactNode }) {
  return (
    <header className="topbar">
      {back !== undefined ? (
        <a className="icon-btn" href={`#${back}`} aria-label="Назад" data-testid="back">
          ‹
        </a>
      ) : (
        <span className="topbar-logo">
          <Frog size={34} />
        </span>
      )}
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-actions">{actions}</div>
    </header>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  text?: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Своё модальное окно вместо window.confirm — удобнее тестировать и красивее. */
export function ConfirmDialog({ open, title, text, confirmLabel, danger, onConfirm, onCancel }: ConfirmProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" onCancel={onCancel} data-testid="confirm-dialog" aria-labelledby="confirm-title">
      <Frog mood="alert" size={64} />
      <h2 id="confirm-title">{title}</h2>
      {text && <p>{text}</p>}
      <div className="dialog-actions">
        <button type="button" className="btn ghost" onClick={onCancel} data-testid="confirm-cancel">
          Отмена
        </button>
        <button type="button" className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm} data-testid="confirm-ok">
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

/** "12" → 12, "" → null, мусор → NaN (форма покажет ошибку). */
export function parseOptionalNumber(raw: string): number | null {
  const s = raw.trim().replace(',', '.');
  if (s === '') return null;
  return Number(s);
}
