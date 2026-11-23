import { LoaderCircle, type LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'

export type VarianteBoton = 'principal' | 'secundario' | 'peligro'

const VARIANTES: Record<VarianteBoton, string> = {
  principal: 'border-transparent bg-oro text-fondo hover:bg-oro/85',
  secundario: 'border-borde bg-elevada text-texto hover:border-texto-2/60',
  peligro: 'border-abierto/50 bg-transparent text-abierto hover:bg-abierto/10',
}

const BASE =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton
  icono?: LucideIcon
  /** Mientras la acción corre: deshabilitado y con indicador. */
  cargando?: boolean
  children: ReactNode
}

export function Boton({
  variante = 'secundario',
  icono: Icono,
  cargando = false,
  disabled,
  className = '',
  type = 'button',
  children,
  ...resto
}: PropsBoton) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={`${BASE} ${VARIANTES[variante]} ${className}`}
      {...resto}
    >
      {cargando ? (
        <LoaderCircle aria-hidden className="size-4 animate-spin" />
      ) : (
        Icono && <Icono aria-hidden className="size-4" />
      )}
      {children}
    </button>
  )
}

interface PropsEnlace extends LinkProps {
  variante?: VarianteBoton
  icono?: LucideIcon
}

/** Un enlace con forma de botón, para navegar como acción. */
export function EnlaceBoton({ variante = 'secundario', icono: Icono, className = '', children, ...resto }: PropsEnlace) {
  return (
    <Link className={`${BASE} ${VARIANTES[variante]} ${className}`} {...resto}>
      {Icono && <Icono aria-hidden className="size-4" />}
      {children}
    </Link>
  )
}
