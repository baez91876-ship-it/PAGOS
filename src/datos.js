import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY

// Si la red se queda colgada, la petición falla a los 15 s y se trata como falta de conexión.
const fetchConLimite = (recurso, opciones = {}) => {
  const limite = AbortSignal.timeout(15000)
  const signal = opciones.signal ? AbortSignal.any([opciones.signal, limite]) : limite
  return fetch(recurso, { ...opciones, signal })
}

export const configurado = Boolean(url && clave)
export const supabase = configurado ? createClient(url, clave, { global: { fetch: fetchConLimite } }) : null

const TABLA = 'registros'
const COLUMNAS = 'id, creado, fecha, tipo, monto, motivo, pagado'
const COLA = 'pagos-cola-sincronizar'
const RESPALDO = 'pagos-respaldo'

export const leerLocal = (clave) => {
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
    // Almacenamiento lleno o bloqueado: la nube sigue siendo la copia principal.
  }
}

export const guardarRespaldo = (registros) => guardarLocal(RESPALDO, registros)

export const borrarDatosLocales = () => {
  localStorage.removeItem(RESPALDO)
  localStorage.removeItem(COLA)
}

export const encolar = (op) => guardarLocal(COLA, [...leerLocal(COLA), op])

export const esErrorDeRed = (e) =>
  e instanceof TypeError || /fetch|network|load failed|conexi|timeout|timed out|abort/i.test(e?.message ?? '')

const comprobar = ({ data, error }) => {
  if (error) throw error
  return data
}

export const ejecutarOperacion = async (op) => {
  const tabla = supabase.from(TABLA)
  if (op.accion === 'crear') {
    const { id, creado, fecha, tipo, motivo, pagado } = op.registro
    return comprobar(
      await tabla.upsert({ id, creado, fecha, tipo, motivo, pagado }, { onConflict: 'id', ignoreDuplicates: true }),
    )
  }
  if (op.accion === 'pago') {
    const consulta = tabla.update({ pagado: op.pagado })
    return comprobar(await (op.id ? consulta.eq('id', op.id) : consulta.eq('pagado', !op.pagado)))
  }
  if (op.accion === 'eliminar') return comprobar(await tabla.delete().eq('id', op.id))
  throw new Error(`Operación desconocida: ${op.accion}`)
}

// Envía a la nube los cambios hechos sin conexión; descarta los que la base de datos rechace.
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
    const datos = comprobar(await supabase.from(TABLA).select(COLUMNAS))
    return { datos, desconectado: false }
  } catch (e) {
    if (esErrorDeRed(e)) return { datos: leerLocal(RESPALDO), desconectado: true }
    console.error(e)
    return { datos: leerLocal(RESPALDO), desconectado: false, error: e.message || 'Error de la base de datos' }
  }
}
