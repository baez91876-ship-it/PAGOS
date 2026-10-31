import Calendario from './Calendario.jsx'

export default function PanelCalendario({ calendario }) {
  return (
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
  )
}
