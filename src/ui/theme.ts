export type Theme = 'auto' | 'light' | 'dark';

export const THEME_LABELS: Record<Theme, string> = {
  auto: 'Как в системе',
  light: 'Светлая',
  dark: 'Тёмная',
};

// Тот же ключ читает скрипт в index.html: он ставит тему до первой отрисовки.
const KEY = 'kva-theme';
const systemDark = matchMedia('(prefers-color-scheme: dark)');

export function getTheme(): Theme {
  const saved = localStorage.getItem(KEY);
  return saved === 'light' || saved === 'dark' ? saved : 'auto';
}

function applyTheme(): void {
  const theme = getTheme();
  const dark = theme === 'dark' || (theme === 'auto' && systemDark.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(KEY, theme);
  applyTheme();
}

export function initTheme(): void {
  applyTheme();
  systemDark.addEventListener('change', applyTheme);
}
