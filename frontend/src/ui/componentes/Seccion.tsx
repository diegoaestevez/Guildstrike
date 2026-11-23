import { useId, type ReactNode } from 'react'

interface Props {
  titulo: ReactNode
  descripcion?: ReactNode
  /** Botones o insignias a la derecha del título. */
  acciones?: ReactNode
  children: ReactNode
  className?: string
}

/** Bloque con título: la unidad de composición de todas las pantallas. */
export function Seccion({ titulo, descripcion, acciones, children, className = '' }: Props) {
  const id = useId()
  return (
    <section aria-labelledby={id} className={`min-w-0 rounded-lg border border-borde bg-superficie ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-borde px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 id={id} className="font-titulo text-base font-semibold tracking-wide">
            {titulo}
          </h2>
          {descripcion && <p className="mt-0.5 text-sm text-texto-2">{descripcion}</p>}
        </div>
        {acciones}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}
