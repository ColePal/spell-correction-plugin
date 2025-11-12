import { defineConfig } from 'vite';
// @ts-ignore
import path from 'path';

export default defineConfig({
  build: {
    outDir: path.resolve(__dirname, '../static'), // base static directory
    emptyOutDir: false, // don't delete existing static assets
    manifest: true,
    rolldownOptions: {
      input: path.resolve(__dirname, 'src/main.ts'),
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(css)$/.test(name ?? '')) {
            return 'css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  base: '/static/',
});