import { OctagonExclamationPoint } from 'lucide-react'
import { mensajeDeError } from '../errores'

interface Props {
  /** Error de la acción (ErrorDeRegla trae el mensaje literal del modelo). */
  error?: unknown
  /** Mensaje de una validación local, antes de enviar; tiene prioridad sobre `error`. */
  mensaje?: string | null
  className?: string
}

/**
 * Error de una acción, en línea y junto a ella. La región aria-live existe siempre para que
 * el lector de pantalla anuncie el mensaje cuando aparece.
 */
export function AvisoDeError({ error, mensaje: mensajeLocal, className = '' }: Props) {
  const mensaje = mensajeLocal || mensajeDeError(error)
  return (
    <div aria-live="polite" aria-atomic="true" className={className}>
      {mensaje && (
        <p className="flex items-start gap-2 rounded-md border border-abierto/40 bg-abierto/10 px-3 py-2 text-sm text-texto">
          <OctagonExclamationPoint aria-hidden className="mt-0.5 size-4 shrink-0 text-abierto" />
          <span>{mensaje}</span>
        </p>
      )}
    </div>
  )
}
