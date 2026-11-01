# 🐸 Ква-счёт

Счётчик рядов и дневник вязальных проектов. PWA, работает офлайн, данные хранятся в браузере (IndexedDB).

## Запуск

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit (Vitest)
npm run test:e2e     # e2e (Playwright), сам соберёт и поднимет preview
```

## Структура

- `src/domain` — чистая логика: типы, движок правил «каждые N рядов», бэкап
- `src/storage` — `ProjectRepository` + реализация на Dexie
- `src/ui` — экраны React; на ключевых элементах есть `data-testid`
- `tests` — unit-тесты, `e2e` — Playwright
