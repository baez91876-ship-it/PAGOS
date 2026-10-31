export const MONTOS = { completo: 40000, medio: 20000 }
export const ETIQUETAS = { completo: 'Día completo', medio: 'Medio día' }

export const formatoMoneda = (n) => '$' + n.toLocaleString('es-CO')

export const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`
