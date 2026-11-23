import { CircleCheck } from 'lucide-react'
import type { EquipoRef, Partida } from '../../../dominio/tipos'
import { Hora } from '../../componentes/Hora'
import { InsigniaPartida } from '../../componentes/Insignia'
import { ESTADO_PARTIDA } from '../../presentacion'

function Lado({ equipo, gano, alineacion }: { equipo: EquipoRef; gano: boolean; alineacion: 'izquierda' | 'derecha' }) {
  return (
    <div className={`min-w-0 ${alineacion === 'derecha' ? 'text-right' : ''}`}>
      <p className="font-titulo text-lg font-semibold tracking-wide break-words text-balance sm:text-2xl">{equipo.nombre}</p>
      {gano && (
        <p className={`mt-1 flex items-center gap-1 text-sm text-finalizada ${alineacion === 'derecha' ? 'justify-end' : ''}`}>
          <CircleCheck aria-hidden className="size-4" />
          Ganador
        </p>
      )}
    </div>
  )
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-texto-2">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  )
}

/** RF-03: los dos equipos, el marcador, el estado y el horario de la partida. */
export function EncabezadoPartida({ partida }: { partida: Partida }) {
  const [equipoA, equipoB] = partida.equipos
  const presentacion = ESTADO_PARTIDA[partida.estado]
  return (
    <section aria-label="Marcador" className="rounded-lg border border-borde bg-superficie">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6">
        <Lado equipo={equipoA} gano={partida.ganadorId === equipoA.id} alineacion="izquierda" />
        <div className="text-center">
          {partida.marcador ? (
            <p className="font-datos text-3xl font-medium tabular-nums sm:text-5xl">
              <span className="sr-only">Marcador: </span>
              {partida.marcador.equipoA}
              <span className="px-1.5 text-texto-2 sm:px-3">:</span>
              {partida.marcador.equipoB}
            </p>
          ) : (
            <p className="font-titulo text-xl font-bold text-texto-2 sm:text-2xl">VS</p>
          )}
        </div>
        <Lado equipo={equipoB} gano={partida.ganadorId === equipoB.id} alineacion="derecha" />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-borde px-4 py-4 sm:grid-cols-4 sm:px-6">
        <Dato etiqueta="Estado">
          <InsigniaPartida estado={partida.estado} />
        </Dato>
        <Dato etiqueta="Programada">
          <Hora fecha={partida.fechaProgramada} />
        </Dato>
        <Dato etiqueta="Terminó">
          {partida.fechaFin ? <Hora fecha={partida.fechaFin} formato="exacta" /> : <span className="text-texto-2">Sin terminar</span>}
        </Dato>
        <Dato etiqueta="Partida">
          <span className="block truncate font-datos text-texto-2" title={partida.id}>
            {partida.id}
          </span>
        </Dato>
      </dl>
      <p className="border-t border-borde px-4 py-3 text-sm text-texto-2 sm:px-6">{presentacion.explicacion}</p>
    </section>
  )
}
