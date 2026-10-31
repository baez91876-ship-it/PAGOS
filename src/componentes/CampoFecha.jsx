import { useEffect, useRef, useState } from 'react'
import Calendario from './Calendario.jsx'
import Icono from './Icono.jsx'
import { FORMATO_ESCRITO, fechaLarga, hoy } from '../utilidades/fechas.js'

// Fecha escrita a mano (dd/mm/aaaa) o elegida en el calendario desplegable.
export default function CampoFecha({ fecha, textoFecha, onEscribir, onAbrir, calendario }) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!abierto) return
    const cerrarFuera = (e) => {
      if (!ref.current?.contains(e.target)) setAbierto(false)
    }
    const cerrarEsc = (e) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('mousedown', cerrarFuera)
    document.addEventListener('keydown', cerrarEsc)
    return () => {
      document.removeEventListener('mousedown', cerrarFuera)
      document.removeEventListener('keydown', cerrarEsc)
    }
  }, [abierto])

  const elegir = (iso) => {
    calendario.onElegir(iso)
    setAbierto(false)
  }

  const invalida = !fecha && textoFecha

  return (
    <div className="relative" ref={ref}>
      <label htmlFor="fecha" className="etiqueta">
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
          onChange={(e) => onEscribir(e.target.value)}
          aria-invalid={!fecha}
          aria-describedby="fecha-ayuda"
          className={`campo ${invalida ? 'border-red-400' : ''}`}
        />
        <button
          type="button"
          onClick={() => {
            if (!abierto) onAbrir()
            setAbierto((v) => !v)
          }}
          aria-label="Abrir calendario"
          aria-expanded={abierto}
          className="shrink-0 rounded-lg border border-white/10 bg-campo px-3 text-gray-300 hover:border-yellow-400 hover:text-yellow-400"
        >
          <Icono nombre="calendario" />
        </button>
      </div>
      <p id="fecha-ayuda" className={`ayuda ${invalida ? 'text-red-300' : ''}`}>
        {fecha ? fechaLarga(fecha) : FORMATO_ESCRITO.test(textoFecha) ? 'Esa fecha no existe' : 'Escribe la fecha como dd/mm/aaaa'}
      </p>
      {abierto && (
        <div className="absolute left-0 right-0 z-20 mt-2 rounded-xl border border-white/10 bg-fondo p-4 shadow-2xl sm:right-auto sm:w-80">
          <Calendario {...calendario} onElegir={elegir} />
          <div className="mt-3 flex justify-between text-sm">
            <button type="button" onClick={() => setAbierto(false)} className="text-gray-400 hover:text-white">
              Cerrar
            </button>
            <button type="button" onClick={() => elegir(hoy())} className="font-semibold text-yellow-400 hover:text-yellow-300">
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
