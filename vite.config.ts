import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: 'public', // Явно указываем папку со статикой
  server: {
    port: 3000,
    strictPort: true, // Чтобы он не прыгал на другой порт
  },
  // Это поможет избежать отдачи index.html вместо 404 для ассетов
  appType: 'mpa' 
});