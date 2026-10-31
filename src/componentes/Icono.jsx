const TRAZOS = {
  tarjeta: 'M3 5a2 2 0 0 0-2 2v1h22V7a2 2 0 0 0-2-2H3Zm20 5H1v7a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-7ZM4 15h5v2H4v-2Z',
  calendario: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  basura: 'M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14',
  check: 'm5 12 5 5L20 7',
  izquierda: 'm15 6-6 6 6 6',
  derecha: 'm9 6 6 6-6 6',
}

export default function Icono({ nombre, className = 'h-5 w-5', relleno = false }) {
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
      <path d={TRAZOS[nombre]} />
    </svg>
  )
}
