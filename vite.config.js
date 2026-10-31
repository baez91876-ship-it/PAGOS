import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import registrosApi from './registrosApi.js'

export default defineConfig({
  plugins: [react(), tailwindcss(), registrosApi()],
  // La carpeta está en OneDrive, donde los eventos de archivos no siempre llegan; el sondeo evita servir código viejo.
  server: { watch: { ignored: ['**/data/**'], usePolling: true, interval: 300 } },
})
