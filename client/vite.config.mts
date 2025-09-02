import { defineConfig, normalizePath } from 'vite';
import react from '@vitejs/plugin-react';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    monacoEditorPlugin.default({}),
    viteStaticCopy({
      targets: [
        {
          src: normalizePath(path.resolve(__dirname, '../node_modules/monaco-editor/min/vs')),
          dest: 'assets/monaco-editor/min',
        },
      ],
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
    port: 3000
  },
  build: {
    outDir: 'build'
  }
});