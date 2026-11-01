import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { StoreProvider } from './ui/store';
import { DexieRepository } from './storage/dexieRepository';
import { initTheme } from './ui/theme';
import './styles.css';

initTheme();
const repo = new DexieRepository();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider repo={repo}>
      <App />
    </StoreProvider>
  </StrictMode>,
);
