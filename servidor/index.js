import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { manejarApi } from './api.js'

const PUERTO = Number(process.env.PORT) || 3001
const DIST = path.resolve(import.meta.dirname, '..', 'dist')
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

const servirArchivo = (req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let archivo = path.join(DIST, ruta)
  if (!archivo.startsWith(DIST) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) {
    archivo = path.join(DIST, 'index.html')
  }
  if (!fs.existsSync(archivo)) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    return res.end('Falta compilar la página: ejecuta npm run build')
  }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] ?? 'application/octet-stream' })
  fs.createReadStream(archivo).pipe(res)
}

http
  .createServer((req, res) => manejarApi(req, res, () => servirArchivo(req, res)))
  .listen(PUERTO, () => console.log(`PAGOS listo en http://localhost:${PUERTO}`))
