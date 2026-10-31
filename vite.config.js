import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { manejarApi } from './servidor/api.js'

// `npm run dev` sirve la página y también la API de registros.
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
  server: {
    // La página de GitHub Pages busca la API en este puerto (src/servicios/datos.js).
    port: 5173,
    // Los permisos CORS de la API los decide servidor/api.js (Vite solo permitiría páginas de localhost).
    cors: false,
    // La carpeta está en OneDrive, donde los eventos de archivos no siempre llegan; el sondeo evita servir código viejo.
    watch: { usePolling: true, interval: 300 },
  },
})
