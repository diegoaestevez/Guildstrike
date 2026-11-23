import { useParams } from 'react-router'
import { Cargando } from '../../componentes/Cargando'
import { EncabezadoPagina } from '../../componentes/EncabezadoPagina'
import { ErrorDeCarga } from '../../componentes/ErrorDeCarga'
import { Seccion } from '../../componentes/Seccion'
import { usePartida } from '../../consultas/lecturas'
import { useSesion } from '../../proveedores/contextos'
import { EncabezadoPartida } from './EncabezadoPartida'
import { Expediente } from './Expediente'
import { LineaDeTiempo } from './LineaDeTiempo'
import { PanelAcciones } from './PanelAcciones'

export function PaginaPartida() {
  const { partidaId = '' } = useParams()
  const consulta = usePartida(partidaId)
  const { usuario } = useSesion()

  if (consulta.isPending) {
    return <Cargando etiqueta="Cargando la partida" />
  }
  if (consulta.isError && !consulta.data) {
    return <ErrorDeCarga error={consulta.error} reintentar={() => void consulta.refetch()} />
  }
  const partida = consulta.data
  const [equipoA, equipoB] = partida.equipos
  const totalEventos = partida.eventos.length

  return (
    <>
      <EncabezadoPagina
        titulo={`${equipoA.nombre} vs ${equipoB.nombre}`}
        migas={[
          { etiqueta: 'Torneos', a: '/torneos' },
          { etiqueta: partida.torneoNombre, a: `/torneos/${partida.torneoId}` },
          { etiqueta: `Ronda ${partida.ronda}` },
        ]}
      />
      <div className="flex flex-col gap-6">
        <EncabezadoPartida partida={partida} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] xl:items-start">
          <div className="xl:sticky xl:top-24 xl:order-2">
            <PanelAcciones partida={partida} usuario={usuario} />
          </div>
          <div className="flex min-w-0 flex-col gap-6 xl:order-1">
            <Seccion
              titulo="Historial de eventos"
              descripcion={
                totalEventos
                  ? `${totalEventos} ${totalEventos === 1 ? 'evento' : 'eventos'}, del primero al último. Nada se borra ni se edita.`
                  : 'Cada paso de la partida queda registrado aquí.'
              }
            >
              <LineaDeTiempo partida={partida} />
            </Seccion>
            <Seccion titulo="Reportes y evidencias" descripcion="Lo que declaró cada equipo, tal como llegó.">
              <Expediente partida={partida} />
            </Seccion>
          </div>
        </div>
      </div>
    </>
  )
}
