import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend used by `npm run dev` (override with VITE_DEV_API_TARGET=http://host:port).
const apiTarget = process.env.VITE_DEV_API_TARGET || 'http://localhost:5000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
      '/uploads': { target: apiTarget, changeOrigin: true },
    },
  },
})
