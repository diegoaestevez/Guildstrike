import type { EstadoDisputa, EstadoPartida, EstadoTorneo } from '../../dominio/tipos'
import { CLASES_TONO, ESTADO_DISPUTA, ESTADO_PARTIDA, ESTADO_TORNEO, type Presentacion } from '../presentacion'

/** Etiqueta de estado: color más ícono más texto. El color nunca va solo. */
export function Insignia({ presentacion, className = '' }: { presentacion: Presentacion; className?: string }) {
  const { etiqueta, tono, icono: Icono } = presentacion
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${CLASES_TONO[tono]} ${className}`}
    >
      <Icono aria-hidden className="size-3.5" />
      {etiqueta}
    </span>
  )
}

export const InsigniaPartida = ({ estado }: { estado: EstadoPartida }) => <Insignia presentacion={ESTADO_PARTIDA[estado]} />
export const InsigniaTorneo = ({ estado }: { estado: EstadoTorneo }) => <Insignia presentacion={ESTADO_TORNEO[estado]} />
export const InsigniaDisputa = ({ estado }: { estado: EstadoDisputa }) => <Insignia presentacion={ESTADO_DISPUTA[estado]} />
