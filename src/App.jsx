import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ejecutarOperacion, encolar, esErrorDeRed, guardarRespaldo, obtenerRegistros } from './datos.js'

const MONTOS = { completo: 40000, medio: 20000 }
const ETIQUETAS = { completo: 'Día completo', medio: 'Medio día' }
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const pad = (n) => String(n).padStart(2, '0')
const aISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const hoy = () => aISO(new Date())

const formatoMoneda = (n) => '$' + n.toLocaleString('es-CO')

const formatoFecha = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1)

const fechaLarga = (iso) => {
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

const nombreMes = (anio, mes) =>
  `${capitalizar(new Date(anio, mes, 1).toLocaleString('es-CO', { month: 'long' }))} ${anio}`

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`

// Convierte "dd/mm/aaaa" en "aaaa-mm-dd"; devuelve '' si la fecha no existe.
const leerFechaEscrita = (texto) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto.trim())
  if (!m) return ''
  const [d, mes, y] = m.slice(1).map(Number)
  const f = new Date(y, mes - 1, d)
  if (f.getFullYear() !== y || f.getMonth() !== mes - 1 || f.getDate() !== d) return ''
  return aISO(f)
}

// Agrega las barras automáticamente mientras se escribe la fecha.
const enmascararFecha = (valor, anterior) => {
  let v = valor.replace(/[^\d/]/g, '').replace(/\/{2,}/g, '/')
  if (/^\d{8}$/.test(v)) v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`
  const partes = v.split('/')
  if (partes.length > 3) v = partes.slice(0, 3).join('/')
  const actuales = v.split('/')
  if (v.length > anterior.length && actuales.length < 3 && actuales.at(-1).length === 2) v += '/'
  return v.slice(0, 10)
}

const panel = 'bg-[#0f1729] border border-white/10 rounded-xl shadow-lg'
const campo =
  'w-full rounded-lg bg-[#1a2336] border border-white/10 px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400'

function Icono({ d, className = 'h-5 w-5', relleno = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill={relleno ? 'currentColor' : 'none'}
      stroke={relleno ? 'none' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  )
}

const ICONOS = {
  tarjeta: 'M3 5a2 2 0 0 0-2 2v1h22V7a2 2 0 0 0-2-2H3Zm20 5H1v7a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-7ZM4 15h5v2H4v-2Z',
  calendario: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  basura: 'M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14',
  check: 'm5 12 5 5L20 7',
  izquierda: 'm15 6-6 6 6 6',
  derecha: 'm9 6 6 6-6 6',
}

function Opciones({ etiqueta, opciones, valor, onCambiar }) {
  return (
    <div>
      <span className="block font-semibold mb-2">{etiqueta}</span>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={etiqueta}>
        {opciones.map((o) => {
          const activo = valor === o.valor
          return (
            <button
              key={String(o.valor)}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => onCambiar(o.valor)}
              className={`flex min-h-14 flex-col items-center justify-center rounded-lg border px-2 py-2 font-semibold transition ${
                activo
                  ? 'bg-yellow-400 text-black border-yellow-400'
                  : 'bg-[#1a2336] text-gray-200 border-white/15 hover:border-yellow-400'
              }`}
            >
              <span className="flex items-center gap-1">
                {activo && <Icono d={ICONOS.check} className="h-4 w-4" />}
                {o.titulo}
              </span>
              {o.detalle && <span className="text-sm font-normal">{o.detalle}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function EstadoPago({ pagado }) {
  return pagado ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2.5 py-0.5 text-xs font-bold text-black">
      <Icono d={ICONOS.check} className="h-3.5 w-3.5" />
      Pagado
    </span>
  ) : (
    <span className="inline-flex rounded-full border border-white/25 px-2.5 py-0.5 text-xs font-semibold text-gray-300">
      Pendiente
    </span>
  )
}

function Calendario({ vista, onCambiarMes, porFecha, fecha, onElegir }) {
  const { anio, mes } = vista
  const inicio = (new Date(anio, mes, 1).getDay() + 6) % 7
  const diasMes = new Date(anio, mes + 1, 0).getDate()
  const celdas = [
    ...Array(inicio).fill(null),
    ...Array.from({ length: diasMes }, (_, i) => aISO(new Date(anio, mes, i + 1))),
  ]
  const actual = hoy()

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-gray-300">
        <button type="button" onClick={() => onCambiarMes(-1)} aria-label="Mes anterior" className="rounded-md p-1.5 hover:bg-white/10 hover:text-yellow-400">
          <Icono d={ICONOS.izquierda} />
        </button>
        <span className="font-semibold">{nombreMes(anio, mes)}</span>
        <button type="button" onClick={() => onCambiarMes(1)} aria-label="Mes siguiente" className="rounded-md p-1.5 hover:bg-white/10 hover:text-yellow-400">
          <Icono d={ICONOS.derecha} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="bg-white/10 py-1.5 text-xs font-semibold text-gray-300 first:rounded-l-md last:rounded-r-md">
            {d}
          </div>
        ))}
        {celdas.map((iso, i) => {
          if (!iso) return <div key={`v${i}`} />
          const regs = porFecha[iso] ?? []
          const completo = regs.some((r) => r.tipo === 'completo')
          const medio = regs.some((r) => r.tipo === 'medio')
          const seleccionado = iso === fecha
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onElegir(iso)}
              aria-label={fechaLarga(iso)}
              aria-pressed={seleccionado}
              title={regs.map((r) => `${ETIQUETAS[r.tipo]} (${r.pagado ? 'pagado' : 'pendiente'})`).join(', ') || 'Sin registro'}
              className="group flex flex-col items-center pt-1"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition ${
                  completo ? 'bg-yellow-400 text-black' : 'group-hover:bg-white/10'
                } ${seleccionado ? (completo ? 'ring-2 ring-white' : 'ring-2 ring-yellow-400') : ''} ${
                  iso === actual && !completo ? 'text-yellow-400' : ''
                }`}
              >
                {Number(iso.slice(8))}
              </span>
              <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${medio ? 'bg-yellow-400' : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function App() {
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [fecha, setFecha] = useState(hoy)
  const [textoFecha, setTextoFecha] = useState(() => formatoFecha(hoy()))
  const [tipo, setTipo] = useState('completo')
  const [pagado, setPagado] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [ocupado, setOcupado] = useState('')
  const [sinServidor, setSinServidor] = useState(false)
  const [aviso, setAviso] = useState('')
  const [selectorAbierto, setSelectorAbierto] = useState(false)
  const [vista, setVista] = useState(() => {
    const d = new Date()
    return { anio: d.getFullYear(), mes: d.getMonth() }
  })
  const refFecha = useRef(null)

  const aplicarCarga = useCallback(({ datos, desconectado }) => {
    setRegistros(datos)
    setSinServidor(desconectado)
    setCargando(false)
  }, [])

  const recargar = useCallback(() => obtenerRegistros().then(aplicarCarga), [aplicarCarga])

  useEffect(() => {
    obtenerRegistros().then(aplicarCarga)
  }, [aplicarCarga])

  useEffect(() => {
    if (!sinServidor) return
    const id = setInterval(recargar, 10000)
    window.addEventListener('online', recargar)
    return () => {
      clearInterval(id)
      window.removeEventListener('online', recargar)
    }
  }, [sinServidor, recargar])

  useEffect(() => {
    if (!cargando) guardarRespaldo(registros)
  }, [registros, cargando])

  useEffect(() => {
    if (!aviso) return
    const id = setTimeout(() => setAviso(''), 3000)
    return () => clearTimeout(id)
  }, [aviso])

  // Si no hay conexión, guarda la operación para enviarla después. En ambos casos aplica el cambio en pantalla.
  const ejecutar = async (op, aplicarLocal) => {
    try {
      await ejecutarOperacion(op)
      setSinServidor(false)
    } catch (e) {
      if (!esErrorDeRed(e)) throw e
      encolar(op)
      setSinServidor(true)
    }
    aplicarLocal()
  }

  useEffect(() => {
    if (!selectorAbierto) return
    const cerrarFuera = (e) => {
      if (!refFecha.current?.contains(e.target)) setSelectorAbierto(false)
    }
    const cerrarEsc = (e) => e.key === 'Escape' && setSelectorAbierto(false)
    document.addEventListener('mousedown', cerrarFuera)
    document.addEventListener('keydown', cerrarEsc)
    return () => {
      document.removeEventListener('mousedown', cerrarFuera)
      document.removeEventListener('keydown', cerrarEsc)
    }
  }, [selectorAbierto])

  const ordenados = useMemo(
    () => [...registros].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creado - a.creado),
    [registros],
  )

  const porFecha = useMemo(() => {
    const mapa = {}
    for (const r of registros) (mapa[r.fecha] ??= []).push(r)
    return mapa
  }, [registros])

  const resumen = useMemo(() => {
    const mes = hoy().slice(0, 7)
    const delMes = registros.filter((r) => r.fecha.startsWith(mes))
    const pendientes = registros.filter((r) => !r.pagado)
    return {
      nombreMes: nombreMes(Number(mes.slice(0, 4)), Number(mes.slice(5)) - 1),
      completos: delMes.filter((r) => r.tipo === 'completo').length,
      medios: delMes.filter((r) => r.tipo === 'medio').length,
      total: delMes.reduce((s, r) => s + r.monto, 0),
      pagadoMes: delMes.filter((r) => r.pagado).reduce((s, r) => s + r.monto, 0),
      pendientes: pendientes.length,
      pendiente: pendientes.reduce((s, r) => s + r.monto, 0),
    }
  }, [registros])

  const irAMes = (iso) => {
    const [y, m] = iso.split('-').map(Number)
    setVista({ anio: y, mes: m - 1 })
  }

  const cambiarMes = (delta) =>
    setVista(({ anio, mes }) => {
      const d = new Date(anio, mes + delta, 1)
      return { anio: d.getFullYear(), mes: d.getMonth() }
    })

  const elegirFecha = (iso) => {
    setFecha(iso)
    setTextoFecha(formatoFecha(iso))
    setSelectorAbierto(false)
  }

  const escribirFecha = (valor) => {
    const texto = enmascararFecha(valor, textoFecha)
    setTextoFecha(texto)
    const iso = leerFechaEscrita(texto)
    setFecha(iso)
    if (iso) irAMes(iso)
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (guardando) return
    if (!fecha) return setError('Escribe una fecha válida con el formato dd/mm/aaaa.')
    if (tipo === 'medio' && !motivo.trim()) return setError('Escribe el motivo del medio día.')
    setGuardando(true)
    setError('')
    const nuevo = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      creado: Date.now(),
      fecha,
      tipo,
      monto: MONTOS[tipo],
      pagado,
      motivo: tipo === 'medio' ? motivo.trim() : '',
    }
    try {
      await ejecutar({ accion: 'crear', registro: nuevo }, () => setRegistros((prev) => [...prev, nuevo]))
      setAviso(`${ETIQUETAS[tipo]} guardado (${pagado ? 'pagado' : 'pendiente'}).`)
      setMotivo('')
      setTipo('completo')
      setPagado(false)
      elegirFecha(hoy())
      irAMes(hoy())
    } catch {
      setError('No se pudo guardar el registro. Revisa los datos e intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const cambiarPago = async (id, nuevoEstado) => {
    setOcupado(id || 'todos')
    setError('')
    try {
      await ejecutar({ accion: 'pago', id, pagado: nuevoEstado }, () =>
        setRegistros((prev) => prev.map((r) => (!id || r.id === id ? { ...r, pagado: nuevoEstado } : r))),
      )
    } catch {
      setError('No se pudo actualizar el estado del pago. Intenta de nuevo.')
    } finally {
      setOcupado('')
    }
  }

  const marcarTodo = () => {
    const texto = `¿Marcar ${plural(resumen.pendientes, 'registro pendiente', 'registros pendientes')} como pagado (${formatoMoneda(resumen.pendiente)})?`
    if (window.confirm(texto)) cambiarPago('', true)
  }

  const eliminar = async (r) => {
    if (!window.confirm(`¿Eliminar el registro del ${formatoFecha(r.fecha)} (${ETIQUETAS[r.tipo]})?`)) return
    setOcupado(r.id)
    setError('')
    try {
      await ejecutar({ accion: 'eliminar', id: r.id }, () => setRegistros((prev) => prev.filter((x) => x.id !== r.id)))
    } catch {
      setError('No se pudo eliminar el registro. Intenta de nuevo.')
    } finally {
      setOcupado('')
    }
  }

  const botonPago = (r) => (
    <button
      type="button"
      disabled={!!ocupado}
      onClick={() => cambiarPago(r.id, !r.pagado)}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-semibold disabled:opacity-50 ${
        r.pagado
          ? 'border-white/20 text-gray-300 hover:bg-white/10'
          : 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black'
      }`}
    >
      {r.pagado ? 'Marcar pendiente' : 'Marcar pagado'}
    </button>
  )

  const botonEliminar = (r) => (
    <button
      type="button"
      disabled={!!ocupado}
      onClick={() => eliminar(r)}
      aria-label={`Eliminar registro del ${formatoFecha(r.fecha)}`}
      className="inline-flex items-center gap-1.5 rounded-md border border-red-400/40 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/15 disabled:opacity-50"
    >
      <Icono d={ICONOS.basura} className="h-4 w-4" />
      Eliminar
    </button>
  )

  return (
    <div className="min-h-screen bg-[#0f1729] p-3 text-white sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <header className={`${panel} flex items-center gap-3 px-5 py-4`}>
          <Icono d={ICONOS.tarjeta} relleno className="h-7 w-7 text-yellow-400" />
          <span className="text-2xl font-extrabold tracking-wide text-yellow-400">PAGOS</span>
        </header>

        {sinServidor && (
          <p role="status" className="rounded-lg border border-yellow-400/50 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">
            No hay conexión con la base de datos MongoDB. Los cambios se guardan en este navegador y se pasarán a la base
            de datos cuando vuelva (abre <strong>iniciar.bat</strong> en el PC).
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1.1fr)]">
          <aside className={`${panel} p-5 md:col-span-2 xl:col-span-1`}>
            <h2 className="mb-4 text-2xl font-bold">Resumen</h2>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-lg border border-white/10 p-4">
                <p className="text-sm text-gray-400">Total del mes · {resumen.nombreMes}</p>
                <p className="mt-1 text-3xl font-bold text-yellow-400">{formatoMoneda(resumen.total)}</p>
                <p className="mt-2 text-sm text-gray-300">
                  {plural(resumen.completos, 'día completo', 'días completos')} x $40K
                  <br />+ {plural(resumen.medios, 'medio día', 'medios días')} x $20K
                </p>
              </div>
              <div className="rounded-lg border border-white/10 p-4">
                <p className="text-sm text-gray-400">Pagado este mes</p>
                <p className="mt-1 text-3xl font-bold text-white">{formatoMoneda(resumen.pagadoMes)}</p>
              </div>
              <div className="rounded-lg border border-white/10 p-4">
                <p className="text-sm text-gray-400">Pendiente por pagar</p>
                <p className="mt-1 text-3xl font-bold text-white">{formatoMoneda(resumen.pendiente)}</p>
                <p className="mt-1 text-sm text-gray-400">
                  {resumen.pendientes ? plural(resumen.pendientes, 'registro', 'registros') : 'Todo está pagado'}
                </p>
                {resumen.pendientes > 0 && (
                  <button
                    type="button"
                    disabled={!!ocupado}
                    onClick={marcarTodo}
                    className="mt-3 w-full rounded-lg border border-yellow-400 px-3 py-2 text-sm font-semibold text-yellow-400 hover:bg-yellow-400 hover:text-black disabled:opacity-50"
                  >
                    Marcar todo como pagado
                  </button>
                )}
              </div>
            </div>
          </aside>

          <section className={`${panel} p-5`}>
            <h2 className="text-2xl font-bold">Nuevo Registro</h2>
            <p className="mb-5 text-sm text-gray-400">Registra un nuevo pago diario</p>

            <form onSubmit={guardar} className="space-y-5" noValidate>
              <div className="relative" ref={refFecha}>
                <label htmlFor="fecha" className="mb-2 block font-semibold">
                  Fecha
                </label>
                <div className="flex gap-2">
                  <input
                    id="fecha"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="dd/mm/aaaa"
                    value={textoFecha}
                    onChange={(e) => escribirFecha(e.target.value)}
                    aria-invalid={!fecha}
                    aria-describedby="fecha-ayuda"
                    className={`${campo} ${!fecha && textoFecha ? 'border-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (fecha) irAMes(fecha)
                      setSelectorAbierto((v) => !v)
                    }}
                    aria-label="Abrir calendario"
                    aria-expanded={selectorAbierto}
                    className="shrink-0 rounded-lg border border-white/10 bg-[#1a2336] px-3 text-gray-300 hover:border-yellow-400 hover:text-yellow-400"
                  >
                    <Icono d={ICONOS.calendario} />
                  </button>
                </div>
                <p id="fecha-ayuda" className={`mt-1 text-xs ${fecha || !textoFecha ? 'text-gray-400' : 'text-red-300'}`}>
                  {fecha
                    ? fechaLarga(fecha)
                    : /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(textoFecha)
                      ? 'Esa fecha no existe'
                      : 'Escribe la fecha como dd/mm/aaaa'}
                </p>
                {selectorAbierto && (
                  <div className="absolute left-0 right-0 z-20 mt-2 rounded-xl border border-white/10 bg-[#0f1729] p-4 shadow-2xl sm:right-auto sm:w-80">
                    <Calendario vista={vista} onCambiarMes={cambiarMes} porFecha={porFecha} fecha={fecha} onElegir={elegirFecha} />
                    <div className="mt-3 flex justify-between text-sm">
                      <button type="button" onClick={() => setSelectorAbierto(false)} className="text-gray-400 hover:text-white">
                        Cerrar
                      </button>
                      <button type="button" onClick={() => elegirFecha(hoy())} className="font-semibold text-yellow-400 hover:text-yellow-300">
                        Hoy
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <Opciones
                etiqueta="Tipo de Día"
                valor={tipo}
                onCambiar={setTipo}
                opciones={Object.keys(MONTOS).map((t) => ({ valor: t, titulo: ETIQUETAS[t], detalle: formatoMoneda(MONTOS[t]) }))}
              />

              <div>
                <label htmlFor="monto" className="mb-2 block font-semibold">
                  Monto
                </label>
                <input id="monto" type="text" disabled value={formatoMoneda(MONTOS[tipo])} className={`${campo} text-lg font-semibold disabled:text-white`} />
                <span className="mt-1 block text-xs text-gray-400">Calculado automáticamente según el tipo de día</span>
              </div>

              {tipo === 'medio' && (
                <div>
                  <label htmlFor="motivo" className="mb-2 block font-semibold">
                    Motivo Medio Día
                  </label>
                  <textarea
                    id="motivo"
                    required
                    rows={3}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej: Salida médica, permiso personal..."
                    className={`${campo} resize-y`}
                  />
                </div>
              )}

              <Opciones
                etiqueta="Estado del pago"
                valor={pagado}
                onCambiar={setPagado}
                opciones={[
                  { valor: false, titulo: 'Pendiente' },
                  { valor: true, titulo: 'Pagado' },
                ]}
              />

              <button
                type="submit"
                disabled={guardando}
                className="w-full rounded-lg bg-yellow-400 py-3 text-lg font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Guardar Registro'}
              </button>
              {aviso && (
                <p role="status" className="flex items-center justify-center gap-1.5 text-sm font-semibold text-yellow-400">
                  <Icono d={ICONOS.check} className="h-4 w-4" />
                  {aviso}
                </p>
              )}
            </form>
          </section>

          <section className={`${panel} p-5`}>
            <h2 className="mb-3 text-2xl font-bold">Calendario de Pagos</h2>
            <Calendario vista={vista} onCambiarMes={cambiarMes} porFecha={porFecha} fecha={fecha} onElegir={elegirFecha} />
            <div className="mt-4 space-y-1.5 text-xs text-gray-400">
              <p className="flex items-center gap-2">
                <span className="flex w-3 justify-center"><span className="h-3 w-3 rounded-full bg-yellow-400" /></span>
                Día completo
              </p>
              <p className="flex items-center gap-2">
                <span className="flex w-3 justify-center"><span className="h-1.5 w-1.5 rounded-full bg-yellow-400" /></span>
                Medio día
              </p>
              <p>Toca un día para usarlo como fecha del registro.</p>
            </div>
          </section>
        </div>

        <section className={`${panel} p-5`}>
          <h2 className="mb-4 text-2xl font-bold">Registros recientes</h2>
          {cargando ? (
            <p className="text-sm text-gray-400">Cargando registros...</p>
          ) : ordenados.length === 0 ? (
            <p className="text-sm text-gray-400">No hay registros todavía.</p>
          ) : (
            <>
              <ul className="space-y-3 md:hidden">
                {ordenados.map((r) => (
                  <li key={r.id} className="rounded-lg border border-white/10 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{formatoFecha(r.fecha)}</p>
                        <p className="text-sm text-gray-400">{ETIQUETAS[r.tipo]}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-400">{formatoMoneda(r.monto)}</p>
                        <EstadoPago pagado={r.pagado} />
                      </div>
                    </div>
                    {r.motivo && <p className="mt-2 text-sm text-gray-300">Motivo: {r.motivo}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {botonPago(r)}
                      {botonEliminar(r)}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-gray-400">
                    <tr>
                      <th className="px-3 py-2 font-semibold">FECHA</th>
                      <th className="px-3 py-2 font-semibold">TIPO</th>
                      <th className="px-3 py-2 font-semibold">MONTO</th>
                      <th className="px-3 py-2 font-semibold">MOTIVO</th>
                      <th className="px-3 py-2 font-semibold">ESTADO</th>
                      <th className="px-3 py-2 text-right font-semibold">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenados.map((r) => (
                      <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                        <td className="whitespace-nowrap px-3 py-3">{formatoFecha(r.fecha)}</td>
                        <td className="whitespace-nowrap px-3 py-3">{ETIQUETAS[r.tipo]}</td>
                        <td className="whitespace-nowrap px-3 py-3 font-semibold text-yellow-400">{formatoMoneda(r.monto)}</td>
                        <td className="px-3 py-3 text-gray-300">{r.motivo || '—'}</td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <EstadoPago pagado={r.pagado} />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            {botonPago(r)}
                            {botonEliminar(r)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
