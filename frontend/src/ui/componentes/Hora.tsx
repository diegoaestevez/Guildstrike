import { fechaYHora, horaExacta } from '../formato'

interface Props {
  fecha: Date
  /** "exacta": 18:42:13; "corta": 20 nov, 18:42. */
  formato?: 'exacta' | 'corta'
  className?: string
}

/** Un momento en tipografía de datos, con la marca ISO completa en `dateTime` y al pasar el cursor. */
export function Hora({ fecha, formato = 'corta', className = '' }: Props) {
  const iso = fecha.toISOString()
  return (
    <time dateTime={iso} title={iso} className={`font-datos tabular-nums ${className}`}>
      {formato === 'exacta' ? horaExacta(fecha) : fechaYHora(fecha)}
    </time>
  )
}
