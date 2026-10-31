const pad = (n) => String(n).padStart(2, '0')

const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1)

export const aISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const hoy = () => aISO(new Date())

export const formatoFecha = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export const fechaLarga = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return capitalizar(
    new Date(y, m - 1, d).toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  )
}

export const nombreMes = (anio, mes) =>
  `${capitalizar(new Date(anio, mes, 1).toLocaleString('es-CO', { month: 'long' }))} ${anio}`

export const FORMATO_ESCRITO = /^\d{1,2}\/\d{1,2}\/\d{4}$/

// Convierte "dd/mm/aaaa" en "aaaa-mm-dd"; devuelve '' si la fecha no existe.
export const leerFechaEscrita = (texto) => {
  if (!FORMATO_ESCRITO.test(texto.trim())) return ''
  const [d, mes, y] = texto.trim().split('/').map(Number)
  const f = new Date(y, mes - 1, d)
  if (f.getFullYear() !== y || f.getMonth() !== mes - 1 || f.getDate() !== d) return ''
  return aISO(f)
}

// Agrega las barras automáticamente mientras se escribe la fecha.
export const enmascararFecha = (valor, anterior) => {
  let v = valor.replace(/[^\d/]/g, '').replace(/\/{2,}/g, '/')
  if (/^\d{8}$/.test(v)) v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`
  const partes = v.split('/')
  if (partes.length > 3) v = partes.slice(0, 3).join('/')
  const actuales = v.split('/')
  if (v.length > anterior.length && actuales.length < 3 && actuales.at(-1).length === 2) v += '/'
  return v.slice(0, 10)
}
