import Icono from './Icono.jsx'
import { aISO, fechaLarga, hoy, nombreMes } from '../utilidades/fechas.js'
import { ETIQUETAS } from '../utilidades/pagos.js'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function Calendario({ vista, onCambiarMes, porFecha, fecha, onElegir }) {
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
        <button type="button" onClick={() => onCambiarMes(-1)} aria-label="Mes anterior" className="boton-icono">
          <Icono nombre="izquierda" />
        </button>
        <span className="font-semibold">{nombreMes(anio, mes)}</span>
        <button type="button" onClick={() => onCambiarMes(1)} aria-label="Mes siguiente" className="boton-icono">
          <Icono nombre="derecha" />
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
