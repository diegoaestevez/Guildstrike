import { CircleCheck, FastForward, Network, Trophy } from 'lucide-react'
import { Link } from 'react-router'
import { campeon } from '../../../dominio/torneo'
import type { EquipoRef, PartidaResumen, Ronda, Torneo } from '../../../dominio/tipos'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { Hora } from '../../componentes/Hora'
import { InsigniaPartida } from '../../componentes/Insignia'

function FilaEquipo({ equipo, puntos, gano, decidido }: { equipo: EquipoRef; puntos: number | null; gano: boolean; decidido: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-2 ${decidido && !gano ? 'text-texto-2' : 'text-texto'}`}>
      <span className="flex min-w-0 items-center gap-2">
        <span className={`truncate text-sm ${gano ? 'font-semibold' : ''}`}>{equipo.nombre}</span>
        {gano && (
          <>
            <CircleCheck aria-hidden className="size-4 shrink-0 text-finalizada" />
            <span className="sr-only">(ganador)</span>
          </>
        )}
      </span>
      <span className="font-datos text-base tabular-nums">{puntos ?? '–'}</span>
    </div>
  )
}

function TarjetaPartida({ partida, numero }: { partida: PartidaResumen; numero: number }) {
  const [equipoA, equipoB] = partida.equipos
  const decidido = partida.ganadorId !== null
  return (
    <li>
      <Link
        to={`/partidas/${partida.id}`}
        aria-label={`Partida ${numero} de la ronda ${partida.ronda}: ${equipoA.nombre} contra ${equipoB.nombre}`}
        className="block rounded-lg border border-borde bg-fondo transition-colors hover:border-texto-2/60"
      >
        <div className="flex items-center justify-between gap-2 border-b border-borde px-3 py-2">
          <span className="font-datos text-xs text-texto-2">
            R{partida.ronda} · P{numero}
          </span>
          <InsigniaPartida estado={partida.estado} />
        </div>
        <div className="divide-y divide-borde">
          <FilaEquipo equipo={equipoA} puntos={partida.marcador?.equipoA ?? null} gano={partida.ganadorId === equipoA.id} decidido={decidido} />
          <FilaEquipo equipo={equipoB} puntos={partida.marcador?.equipoB ?? null} gano={partida.ganadorId === equipoB.id} decidido={decidido} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 border-t border-borde px-3 py-1.5 text-xs text-texto-2">
          <Hora fecha={partida.fechaProgramada} className="whitespace-nowrap" />
          {partida.estado === 'AUDITADA' && <span className="whitespace-nowrap">Por dictamen</span>}
        </div>
      </Link>
    </li>
  )
}

function PaseAutomatico({ equipo, ronda }: { equipo: EquipoRef; ronda: number }) {
  return (
    <li className="rounded-lg border border-dashed border-borde px-3 py-3">
      <p className="flex items-center gap-1.5 text-xs text-texto-2">
        <FastForward aria-hidden className="size-3.5" />
        Pase automático
      </p>
      <p className="mt-1 truncate text-sm font-medium">{equipo.nombre}</p>
      <p className="mt-0.5 text-xs text-texto-2">Número impar de equipos: avanza directo a la ronda {ronda + 1}.</p>
    </li>
  )
}

function ColumnaRonda({ ronda }: { ronda: Ronda }) {
  return (
    <li className="flex min-w-0 flex-col">
      <h3 className="mb-3 flex items-baseline justify-between gap-2">
        <span className="font-titulo text-sm font-semibold tracking-wider text-texto-2 uppercase">Ronda {ronda.numero}</span>
        <span className="text-xs text-texto-2">
          {ronda.partidas.length} {ronda.partidas.length === 1 ? 'partida' : 'partidas'}
        </span>
      </h3>
      <ul className="flex flex-1 flex-col justify-around gap-3">
        {ronda.partidas.map((partida, indice) => (
          <TarjetaPartida key={partida.id} partida={partida} numero={indice + 1} />
        ))}
        {ronda.paseAutomatico && <PaseAutomatico equipo={ronda.paseAutomatico} ronda={ronda.numero} />}
      </ul>
    </li>
  )
}

/** La ronda que sigue, todavía sin partidas: dice cuándo se genera y cuántos llegan. */
function ColumnaPendiente({ anterior }: { anterior: Ronda }) {
  const llegan = anterior.partidas.length + (anterior.paseAutomatico ? 1 : 0)
  return (
    <li className="flex min-w-0 flex-col">
      <h3 className="mb-3 font-titulo text-sm font-semibold tracking-wider text-texto-2 uppercase">Ronda {anterior.numero + 1}</h3>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-borde px-4 py-8 text-center">
        <Network aria-hidden className="size-5 text-texto-2" />
        <p className="text-sm text-texto-2">
          Se genera cuando todas las partidas de la ronda {anterior.numero} estén finalizadas o auditadas.
        </p>
        <p className="font-datos text-xs text-texto-2">Llegan {llegan} equipos</p>
      </div>
    </li>
  )
}

/** RF-14: las llaves por ronda, con el nombre de cada equipo, su marcador y el estado de la partida. */
export function Llaves({ torneo }: { torneo: Torneo }) {
  const ganador = campeon(torneo)
  const ultima = torneo.rondas.at(-1)
  if (torneo.rondas.length === 0) {
    return (
      <EstadoVacio icono={Network} titulo="Las llaves se generan al cerrar inscripciones">
        Cuando el administrador cierre las inscripciones, los equipos se emparejan en el orden en que se inscribieron.
      </EstadoVacio>
    )
  }
  return (
    <div className="flex flex-col gap-5">
      {ganador && (
        <p className="flex items-center gap-3 rounded-lg border border-oro/40 bg-oro/10 px-4 py-3">
          <Trophy aria-hidden className="size-5 shrink-0 text-oro" />
          <span>
            <span className="text-sm text-texto-2">Campeón del torneo</span>
            <span className="block font-titulo text-lg font-semibold">{ganador.nombre}</span>
          </span>
        </p>
      )}
      <div className="overflow-x-auto pb-1">
        <ol className="grid gap-6 md:auto-cols-[minmax(15rem,19rem)] md:grid-flow-col">
          {torneo.rondas.map((ronda) => (
            <ColumnaRonda key={ronda.numero} ronda={ronda} />
          ))}
          {!ganador && ultima && <ColumnaPendiente anterior={ultima} />}
        </ol>
      </div>
    </div>
  )
}
