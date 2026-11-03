import { access } from 'node:fs/promises'
import { crearServidor } from './http.js'

if (!process.env.MONGODB_URI) {
  throw new Error('Configura MONGODB_URI antes de iniciar el servidor.')
}
await access(new URL('../dist/index.html', import.meta.url))

const puerto = Number(process.env.PORT || 3000)
if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
  throw new Error('PORT debe ser un puerto válido.')
}
const servidor = crearServidor()
servidor.on('error', (error) => {
  console.error('No se pudo iniciar PAGOS:', error)
  process.exitCode = 1
})
servidor.listen(puerto, '0.0.0.0', () => {
  console.log(`PAGOS disponible en el puerto ${puerto}`)
})
