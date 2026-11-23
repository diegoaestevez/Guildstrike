import { ChevronRight } from 'lucide-react'
import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router'

export interface Miga {
  etiqueta: string
  a?: string
}

interface Props {
  titulo: ReactNode
  descripcion?: ReactNode
  migas?: Miga[]
  /** Insignias junto al título (estado, formato). */
  detalles?: ReactNode
}

export function EncabezadoPagina({ titulo, descripcion, migas, detalles }: Props) {
  return (
    <header className="mb-6 min-w-0">
      {migas && migas.length > 0 && (
        <nav aria-label="Ruta de navegación" className="mb-3">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-texto-2">
            {migas.map((miga, indice) => (
              <Fragment key={`${miga.etiqueta}-${indice}`}>
                {indice > 0 && <ChevronRight aria-hidden className="size-3.5 shrink-0" />}
                <li className="min-w-0 truncate">
                  {miga.a ? (
                    <Link to={miga.a} className="rounded-sm hover:text-texto">
                      {miga.etiqueta}
                    </Link>
                  ) : (
                    <span aria-current="page">{miga.etiqueta}</span>
                  )}
                </li>
              </Fragment>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="font-titulo text-2xl font-bold tracking-wide text-balance sm:text-3xl">{titulo}</h1>
        {detalles}
      </div>
      {descripcion && <p className="mt-2 max-w-3xl text-sm text-texto-2 sm:text-base">{descripcion}</p>}
    </header>
  )
}
