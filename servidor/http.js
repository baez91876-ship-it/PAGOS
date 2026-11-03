import { createHash, timingSafeEqual } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { manejarApi } from './api.js'

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}
const hash = (valor) => createHash('sha256').update(valor).digest()

export const crearManejador = ({
  usuario = process.env.APP_USUARIO,
  clave = process.env.APP_CLAVE,
  carpeta = fileURLToPath(new URL('../dist/', import.meta.url)),
  api = manejarApi,
} = {}) => {
  if (!usuario || !clave || usuario.includes(':')) {
    throw new Error('Configura APP_USUARIO (sin dos puntos) y APP_CLAVE para proteger la aplicación.')
  }
  const autorizacion = hash(`Basic ${Buffer.from(`${usuario}:${clave}`).toString('base64')}`)

  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'same-origin')
    try {
      const { pathname } = new URL(req.url, 'http://localhost')
      if (pathname === '/health' && ['GET', 'HEAD'].includes(req.method)) {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
        return res.end('ok')
      }

      if (!timingSafeEqual(hash(req.headers.authorization || ''), autorizacion)) {
        res.writeHead(401, {
          'WWW-Authenticate': 'Basic realm="PAGOS", charset="UTF-8"',
          'Content-Type': 'text/plain; charset=utf-8',
        })
        return res.end('Se requiere usuario y contraseña.')
      }

      // Las credenciales del navegador no deben permitir escrituras desde otra página.
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin) {
        if (new URL(req.headers.origin).host !== req.headers.host) {
          res.writeHead(403)
          return res.end('Origen no permitido.')
        }
      }

      if (pathname === '/api/registros' || pathname.startsWith('/api/registros/')) {
        return await api(req, res, () => {
          res.writeHead(404)
          res.end('API no encontrada.')
        })
      }

      if (!['GET', 'HEAD'].includes(req.method)) {
        res.writeHead(405, { Allow: 'GET, HEAD' })
        return res.end('Método no permitido.')
      }
      let ruta
      try {
        ruta = decodeURIComponent(pathname)
      } catch {
        res.writeHead(400)
        return res.end('Ruta inválida.')
      }
      const archivo = resolve(carpeta, `.${ruta === '/' ? '/index.html' : ruta}`)
      const dentro = relative(carpeta, archivo)
      if (dentro === '..' || dentro.startsWith(`..${sep}`) || isAbsolute(dentro) || ruta.includes('\0')) {
        res.writeHead(403)
        return res.end('Ruta no permitida.')
      }
      let contenido
      try {
        contenido = await readFile(archivo)
      } catch (error) {
        if (!['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code)) throw error
        res.writeHead(404)
        return res.end('Archivo no encontrado.')
      }
      res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] || 'application/octet-stream' })
      res.end(req.method === 'HEAD' ? undefined : contenido)
    } catch (error) {
      console.error('Error al atender la solicitud:', error)
      if (!res.headersSent) res.writeHead(500)
      res.end('Error del servidor.')
    }
  }
}

export const crearServidor = (opciones) => createServer(crearManejador(opciones))
