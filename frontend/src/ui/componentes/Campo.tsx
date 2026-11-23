import { useId, type ReactNode } from 'react'

/** Estilo de todo control de formulario; el foco lo pone el tema (:focus-visible). */
export const CLASE_CONTROL =
  'w-full min-h-10 rounded-md border border-borde bg-fondo px-3 py-2 text-sm text-texto placeholder:text-texto-2 hover:border-texto-2/50 disabled:cursor-not-allowed disabled:opacity-50'

interface PropsControl {
  id: string
  'aria-describedby'?: string
}

interface Props {
  etiqueta: ReactNode
  ayuda?: ReactNode
  children: (control: PropsControl) => ReactNode
  className?: string
}

/** Etiqueta, control y ayuda enlazados por id: todo control tiene su etiqueta visible. */
export function Campo({ etiqueta, ayuda, children, className = '' }: Props) {
  const id = useId()
  const idAyuda = `${id}-ayuda`
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {etiqueta}
      </label>
      {children({ id, 'aria-describedby': ayuda ? idAyuda : undefined })}
      {ayuda && (
        <p id={idAyuda} className="mt-1.5 text-xs text-texto-2">
          {ayuda}
        </p>
      )}
    </div>
  )
}
