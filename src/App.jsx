import { useState } from 'react'
import FormularioRegistro from './componentes/FormularioRegistro.jsx'
import Icono from './componentes/Icono.jsx'
import ListaRegistros from './componentes/ListaRegistros.jsx'
import PanelCalendario from './componentes/PanelCalendario.jsx'
import Resumen from './componentes/Resumen.jsx'
import useRegistros from './hooks/useRegistros.js'
import { enmascararFecha, formatoFecha, hoy, leerFechaEscrita } from './utilidades/fechas.js'

const mesDe = (iso) => {
  const [y, m] = iso.split('-').map(Number)
  return { anio: y, mes: m - 1 }
}

export default function App() {
  const { registros, ordenados, porFecha, cargando, sinServidor, error, setError, ocupado, crear, cambiarPago, eliminar } =
    useRegistros()
  const [fecha, setFecha] = useState(hoy)
  const [textoFecha, setTextoFecha] = useState(() => formatoFecha(hoy()))
  const [vista, setVista] = useState(() => mesDe(hoy()))

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

  const guardar = async ({ tipo, motivo }) => {
    const guardado = await crear({ fecha, tipo, motivo })
    if (guardado) {
      elegirFecha(hoy())
      setVista(mesDe(hoy()))
    }
    return guardado
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
          <Resumen registros={registros} ocupado={ocupado} onMarcarTodo={() => cambiarPago('', true)} />
          <FormularioRegistro
            campoFecha={{ fecha, textoFecha, onEscribir: escribirFecha, onAbrir: () => fecha && setVista(mesDe(fecha)), calendario }}
            onGuardar={guardar}
            onError={setError}
          />
          <PanelCalendario calendario={calendario} />
        </div>

        <ListaRegistros
          registros={ordenados}
          cargando={cargando}
          ocupado={ocupado}
          onCambiarPago={cambiarPago}
          onEliminar={eliminar}
        />
      </div>
    </div>
  )
}
