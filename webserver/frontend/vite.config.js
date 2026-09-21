import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const frontendDirectory = dirname(fileURLToPath(import.meta.url));
  const env = loadEnv(mode, resolve(frontendDirectory, '..'), '');

  return {
  plugins: [react()], 
  define: {
    'import.meta.env.IP_ADDRESS': JSON.stringify(env.IP_ADDRESS),
  },
  server: {
    host: "0.0.0.0",
    proxy: {
      '/api': `http://${env.IP_ADDRESS}:8000`,
    },
  },
  };
})
