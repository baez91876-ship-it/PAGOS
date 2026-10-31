import { useCallback, useEffect, useMemo, useState } from 'react'
import { ejecutarOperacion, encolar, esErrorDeRed, guardarRespaldo, obtenerRegistros } from '../servicios/datos.js'
import { MONTOS } from '../utilidades/pagos.js'

// Registros de la base de datos y las acciones para crearlos, marcarlos como pagados o eliminarlos.
export default function useRegistros() {
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [sinServidor, setSinServidor] = useState(false)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const recargar = useCallback(
    () =>
      obtenerRegistros().then(({ datos, desconectado }) => {
        setRegistros(datos)
        setSinServidor(desconectado)
        setCargando(false)
      }),
    [],
  )

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
  const ejecutar = async (op, aplicarLocal, mensajeError) => {
    setError('')
    try {
      try {
        await ejecutarOperacion(op)
        setSinServidor(false)
      } catch (e) {
        if (!esErrorDeRed(e)) throw e
        encolar(op)
        setSinServidor(true)
      }
      aplicarLocal()
      return true
    } catch {
      setError(mensajeError)
      return false
    }
  }

  const crear = ({ fecha, tipo, motivo }) => {
    const nuevo = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      creado: Date.now(),
      fecha,
      tipo,
      monto: MONTOS[tipo],
      pagado: false,
      motivo,
    }
    return ejecutar(
      { accion: 'crear', registro: nuevo },
      () => setRegistros((prev) => [...prev, nuevo]),
      'No se pudo guardar el registro. Revisa los datos e intenta de nuevo.',
    )
  }

  // Sin `id` cambia el estado de todos los registros.
  const cambiarPago = async (id, pagado) => {
    setOcupado(true)
    await ejecutar(
      { accion: 'pago', id, pagado },
      () => setRegistros((prev) => prev.map((r) => (!id || r.id === id ? { ...r, pagado } : r))),
      'No se pudo actualizar el estado del pago. Intenta de nuevo.',
    )
    setOcupado(false)
  }

  const eliminar = async (id) => {
    setOcupado(true)
    await ejecutar(
      { accion: 'eliminar', id },
      () => setRegistros((prev) => prev.filter((r) => r.id !== id)),
      'No se pudo eliminar el registro. Intenta de nuevo.',
    )
    setOcupado(false)
  }

  return { registros, ordenados, porFecha, cargando, sinServidor, error, setError, ocupado, crear, cambiarPago, eliminar }
}
