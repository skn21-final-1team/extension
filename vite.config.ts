import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
// manifest 타입 오류는 @crxjs/vite-plugin 버전 차이로 인한 것으로, 빌드에는 영향 없음
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import manifest from './manifest.json';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      // @ 를 src 폴더로 매핑 (shadcn 컴포넌트 경로용)
      '@': new URL('./src', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
    },
  },
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
        forms: 'src/forms/index.html',
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
