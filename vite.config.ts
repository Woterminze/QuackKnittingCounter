import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// BASE_PATH задаётся в GitHub Actions: для Pages это "/<имя-репозитория>/".
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? 'dev'),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['frog.svg'],
      manifest: {
        name: 'Ква-счёт — счётчик рядов',
        short_name: 'Ква-счёт',
        description: 'Счётчик рядов и дневник вязальных проектов',
        lang: 'ru',
        theme_color: '#5b9a5d',
        background_color: '#fbf7ee',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'frog.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
