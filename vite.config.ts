import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      ssr: {
        noExternal: ['react-helmet-async'],
      },
      server: {
        port: 3009,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            // ローカル開発時は dev-api.mjs (3010) に転送してStripeなどのサーバー処理を実行
            // NOTE: Vite本体が3010に退避するケースがあるため、dev-apiは3011をデフォルトにする
            target: 'http://localhost:3011',
            changeOrigin: true,
          },
        },
      },
      plugins: [react(), tailwindcss()],
      build: {
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              if (id.includes('node_modules')) {
                if (id.includes('react-dom') || id.includes('react/')) return 'vendor-react';
                if (id.includes('@stripe')) return 'vendor-stripe';
                if (id.includes('@supabase')) return 'vendor-supabase';
              }
            },
          },
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
