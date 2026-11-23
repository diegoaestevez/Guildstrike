import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  icono: LucideIcon
  titulo: string
  children?: ReactNode
  /** Botón o enlace para salir del vacío. */
  accion?: ReactNode
}

/** Lo que se ve cuando no hay nada: dice por qué y qué hacer. */
export function EstadoVacio({ icono: Icono, titulo, children, accion }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-borde px-6 py-10 text-center">
      <span className="grid size-11 place-items-center rounded-lg border border-borde bg-elevada text-texto-2">
        <Icono aria-hidden className="size-5" />
      </span>
      <p className="font-titulo text-base font-semibold">{titulo}</p>
      {children && <div className="max-w-md text-sm text-texto-2">{children}</div>}
      {accion}
    </div>
  )
}
