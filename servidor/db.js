import { existsSync } from 'node:fs'
import { MongoClient } from 'mongodb'

// La conexión de Atlas (con contraseña) vive en .env.local, que no se sube a GitHub.
const ENV = new URL('../.env.local', import.meta.url)
if (existsSync(ENV)) process.loadEnvFile(ENV)

const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const BASE = process.env.MONGODB_DB || 'PAGOS'
const COLECCION = process.env.MONGODB_COLECCION || 'registros'

let conexion

// Conecta una sola vez; si la conexión falla, el próximo pedido vuelve a intentarlo.
export const coleccion = () => {
  conexion ??= (async () => {
    const cliente = new MongoClient(URI, { serverSelectionTimeoutMS: 10000 })
    await cliente.connect()
    const col = cliente.db(BASE).collection(COLECCION)
    await col.createIndex({ id: 1 }, { unique: true })
    return col
  })().catch((e) => {
    conexion = undefined
    throw e
  })
  return conexion
}
