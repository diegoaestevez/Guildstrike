import { FileImage, Gavel } from 'lucide-react'
import type { EquipoRef, Evidencia, Partida } from '../../../dominio/tipos'
import { Hora } from '../../componentes/Hora'
import { InsigniaDisputa } from '../../componentes/Insignia'
import { desde, tamano } from '../../formato'

function TarjetaEvidencia({ evidencia, fechaFin }: { evidencia: Evidencia; fechaFin: Date | null }) {
  return (
    <li className="flex gap-3 rounded-md border border-borde bg-fondo p-2">
      {evidencia.url ? (
        <a href={evidencia.url} target="_blank" rel="noreferrer" className="shrink-0 rounded">
          <img src={evidencia.url} alt={`Evidencia ${evidencia.nombre}`} className="size-16 rounded object-cover" />
        </a>
      ) : (
        <span
          className="grid size-16 shrink-0 place-items-center rounded border border-dashed border-borde text-texto-2"
          title="Esta fuente de datos no conserva la imagen"
        >
          <FileImage aria-hidden className="size-5" />
        </span>
      )}
      <div className="min-w-0 text-xs">
        <p className="truncate font-datos text-sm text-texto" title={evidencia.nombre}>
          {evidencia.nombre}
        </p>
        <p className="mt-0.5 text-texto-2">
          {evidencia.tipo === 'image/png' ? 'PNG' : evidencia.tipo === 'image/jpeg' ? 'JPG' : evidencia.tipo} · {tamano(evidencia.tamanoBytes)}
        </p>
        <p className="mt-0.5 text-texto-2">
          <Hora fecha={evidencia.fechaCarga} formato="exacta" />
          {fechaFin && <span className="font-datos"> · {desde(fechaFin, evidencia.fechaCarga)} del fin</span>}
        </p>
      </div>
    </li>
  )
}

function ColumnaEquipo({ partida, equipo }: { partida: Partida; equipo: EquipoRef }) {
  const reporte = partida.reportes.find((candidato) => candidato.equipoId === equipo.id)
  const evidencias = partida.evidencias.filter((evidencia) => evidencia.equipoId === equipo.id)
  return (
    <div className="min-w-0 rounded-md border border-borde bg-elevada p-3">
      <h3 className="truncate font-titulo text-sm font-semibold tracking-wide">{equipo.nombre}</h3>
      <dl className="mt-3 flex flex-col gap-3">
        <div>
          <dt className="text-xs text-texto-2">Marcador que reportó</dt>
          <dd className="mt-0.5">
            {reporte ? (
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-datos text-lg tabular-nums">
                  {reporte.marcadorPropio}–{reporte.marcadorRival}
                </span>
                <span className="text-xs text-texto-2">
                  propio–rival · <Hora fecha={reporte.fecha} formato="exacta" />
                </span>
              </span>
            ) : (
              <span className="text-sm text-texto-2">Sin reporte</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-texto-2">Evidencias</dt>
          <dd className="mt-1">
            {evidencias.length ? (
              <ul className="flex flex-col gap-2">
                {evidencias.map((evidencia) => (
                  <TarjetaEvidencia key={`${evidencia.nombre}-${evidencia.fechaCarga.getTime()}`} evidencia={evidencia} fechaFin={partida.fechaFin} />
                ))}
              </ul>
            ) : (
              <span className="text-sm text-texto-2">Sin evidencias</span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  )
}

/** Lo que cada equipo declaró (reporte y evidencias) y, si la hay, la disputa con su dictamen. */
export function Expediente({ partida }: { partida: Partida }) {
  const { disputa } = partida
  const ganador = partida.equipos.find((equipo) => equipo.id === disputa?.equipoGanadorId)
  return (
    // Las columnas dependen del ancho del contenedor, no de la ventana: el expediente vive
    // tanto en la página de la partida como en el panel angosto de arbitraje.
    <div className="@container flex flex-col gap-4">
      <div className="grid gap-3 @xl:grid-cols-2">
        <ColumnaEquipo partida={partida} equipo={partida.equipos[0]} />
        <ColumnaEquipo partida={partida} equipo={partida.equipos[1]} />
      </div>
      {disputa && (
        <div className="rounded-md border border-borde p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-titulo text-sm font-semibold tracking-wide">Disputa</h3>
            <InsigniaDisputa estado={disputa.estado} />
          </div>
          <p className="mt-2 text-sm">{disputa.motivo}</p>
          <p className="mt-1 text-xs text-texto-2">
            La abrió {disputa.solicitante.nombre} a las <Hora fecha={disputa.fechaCreacion} formato="exacta" />
            {disputa.arbitro ? ` · árbitro: ${disputa.arbitro.nombre}` : ' · sin árbitro asignado'}
          </p>
          {disputa.estado === 'RESUELTO' && (
            <div className="mt-3 rounded-md border border-auditada/40 bg-auditada/10 p-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Gavel aria-hidden className="size-4 text-auditada" />
                Dictamen: gana {ganador?.nombre ?? 'equipo desconocido'}
              </p>
              <p className="mt-1 text-sm">{disputa.justificacion}</p>
              {disputa.fechaResolucion && (
                <p className="mt-1 text-xs text-texto-2">
                  Emitido a las <Hora fecha={disputa.fechaResolucion} formato="exacta" />
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
