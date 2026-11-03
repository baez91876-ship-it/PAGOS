// En Vercel la página y la API comparten origen; en desarrollo las atiende Vite.
const API = '/api/registros'
const COLA = 'pagos-cola-sincronizar'
const RESPALDO = 'pagos-respaldo'

const leerLocal = (clave) => {
  try {
    const v = JSON.parse(localStorage.getItem(clave))
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

const guardarLocal = (clave, valor) => {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    // Almacenamiento lleno o bloqueado: MongoDB sigue siendo la copia principal.
  }
}

export const guardarRespaldo = (registros) => guardarLocal(RESPALDO, registros)

export const encolar = (op) => guardarLocal(COLA, [...leerLocal(COLA), op])

// Sin `status` = no hubo conexión; 5xx = el servidor está encendido pero MongoDB no.
export const esErrorDeRed = (e) => !e.status || e.status >= 500

const pedir = async (method, ruta = '', body) => {
  const res = await fetch(API + ruta, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  })
  if (method === 'DELETE' && res.status === 404) return null
  if (!res.ok) throw Object.assign(new Error('Error del servidor'), { status: res.status })
  return res.json()
}

export const ejecutarOperacion = (op) => {
  const ruta = op.id ? `/${encodeURIComponent(op.id)}` : ''
  if (op.accion === 'crear') return pedir('POST', '', op.registro)
  if (op.accion === 'pago') return pedir('PATCH', ruta, { pagado: op.pagado })
  if (op.accion === 'eliminar') return pedir('DELETE', ruta)
  throw Object.assign(new Error(`Operación desconocida: ${op.accion}`), { status: 400 })
}

// Envía a MongoDB los cambios hechos sin conexión; descarta los que el servidor rechace por datos inválidos.
const sincronizarCola = async () => {
  const cola = leerLocal(COLA)
  while (cola.length) {
    try {
      await ejecutarOperacion(cola[0])
    } catch (e) {
      if (esErrorDeRed(e)) throw e
      console.error('Cambio descartado al sincronizar', cola[0], e)
    }
    cola.shift()
    guardarLocal(COLA, cola)
  }
}

export const obtenerRegistros = async () => {
  try {
    await sincronizarCola()
    return { datos: await pedir('GET'), desconectado: false }
  } catch {
    return { datos: leerLocal(RESPALDO), desconectado: true }
  }
}
