import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { manejarApi } from './servidor/api.js'

// En desarrollo (npm run dev) la API corre dentro del servidor de Vite.
const api = {
  name: 'registros-api',
  configureServer(server) {
    server.middlewares.use(manejarApi)
  },
}

export default defineConfig({
  // Rutas relativas para que funcione en https://baez91876-ship-it.github.io/PAGOS/
  base: './',
  plugins: [react(), tailwindcss(), api],
  // La carpeta est? en OneDrive, donde los eventos de archivos no siempre llegan; el sondeo evita servir c?digo viejo.
  server: { watch: { usePolling: true, interval: 300 } },
})
