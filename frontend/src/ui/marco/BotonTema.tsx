import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { aplicarTema, temaActual, type Tema } from '../tema'

/** Cambia entre el tema oscuro y el claro, y recuerda la elección en este navegador. */
export function BotonTema() {
  const [tema, setTema] = useState<Tema>(temaActual)
  const siguiente: Tema = tema === 'oscuro' ? 'claro' : 'oscuro'
  const Icono = tema === 'oscuro' ? Sun : Moon

  return (
    <button
      type="button"
      onClick={() => {
        aplicarTema(siguiente)
        setTema(siguiente)
      }}
      aria-label={`Cambiar a tema ${siguiente}`}
      title={`Cambiar a tema ${siguiente}`}
      className="grid size-9 shrink-0 place-items-center rounded-md border border-borde text-texto-2 transition-colors hover:bg-elevada hover:text-texto"
    >
      <Icono aria-hidden className="size-4" />
    </button>
  )
}
