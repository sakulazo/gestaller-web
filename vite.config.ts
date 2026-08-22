import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// En Docker apunta a http://api:8000 (nombre de servicio); en local, a localhost.
const proxyTarget = process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:8000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
    // Activa solo si el hot-reload no detecta cambios dentro de Docker:
    // watch: { usePolling: true },
  },
})
