import { ChevronRight, Trophy } from 'lucide-react'
import { Link } from 'react-router'
import type { TorneoResumen } from '../../../dominio/tipos'
import { Cargando } from '../../componentes/Cargando'
import { EncabezadoPagina } from '../../componentes/EncabezadoPagina'
import { ErrorDeCarga } from '../../componentes/ErrorDeCarga'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { InsigniaTorneo } from '../../componentes/Insignia'
import { useTorneos } from '../../consultas/lecturas'
import { FORMATO } from '../../presentacion'

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="whitespace-nowrap">
      <dt className="text-xs text-texto-2">{etiqueta}</dt>
      <dd className="font-datos text-sm tabular-nums">{valor}</dd>
    </div>
  )
}

function TarjetaTorneo({ torneo }: { torneo: TorneoResumen }) {
  return (
    <li>
      <Link
        to={`/torneos/${torneo.id}`}
        className="group flex flex-col gap-4 rounded-lg border border-borde bg-superficie p-4 transition-colors hover:border-texto-2/50 sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-titulo text-lg font-semibold tracking-wide">{torneo.nombre}</h2>
            <InsigniaTorneo estado={torneo.estado} />
          </div>
          <p className="mt-1 text-sm text-texto-2">{FORMATO[torneo.formato]}</p>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-6 sm:justify-end">
          <dl className="flex gap-6">
            <Dato etiqueta="Equipos inscritos" valor={String(torneo.equiposInscritos)} />
            <Dato etiqueta="Ronda actual" valor={torneo.rondaActual ? String(torneo.rondaActual) : '—'} />
          </dl>
          <span className="inline-flex items-center gap-1 text-sm whitespace-nowrap text-texto-2 group-hover:text-texto">
            Ver torneo
            <ChevronRight aria-hidden className="size-4" />
          </span>
        </div>
      </Link>
    </li>
  )
}

export function PaginaTorneos() {
  const consulta = useTorneos()
  return (
    <>
      <EncabezadoPagina
        titulo="Torneos"
        descripcion="Cada partida deja su rastro: quién reportó, qué evidencia subió y quién dictaminó, con hora exacta."
      />
      {consulta.isPending ? (
        <Cargando etiqueta="Cargando torneos" />
      ) : consulta.isError && !consulta.data ? (
        <ErrorDeCarga error={consulta.error} reintentar={() => void consulta.refetch()} />
      ) : consulta.data.length === 0 ? (
        <EstadoVacio icono={Trophy} titulo="Todavía no hay torneos">
          Cuando el administrador cree uno, aparecerá aquí con sus inscripciones abiertas.
        </EstadoVacio>
      ) : (
        <ul className="flex flex-col gap-3">
          {consulta.data.map((torneo) => (
            <TarjetaTorneo key={torneo.id} torneo={torneo} />
          ))}
        </ul>
      )}
    </>
  )
}
