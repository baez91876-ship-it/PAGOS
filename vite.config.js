import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import registrosApi from './registrosApi.js'

export default defineConfig({
  plugins: [react(), tailwindcss(), registrosApi()],
  server: { watch: { ignored: ['**/data/**'] } },
})
