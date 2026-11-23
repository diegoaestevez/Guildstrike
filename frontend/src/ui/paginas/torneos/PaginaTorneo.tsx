import { UsersRound } from 'lucide-react'
import { useParams } from 'react-router'
import type { Torneo, Usuario } from '../../../dominio/tipos'
import { Cargando } from '../../componentes/Cargando'
import { EncabezadoPagina } from '../../componentes/EncabezadoPagina'
import { ErrorDeCarga } from '../../componentes/ErrorDeCarga'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { Insignia, InsigniaTorneo } from '../../componentes/Insignia'
import { Seccion } from '../../componentes/Seccion'
import { useTorneo } from '../../consultas/lecturas'
import { FORMATO } from '../../presentacion'
import { useSesion } from '../../proveedores/contextos'
import { AccionesTorneo } from './AccionesTorneo'
import { Llaves } from './Llaves'

function EquiposInscritos({ torneo, usuario }: { torneo: Torneo; usuario: Usuario }) {
  if (torneo.equipos.length === 0) {
    return (
      <EstadoVacio icono={UsersRound} titulo="Nadie se ha inscrito">
        Los capitanes inscriben a su equipo mientras las inscripciones estén abiertas.
      </EstadoVacio>
    )
  }
  return (
    <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {torneo.equipos.map((equipo, indice) => (
        <li key={equipo.id} className="flex items-center justify-between gap-3 rounded-md border border-borde bg-elevada px-3 py-2">
          <span className="flex min-w-0 items-center gap-3">
            <span className="font-datos text-xs text-texto-2 tabular-nums">{String(indice + 1).padStart(2, '0')}</span>
            <span className="truncate text-sm">{equipo.nombre}</span>
            {usuario.equipo?.id === equipo.id && (
              <Insignia presentacion={{ etiqueta: 'Tu equipo', tono: 'oro', icono: UsersRound }} />
            )}
          </span>
          <span className="shrink-0 font-datos text-xs text-texto-2 tabular-nums">{equipo.totalIntegrantes} int.</span>
        </li>
      ))}
    </ol>
  )
}

export function PaginaTorneo() {
  const { torneoId = '' } = useParams()
  const consulta = useTorneo(torneoId)
  const { usuario } = useSesion()

  if (consulta.isPending) {
    return <Cargando etiqueta="Cargando el torneo" />
  }
  if (consulta.isError && !consulta.data) {
    return <ErrorDeCarga error={consulta.error} reintentar={() => void consulta.refetch()} />
  }
  const torneo = consulta.data
  return (
    <>
      <EncabezadoPagina
        titulo={torneo.nombre}
        migas={[{ etiqueta: 'Torneos', a: '/torneos' }, { etiqueta: torneo.nombre }]}
        detalles={<InsigniaTorneo estado={torneo.estado} />}
        descripcion={`${FORMATO[torneo.formato]} · ${torneo.equipos.length} equipos inscritos${
          torneo.rondas.length ? ` · ronda ${torneo.rondas.length}` : ''
        }`}
      />
      <div className="flex flex-col gap-6">
        <AccionesTorneo torneo={torneo} usuario={usuario} />
        <Seccion titulo="Llaves" descripcion="Abre una partida para ver su marcador, sus evidencias y su historial de eventos.">
          <Llaves torneo={torneo} />
        </Seccion>
        <Seccion titulo="Equipos inscritos" descripcion="En el orden en que se inscribieron, que es el orden en que se emparejan.">
          <EquiposInscritos torneo={torneo} usuario={usuario} />
        </Seccion>
      </div>
    </>
  )
}
