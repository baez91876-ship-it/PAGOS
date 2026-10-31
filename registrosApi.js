import { MongoClient } from 'mongodb'

const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const BASE = process.env.MONGODB_DB || 'PAGOS'
const MONTOS = { completo: 40000, medio: 20000 }
const SIN_ID = { projection: { _id: 0 } }

let conexion

// Conecta una sola vez; si MongoDB está apagado, el próximo pedido vuelve a intentarlo.
const coleccion = () => {
  conexion ??= (async () => {
    const cliente = new MongoClient(URI, { serverSelectionTimeoutMS: 3000 })
    await cliente.connect()
    const col = cliente.db(BASE).collection('registros')
    await col.createIndex({ id: 1 }, { unique: true })
    return col
  })().catch((e) => {
    conexion = undefined
    throw e
  })
  return conexion
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

const esFechaValida = (iso) => {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const [y, m, d] = iso.split('-').map(Number)
  const f = new Date(y, m - 1, d)
  return f.getFullYear() === y && f.getMonth() === m - 1 && f.getDate() === d
}

export const manejarApi = async (req, res, next) => {
  if (!req.url?.startsWith('/api/registros')) return next()
  // Permite que la página publicada en GitHub Pages use esta API desde el mismo PC.
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Private-Network', 'true')
  if (req.method === 'OPTIONS') return res.writeHead(204).end()

  let col
  try {
    col = await coleccion()
  } catch {
    return responder(res, 503, { error: 'MongoDB no está encendido' })
  }

  try {
    const id = decodeURIComponent(req.url.split('?')[0].split('/')[3] ?? '')

    if (req.method === 'GET') return responder(res, 200, await col.find({}, SIN_ID).toArray())

    if (req.method === 'PATCH') {
      const { pagado } = JSON.parse((await leerBody(req)) || '{}')
      if (typeof pagado !== 'boolean') return responder(res, 400, { error: 'Estado inválido' })
      if (id) {
        const { matchedCount } = await col.updateOne({ id }, { $set: { pagado } })
        if (!matchedCount) return responder(res, 404, { error: 'Registro no encontrado' })
      } else {
        await col.updateMany({}, { $set: { pagado } })
      }
      return responder(res, 200, { ok: true })
    }

    if (req.method === 'DELETE') {
      const { deletedCount } = id ? await col.deleteOne({ id }) : { deletedCount: 0 }
      return responder(res, deletedCount ? 200 : 404, { ok: deletedCount > 0 })
    }

    if (req.method === 'POST') {
      const { id: nuevoId, creado, fecha, tipo, motivo, pagado } = JSON.parse(await leerBody(req))
      if (!esFechaValida(fecha) || !MONTOS[tipo]) return responder(res, 400, { error: 'Datos inválidos' })
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
      await col.updateOne({ id: registro.id }, { $setOnInsert: registro }, { upsert: true })
      return responder(res, 201, registro)
    }
    responder(res, 405, { error: 'Método no permitido' })
  } catch (e) {
    console.error(e)
    responder(res, 500, { error: 'Error del servidor' })
  }
}

export default function registrosApi() {
  return {
    name: 'registros-api',
    configureServer(server) {
      server.middlewares.use(manejarApi)
    },
    configurePreviewServer(server) {
      server.middlewares.use(manejarApi)
    },
  }
}
