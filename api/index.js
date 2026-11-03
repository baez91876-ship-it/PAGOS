import { resolve } from 'node:path'
import { crearManejador } from '../servidor/http.js'

let manejar

export default function handler(req, res) {
  if (!process.env.MONGODB_URI || !process.env.APP_USUARIO || !process.env.APP_CLAVE) {
    console.error('Faltan MONGODB_URI, APP_USUARIO o APP_CLAVE en Vercel.')
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
    return res.end('Configura las variables privadas del servidor y vuelve a desplegar.')
  }
  manejar ??= crearManejador({ carpeta: resolve(process.cwd(), 'dist') })
  return manejar(req, res)
}
