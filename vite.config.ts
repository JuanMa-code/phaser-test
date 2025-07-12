import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
   base: '/phaser-test/',
  plugins: [react()],
  root: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './src/main.tsx',
    },
  },
});
