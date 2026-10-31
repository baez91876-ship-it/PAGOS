import Icono from './Icono.jsx'
import { formatoFecha } from '../utilidades/fechas.js'
import { ETIQUETAS, formatoMoneda } from '../utilidades/pagos.js'

function EstadoPago({ pagado }) {
  return pagado ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2.5 py-0.5 text-xs font-bold text-black">
      <Icono nombre="check" className="h-3.5 w-3.5" />
      Pagado
    </span>
  ) : (
    <span className="inline-flex rounded-full border border-white/25 px-2.5 py-0.5 text-xs font-semibold text-gray-300">
      Pendiente
    </span>
  )
}

function Acciones({ registro: r, ocupado, onCambiarPago, onEliminar }) {
  return (
    <>
      <button
        type="button"
        disabled={ocupado}
        onClick={() => onCambiarPago(r.id, !r.pagado)}
        className={`boton-chico font-semibold ${
          r.pagado
            ? 'border-white/20 text-gray-300 hover:bg-white/10'
            : 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black'
        }`}
      >
        {r.pagado ? 'Marcar pendiente' : 'Marcar pagado'}
      </button>
      <button
        type="button"
        disabled={ocupado}
        onClick={() => {
          if (window.confirm(`¿Eliminar el registro del ${formatoFecha(r.fecha)} (${ETIQUETAS[r.tipo]})?`)) onEliminar(r.id)
        }}
        aria-label={`Eliminar registro del ${formatoFecha(r.fecha)}`}
        className="boton-chico border-red-400/40 text-red-300 hover:bg-red-500/15"
      >
        <Icono nombre="basura" className="h-4 w-4" />
        Eliminar
      </button>
    </>
  )
}

const COLUMNAS = ['FECHA', 'TIPO', 'MONTO', 'MOTIVO', 'ESTADO']

export default function ListaRegistros({ registros, cargando, ...acciones }) {
  let contenido
  if (cargando) contenido = <p className="text-sm text-gray-400">Cargando registros...</p>
  else if (registros.length === 0) contenido = <p className="text-sm text-gray-400">No hay registros todavía.</p>
  else
    contenido = (
      <>
        <ul className="space-y-3 md:hidden">
          {registros.map((r) => (
            <li key={r.id} className="tarjeta">
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
                <Acciones registro={r} {...acciones} />
              </div>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-gray-400">
              <tr>
                {COLUMNAS.map((c) => (
                  <th key={c} className="px-3 py-2 font-semibold">
                    {c}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-semibold">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                  <td className="celda whitespace-nowrap">{formatoFecha(r.fecha)}</td>
                  <td className="celda whitespace-nowrap">{ETIQUETAS[r.tipo]}</td>
                  <td className="celda whitespace-nowrap font-semibold text-yellow-400">{formatoMoneda(r.monto)}</td>
                  <td className="celda text-gray-300">{r.motivo || '—'}</td>
                  <td className="celda whitespace-nowrap">
                    <EstadoPago pagado={r.pagado} />
                  </td>
                  <td className="celda">
                    <div className="flex justify-end gap-2">
                      <Acciones registro={r} {...acciones} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )

  return (
    <section className="panel">
      <h2 className="titulo mb-4">Registros recientes</h2>
      {contenido}
    </section>
  )
}
