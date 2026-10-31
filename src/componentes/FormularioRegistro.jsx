import { useEffect, useState } from 'react'
import CampoFecha from './CampoFecha.jsx'
import Icono from './Icono.jsx'
import { ETIQUETAS, MONTOS, formatoMoneda } from '../utilidades/pagos.js'

export default function FormularioRegistro({ campoFecha, onGuardar, onError }) {
  const [tipo, setTipo] = useState('completo')
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    if (!aviso) return
    const id = setTimeout(() => setAviso(''), 3000)
    return () => clearTimeout(id)
  }, [aviso])

  const guardar = async (e) => {
    e.preventDefault()
    if (guardando) return
    if (!campoFecha.fecha) return onError('Escribe una fecha válida con el formato dd/mm/aaaa.')
    if (tipo === 'medio' && !motivo.trim()) return onError('Escribe el motivo del medio día.')
    setGuardando(true)
    const guardado = await onGuardar({ tipo, motivo: tipo === 'medio' ? motivo.trim() : '' })
    setGuardando(false)
    if (!guardado) return
    setAviso(`${ETIQUETAS[tipo]} guardado.`)
    setMotivo('')
    setTipo('completo')
  }

  return (
    <section className="panel">
      <h2 className="titulo">Nuevo Registro</h2>
      <p className="mb-5 text-sm text-gray-400">Registra un nuevo pago diario</p>

      <form onSubmit={guardar} className="space-y-5" noValidate>
        <CampoFecha {...campoFecha} />

        <div>
          <span className="etiqueta">Tipo de Día</span>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Tipo de Día">
            {Object.keys(MONTOS).map((t) => {
              const activo = tipo === t
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={activo}
                  onClick={() => setTipo(t)}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-lg border px-2 py-2 font-semibold transition ${
                    activo
                      ? 'border-yellow-400 bg-yellow-400 text-black'
                      : 'border-white/15 bg-campo text-gray-200 hover:border-yellow-400'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {activo && <Icono nombre="check" className="h-4 w-4" />}
                    {ETIQUETAS[t]}
                  </span>
                  <span className="text-sm font-normal">{formatoMoneda(MONTOS[t])}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label htmlFor="monto" className="etiqueta">
            Monto
          </label>
          <input id="monto" type="text" disabled value={formatoMoneda(MONTOS[tipo])} className="campo text-lg font-semibold disabled:text-white" />
          <span className="ayuda">Calculado automáticamente según el tipo de día</span>
        </div>

        {tipo === 'medio' && (
          <div>
            <label htmlFor="motivo" className="etiqueta">
              Motivo Medio Día
            </label>
            <textarea
              id="motivo"
              required
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Salida médica, permiso personal..."
              className="campo resize-y"
            />
          </div>
        )}

        <button type="submit" disabled={guardando} className="boton-principal">
          {guardando ? 'Guardando...' : 'Guardar Registro'}
        </button>
        {aviso && (
          <p role="status" className="flex items-center justify-center gap-1.5 text-sm font-semibold text-yellow-400">
            <Icono nombre="check" className="h-4 w-4" />
            {aviso}
          </p>
        )}
      </form>
    </section>
  )
}
