import { Gavel, ShieldCheck } from 'lucide-react'
import { NavLink, useParams } from 'react-router'
import type { DisputaResumen } from '../../../dominio/tipos'
import { Cargando } from '../../componentes/Cargando'
import { EncabezadoPagina } from '../../componentes/EncabezadoPagina'
import { ErrorDeCarga } from '../../componentes/ErrorDeCarga'
import { EstadoVacio } from '../../componentes/EstadoVacio'
import { Seccion } from '../../componentes/Seccion'
import { SoloPara } from '../../componentes/SoloPara'
import { useDisputas } from '../../consultas/lecturas'
import { relativa } from '../../formato'
import { useAhora } from '../../ganchos/useAhora'
import { useSesion } from '../../proveedores/contextos'
import { DetalleDisputa } from './DetalleDisputa'

function ElementoBandeja({ disputa, ahora }: { disputa: DisputaResumen; ahora: Date }) {
  const { usuario } = useSesion()
  const responsable = !disputa.arbitro
    ? 'Sin árbitro'
    : disputa.arbitro.id === usuario.id
      ? 'La tomaste tú'
      : `La tomó ${disputa.arbitro.nombre}`
  return (
    <li>
      <NavLink
        to={`/arbitraje/${disputa.partidaId}`}
        className={({ isActive }) =>
          `block rounded-md border px-3 py-3 transition-colors ${
            isActive ? 'border-oro/50 bg-oro/10' : 'border-borde bg-elevada hover:border-texto-2/50'
          }`
        }
      >
        <p className="text-xs text-texto-2">
          {disputa.torneoNombre} · ronda {disputa.ronda}
        </p>
        <p className="mt-1 text-sm font-medium">
          {disputa.equipos[0].nombre} <span className="text-texto-2">vs</span> {disputa.equipos[1].nombre}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-texto-2">{disputa.motivo}</p>
        <p className="mt-2 flex flex-wrap gap-x-2 text-xs text-texto-2">
          <span>Abierta {relativa(disputa.fechaCreacion, ahora)}</span>
          <span aria-hidden>·</span>
          <span className={disputa.arbitro ? '' : 'text-abierto'}>{responsable}</span>
        </p>
      </NavLink>
    </li>
  )
}

function Bandeja() {
  const consulta = useDisputas('ABIERTO')
  const ahora = useAhora(30_000)
  if (consulta.isPending) {
    return <Cargando etiqueta="Cargando disputas abiertas" lineas={2} />
  }
  if (consulta.isError && !consulta.data) {
    return <ErrorDeCarga error={consulta.error} reintentar={() => void consulta.refetch()} />
  }
  if (consulta.data.length === 0) {
    return (
      <EstadoVacio icono={ShieldCheck} titulo="No hay disputas abiertas">
        Cuando dos capitanes reporten marcadores distintos o alguien abra una disputa, aparecerá aquí.
      </EstadoVacio>
    )
  }
  return (
    <ul className="flex flex-col gap-2">
      {consulta.data.map((disputa) => (
        <ElementoBandeja key={disputa.partidaId} disputa={disputa} ahora={ahora} />
      ))}
    </ul>
  )
}

export function PaginaArbitraje() {
  const { partidaId } = useParams()
  return (
    <SoloPara roles={['ARBITRO']}>
      <EncabezadoPagina
        titulo="Arbitraje"
        descripcion="Disputas abiertas, de la más antigua a la más reciente. Cada dictamen queda en el historial de su partida."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:items-start">
        <div className={partidaId ? 'hidden xl:block' : ''}>
          <Seccion titulo="Bandeja">
            <Bandeja />
          </Seccion>
        </div>
        <div className={partidaId ? '' : 'hidden xl:block'}>
          {partidaId ? (
            // La llave reinicia el formulario de dictamen al pasar de una disputa a otra.
            <DetalleDisputa key={partidaId} partidaId={partidaId} />
          ) : (
            <EstadoVacio icono={Gavel} titulo="Elige una disputa">
              Verás los reportes y las evidencias de los dos equipos lado a lado para emitir tu dictamen.
            </EstadoVacio>
          )}
        </div>
      </div>
    </SoloPara>
  )
}
