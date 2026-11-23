import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

export type EstadoPaso = 'hecho' | 'actual' | 'pendiente'

const MARCA: Record<EstadoPaso, string> = {
  hecho: 'border-finalizada/50 bg-finalizada/10 text-finalizada',
  actual: 'border-oro bg-oro/10 text-oro',
  pendiente: 'border-borde bg-elevada text-texto-2',
}

const TEXTO_ESTADO: Record<EstadoPaso, string> = { hecho: 'hecho', actual: 'en curso', pendiente: 'pendiente' }

/** Un paso numerado de un flujo guiado, con su estado dicho en texto y no solo en color. */
export function Paso({ numero, titulo, estado, children }: { numero: number; titulo: string; estado: EstadoPaso; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
      <span className={`grid size-7 place-items-center rounded-full border font-datos text-xs ${MARCA[estado]}`} aria-hidden>
        {estado === 'hecho' ? <Check className="size-3.5" /> : numero}
      </span>
      <div className="min-w-0 pb-5">
        <h3 className="pt-0.5 text-sm font-semibold">
          {titulo}
          <span className="sr-only"> ({TEXTO_ESTADO[estado]})</span>
        </h3>
        <div className="mt-2">{children}</div>
      </div>
    </li>
  )
}
