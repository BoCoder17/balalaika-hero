import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: 'public',
  server: {
    port: 3000,
    strictPort: true,
  },
  appType: 'mpa' 
});