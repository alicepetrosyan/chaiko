import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()], 
  server: {
    host: "0.0.0.0",
    proxy: {
      // '/api': 'http://192.168.0.185:8000', // apartment network IP address
      '/api': 'http://localhost:8000',
    },
  },
})
