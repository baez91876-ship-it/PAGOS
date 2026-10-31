import { useMemo } from 'react'
import { hoy, nombreMes } from '../utilidades/fechas.js'
import { formatoMoneda, plural } from '../utilidades/pagos.js'

const suma = (lista) => lista.reduce((s, r) => s + r.monto, 0)

export default function Resumen({ registros, cargando, ocupado, onMarcarTodo }) {
  const resumen = useMemo(() => {
    const mes = hoy().slice(0, 7)
    const delMes = registros.filter((r) => r.fecha.startsWith(mes))
    const pendientes = registros.filter((r) => !r.pagado)
    return {
      nombreMes: nombreMes(Number(mes.slice(0, 4)), Number(mes.slice(5)) - 1),
      completos: delMes.filter((r) => r.tipo === 'completo').length,
      medios: delMes.filter((r) => r.tipo === 'medio').length,
      total: suma(delMes),
      pagadoMes: suma(delMes.filter((r) => r.pagado)),
      pendientes: pendientes.length,
      pendiente: suma(pendientes),
    }
  }, [registros])

  // Mientras llegan los datos no se muestran ceros que parezcan reales.
  const monto = (n) => (cargando ? '—' : formatoMoneda(n))

  const marcarTodo = () => {
    const texto = `¿Marcar ${plural(resumen.pendientes, 'registro pendiente', 'registros pendientes')} como pagado (${formatoMoneda(resumen.pendiente)})?`
    if (window.confirm(texto)) onMarcarTodo()
  }

  return (
    <aside className="panel md:col-span-2 xl:col-span-1">
      <h2 className="titulo mb-4">Resumen</h2>
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
        <div className="tarjeta">
          <p className="text-sm text-gray-400">Total del mes · {resumen.nombreMes}</p>
          <p className="mt-1 text-3xl font-bold text-yellow-400">{monto(resumen.total)}</p>
          {!cargando && (
            <p className="mt-2 text-sm text-gray-300">
              {plural(resumen.completos, 'día completo', 'días completos')} x $40K
              <br />+ {plural(resumen.medios, 'medio día', 'medios días')} x $20K
            </p>
          )}
        </div>
        <div className="tarjeta">
          <p className="text-sm text-gray-400">Pagado este mes</p>
          <p className="mt-1 text-3xl font-bold">{monto(resumen.pagadoMes)}</p>
        </div>
        <div className="tarjeta">
          <p className="text-sm text-gray-400">Pendiente por pagar</p>
          <p className="mt-1 text-3xl font-bold">{monto(resumen.pendiente)}</p>
          {!cargando && (
            <p className="mt-1 text-sm text-gray-400">
              {resumen.pendientes
                ? `${plural(resumen.pendientes, 'registro', 'registros')} de todos los meses`
                : 'Todo está pagado'}
            </p>
          )}
          {resumen.pendientes > 0 && (
            <button type="button" disabled={ocupado} onClick={marcarTodo} className="boton-borde mt-3 w-full px-3 py-2 text-sm">
              Marcar todo como pagado
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
