import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// HARDCODED TO LOCALHOST ONLY - NO PRODUCTION URLS
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',  // Force localhost
    port: 5173,
    strictPort: true,   // Fail if port is in use
    proxy: {
      '/api': {
        target: 'http://localhost:3000',  // HARDCODED
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:3000',  // HARDCODED
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    host: 'localhost',  // Force localhost for preview too
    port: 4173,
  }
})
