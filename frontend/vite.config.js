import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawTarget =
    env.NEXT_PUBLIC_API_URL|| 'http://localhost:6000';
  const target = rawTarget.replace(/\/$/, '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
        },
      },
      allowedHosts: ['localhost', '127.0.0.1', 'mjay.local', 'HTSs-Mac-mini.local', 'htss-mac-mini.local' ,'htsnas.local'],
    },
    preview: {
      port: 4173,
    },
  };
});
