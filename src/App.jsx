import { useCallback, useEffect, useMemo, useState } from 'react'
import Calendario from './componentes/Calendario.jsx'
import FormularioRegistro from './componentes/FormularioRegistro.jsx'
import Icono from './componentes/Icono.jsx'
import ListaRegistros from './componentes/ListaRegistros.jsx'
import Resumen from './componentes/Resumen.jsx'
import { ejecutarOperacion, encolar, esErrorDeRed, guardarRespaldo, obtenerRegistros } from './servicios/datos.js'
import { enmascararFecha, formatoFecha, hoy, leerFechaEscrita } from './utilidades/fechas.js'
import { ETIQUETAS, MONTOS } from './utilidades/pagos.js'

const mesDe = (iso) => {
  const [y, m] = iso.split('-').map(Number)
  return { anio: y, mes: m - 1 }
}

export default function App() {
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [sinServidor, setSinServidor] = useState(false)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState('')
  const [fecha, setFecha] = useState(hoy)
  const [textoFecha, setTextoFecha] = useState(() => formatoFecha(hoy()))
  const [vista, setVista] = useState(() => mesDe(hoy()))

  const aplicarCarga = useCallback(({ datos, desconectado }) => {
    setRegistros(datos)
    setSinServidor(desconectado)
    setCargando(false)
  }, [])

  const recargar = useCallback(() => obtenerRegistros().then(aplicarCarga), [aplicarCarga])

  useEffect(() => {
    recargar()
  }, [recargar])

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

  const ordenados = useMemo(
    () => [...registros].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creado - a.creado),
    [registros],
  )

  const porFecha = useMemo(() => {
    const mapa = {}
    for (const r of registros) (mapa[r.fecha] ??= []).push(r)
    return mapa
  }, [registros])

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

  const elegirFecha = (iso) => {
    setFecha(iso)
    setTextoFecha(formatoFecha(iso))
  }

  const escribirFecha = (valor) => {
    const texto = enmascararFecha(valor, textoFecha)
    setTextoFecha(texto)
    const iso = leerFechaEscrita(texto)
    setFecha(iso)
    if (iso) setVista(mesDe(iso))
  }

  const cambiarMes = (delta) =>
    setVista(({ anio, mes }) => {
      const d = new Date(anio, mes + delta, 1)
      return { anio: d.getFullYear(), mes: d.getMonth() }
    })

  const crear = async ({ tipo, motivo }) => {
    setError('')
    const nuevo = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      creado: Date.now(),
      fecha,
      tipo,
      monto: MONTOS[tipo],
      pagado: false,
      motivo,
    }
    try {
      await ejecutar({ accion: 'crear', registro: nuevo }, () => setRegistros((prev) => [...prev, nuevo]))
      elegirFecha(hoy())
      setVista(mesDe(hoy()))
      return true
    } catch {
      setError('No se pudo guardar el registro. Revisa los datos e intenta de nuevo.')
      return false
    }
  }

  const cambiarPago = async (id, pagado) => {
    setOcupado(id || 'todos')
    setError('')
    try {
      await ejecutar({ accion: 'pago', id, pagado }, () =>
        setRegistros((prev) => prev.map((r) => (!id || r.id === id ? { ...r, pagado } : r))),
      )
    } catch {
      setError('No se pudo actualizar el estado del pago. Intenta de nuevo.')
    } finally {
      setOcupado('')
    }
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

  const calendario = { vista, onCambiarMes: cambiarMes, porFecha, fecha, onElegir: elegirFecha }

  return (
    <div className="min-h-screen p-3 text-white sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <header className="panel flex items-center gap-3 py-4">
          <Icono nombre="tarjeta" relleno className="h-7 w-7 text-yellow-400" />
          <span className="text-2xl font-extrabold tracking-wide text-yellow-400">PAGOS</span>
        </header>

        {sinServidor && (
          <p role="status" className="aviso">
            No hay conexión con la base de datos MongoDB. Los cambios se guardan en este navegador y se pasarán a la base
            de datos cuando vuelva (ejecuta <strong>npm start</strong> en el PC).
          </p>
        )}

        {error && (
          <p role="alert" className="alerta">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1.1fr)]">
          <Resumen registros={registros} ocupado={!!ocupado} onMarcarTodo={() => cambiarPago('', true)} />

          <FormularioRegistro
            campoFecha={{ fecha, textoFecha, onEscribir: escribirFecha, onAbrir: () => fecha && setVista(mesDe(fecha)), calendario }}
            onGuardar={crear}
            onError={setError}
          />

          <section className="panel">
            <h2 className="titulo mb-3">Calendario de Pagos</h2>
            <Calendario {...calendario} />
            <div className="mt-4 space-y-1.5 text-xs text-gray-400">
              <p className="flex items-center gap-2">
                <span className="flex w-3 justify-center">
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                </span>
                Día completo
              </p>
              <p className="flex items-center gap-2">
                <span className="flex w-3 justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                </span>
                Medio día
              </p>
              <p>Toca un día para usarlo como fecha del registro.</p>
            </div>
          </section>
        </div>

        <ListaRegistros
          registros={ordenados}
          cargando={cargando}
          ocupado={!!ocupado}
          onCambiarPago={cambiarPago}
          onEliminar={eliminar}
        />
      </div>
    </div>
  )
}
