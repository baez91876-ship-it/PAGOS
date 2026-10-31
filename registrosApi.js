import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.resolve(import.meta.dirname, 'data')
const DATA_FILE = path.join(DATA_DIR, 'registros.json')

const leer = () => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

const escribir = (registros) => {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const tmp = DATA_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(registros, null, 2))
  fs.renameSync(tmp, DATA_FILE)
}

const leerBody = (req) =>
  new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })

const responder = (res, status, data) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

const MONTOS = { completo: 40000, medio: 20000 }

const normalizar = (r) => ({ ...r, pagado: r.pagado === true })

const esFechaValida = (iso) => {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const [y, m, d] = iso.split('-').map(Number)
  const f = new Date(y, m - 1, d)
  return f.getFullYear() === y && f.getMonth() === m - 1 && f.getDate() === d
}

const middleware = async (req, res, next) => {
  if (!req.url?.startsWith('/api/registros')) return next()
  try {
    const id = decodeURIComponent(req.url.split('?')[0].split('/')[3] ?? '')

    if (req.method === 'GET') return responder(res, 200, leer().map(normalizar))

    if (req.method === 'PATCH') {
      const { pagado } = JSON.parse((await leerBody(req)) || '{}')
      if (typeof pagado !== 'boolean') return responder(res, 400, { error: 'Estado inválido' })
      const registros = leer()
      if (id) {
        const registro = registros.find((r) => r.id === id)
        if (!registro) return responder(res, 404, { error: 'Registro no encontrado' })
        registro.pagado = pagado
      } else {
        for (const r of registros) r.pagado = pagado
      }
      escribir(registros)
      return responder(res, 200, registros.map(normalizar))
    }

    if (req.method === 'DELETE') {
      const registros = leer()
      const restantes = registros.filter((r) => r.id !== id)
      if (!id || restantes.length === registros.length) {
        return responder(res, 404, { error: 'Registro no encontrado' })
      }
      escribir(restantes)
      return responder(res, 200, { ok: true })
    }

    if (req.method === 'POST') {
      const { id: nuevoId, creado, fecha, tipo, motivo, pagado } = JSON.parse(await leerBody(req))
      const valida = esFechaValida(fecha)
      if (!valida || !MONTOS[tipo]) {
        return responder(res, 400, { error: 'Datos inválidos' })
      }
      if (tipo === 'medio' && !String(motivo ?? '').trim()) {
        return responder(res, 400, { error: 'Motivo requerido' })
      }
      const registro = {
        id: String(nuevoId || Date.now()),
        creado: Number(creado) || Date.now(),
        fecha,
        tipo,
        monto: MONTOS[tipo],
        motivo: tipo === 'medio' ? String(motivo).trim() : '',
        pagado: pagado === true,
      }
      const registros = leer()
      if (!registros.some((r) => r.id === registro.id)) {
        registros.push(registro)
        escribir(registros)
      }
      return responder(res, 201, registro)
    }
    responder(res, 405, { error: 'Método no permitido' })
  } catch {
    responder(res, 500, { error: 'Error del servidor' })
  }
}

export default function registrosApi() {
  return {
    name: 'registros-api',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
