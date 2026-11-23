import { Bot, ScrollText } from 'lucide-react'
import type { EventoPartida, Partida } from '../../../dominio/tipos'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { Hora } from '../../componentes/Hora'
import { dia, desde } from '../../formato'
import { CLASES_TONO, EVENTO } from '../../presentacion'

/** Para un reporte, el marcador que declaró ese capitán; el evento del modelo solo dice de qué equipo es. */
function detalleDelReporte(evento: EventoPartida, partida: Partida): string | null {
  if (evento.tipo !== 'RESULTADO_REPORTADO' || !evento.usuario) {
    return null
  }
  const reporte = partida.reportes.find((candidato) => candidato.capitanId === evento.usuario?.id)
  return reporte ? `${reporte.marcadorPropio}–${reporte.marcadorRival} (propio–rival)` : null
}

/** RF-15: el historial de la partida, del primer evento al último, con hora exacta, quién y qué. */
export function LineaDeTiempo({ partida }: { partida: Partida }) {
  const { eventos } = partida
  const primero = eventos[0]
  if (!primero) {
    return (
      <EstadoVacio icono={ScrollText} titulo="Todavía no hay eventos">
        El primero se registra cuando el administrador inicia la partida.
      </EstadoVacio>
    )
  }
  return (
    <ol aria-label="Eventos de la partida">
      {eventos.map((evento, indice) => {
        const { etiqueta, icono: Icono, tono } = EVENTO[evento.tipo]
        const detalle = detalleDelReporte(evento, partida)
        const esUltimo = indice === eventos.length - 1
        return (
          <li key={`${evento.tipo}-${evento.fecha.getTime()}-${indice}`} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 sm:gap-x-4">
            <div className="flex flex-col items-center">
              <span className={`grid size-9 shrink-0 place-items-center rounded-full border ${CLASES_TONO[tono]}`}>
                <Icono aria-hidden className="size-4" />
              </span>
              {!esUltimo && <span aria-hidden className="my-1 w-px flex-1 bg-borde" />}
            </div>
            <div className={`min-w-0 ${esUltimo ? '' : 'pb-6'}`}>
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 pt-1.5">
                <span className="font-datos text-xs text-texto-2 tabular-nums">#{String(indice + 1).padStart(2, '0')}</span>
                <span className="font-medium">{etiqueta}</span>
                <code className="font-datos text-xs text-texto-2">{evento.tipo}</code>
              </div>
              <p className="mt-1 text-sm break-words text-texto-2">
                {evento.descripcion}
                {detalle && <span className="font-datos text-texto"> · {detalle}</span>}
              </p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-texto-2">
                <span className="text-texto">
                  <Hora fecha={evento.fecha} formato="exacta" />
                </span>
                <span className="font-datos">{dia(evento.fecha)}</span>
                <span className="font-datos tabular-nums" title="Tiempo desde el primer evento">
                  {desde(primero.fecha, evento.fecha)}
                </span>
                <span className="inline-flex items-center gap-1">
                  {evento.usuario ? (
                    evento.usuario.nombre
                  ) : (
                    <>
                      <Bot aria-hidden className="size-3.5" />
                      Sistema
                    </>
                  )}
                </span>
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
