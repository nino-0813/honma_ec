import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3009,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3009',
            changeOrigin: true,
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                // APIリクエストを処理
                if (req.method === 'POST' && req.url === '/api/send-email') {
                  // リクエストボディを読み取る
                  let body = '';
                  req.on('data', (chunk) => {
                    body += chunk.toString();
                  });
                  req.on('end', () => {
                    // ここでResend APIを直接呼び出す
                    // ただし、セキュリティ上、サーバーサイドで処理する方が良い
                  });
                }
              });
            },
          },
        },
      },
      plugins: [react()],
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
