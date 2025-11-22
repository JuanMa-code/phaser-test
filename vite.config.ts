import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '/phaser-test',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: '404.html', dest: '.' }, // Copia 404.html a dist/
      ]
    })
  ],
  build: {
    outDir: 'dist',
  },
});