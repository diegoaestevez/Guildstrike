// Formato de fechas, duraciones y tamaños para la pantalla, en español de México.

const LOCALE = 'es-MX'

const formatoFechaHora = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})
const formatoHoraExacta = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})
const formatoDia = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })
const formatoRelativo = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' })

/** "20 nov, 18:00" */
export const fechaYHora = (fecha: Date) => formatoFechaHora.format(fecha)

/** "18:42:13": la hora con segundos, para la trazabilidad. */
export const horaExacta = (fecha: Date) => formatoHoraExacta.format(fecha)

/** "20 nov 2026" */
export const dia = (fecha: Date) => formatoDia.format(fecha)

const dosDigitos = (numero: number) => String(numero).padStart(2, '0')

/** "04:07" a partir de milisegundos. */
export function cuentaRegresiva(ms: number): string {
  const segundos = Math.max(0, Math.ceil(ms / 1000))
  return `${dosDigitos(Math.floor(segundos / 60))}:${dosDigitos(segundos % 60)}`
}

/** "+00:12:05": cuánto pasó entre dos momentos. */
export function desde(inicio: Date, fin: Date): string {
  const segundos = Math.max(0, Math.round((fin.getTime() - inicio.getTime()) / 1000))
  const horas = Math.floor(segundos / 3600)
  return `+${dosDigitos(horas)}:${dosDigitos(Math.floor((segundos % 3600) / 60))}:${dosDigitos(segundos % 60)}`
}

/** "hace 25 minutos", "en 1 hora" */
export function relativa(fecha: Date, ahora: Date): string {
  const minutos = Math.round((fecha.getTime() - ahora.getTime()) / 60_000)
  if (Math.abs(minutos) < 60) {
    return formatoRelativo.format(minutos, 'minute')
  }
  const horas = Math.round(minutos / 60)
  if (Math.abs(horas) < 24) {
    return formatoRelativo.format(horas, 'hour')
  }
  return formatoRelativo.format(Math.round(horas / 24), 'day')
}

/** "1.8 MB", "640 KB" */
export function tamano(bytes: number): string {
  const MB = 1024 * 1024
  return bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}
