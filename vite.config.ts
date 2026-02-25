import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  build: {
    outDir: 'dist',
    minify: mode === 'production' ? 'terser' : false,
    sourcemap: mode === 'development',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  define: {
    __DEV__: mode === 'development',
  },
}));
