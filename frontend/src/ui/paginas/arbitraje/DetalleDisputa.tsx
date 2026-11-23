import { ArrowLeft, ArrowUpRight, Hand, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import { accionesPermitidas } from '../../../dominio/partida'
import type { Partida, Usuario } from '../../../dominio/tipos'
import { AvisoDeError } from '../../componentes/AvisoDeError'
import { Boton } from '../../componentes/Boton'
import { Cargando } from '../../componentes/Cargando'
import { ErrorDeCarga } from '../../componentes/ErrorDeCarga'
import { Hora } from '../../componentes/Hora'
import { InsigniaPartida } from '../../componentes/Insignia'
import { Seccion } from '../../componentes/Seccion'
import { useTomarDisputa } from '../../consultas/acciones'
import { usePartida } from '../../consultas/lecturas'
import { useAhora } from '../../ganchos/useAhora'
import { useSesion } from '../../proveedores/contextos'
import { Expediente } from '../partida/Expediente'
import { FormularioDictamen } from './FormularioDictamen'

function Decision({ partida, usuario }: { partida: Partida; usuario: Usuario }) {
  const tomar = useTomarDisputa(partida.id)
  const { disputa } = partida
  const ahora = useAhora(60_000)
  const acciones = accionesPermitidas(partida, usuario, ahora)

  if (!disputa) {
    return <p className="text-sm text-texto-2">Esta partida no tiene disputa.</p>
  }
  if (disputa.estado === 'RESUELTO') {
    return (
      <div aria-live="polite" className="flex flex-col gap-3">
        <p className="flex items-start gap-2 text-sm">
          <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-auditada" />
          <span>
            Dictamen emitido
            {disputa.fechaResolucion && (
              <>
                {' '}
                a las <Hora fecha={disputa.fechaResolucion} formato="exacta" />
              </>
            )}
            . La partida quedó <span className="font-datos text-auditada">AUDITADA</span> y el resultado ya cuenta en las llaves.
          </span>
        </p>
        <Link to={`/partidas/${partida.id}`} className="inline-flex items-center gap-1 text-sm text-oro hover:underline">
          Ver el historial de la partida
          <ArrowUpRight aria-hidden className="size-4" />
        </Link>
      </div>
    )
  }
  if (acciones.EMITIR_DICTAMEN.permitida) {
    return <FormularioDictamen partida={partida} />
  }
  if (acciones.TOMAR_DISPUTA.permitida) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-texto-2">Al tomarla quedas como árbitro responsable: solo tú podrás emitir el dictamen.</p>
        <div>
          <Boton variante="principal" icono={Hand} cargando={tomar.isPending} onClick={() => tomar.mutate()}>
            Tomar la disputa
          </Boton>
        </div>
        <AvisoDeError error={tomar.error} />
      </div>
    )
  }
  return (
    <p className="text-sm text-texto-2">
      {disputa.arbitro ? `La tomó ${disputa.arbitro.nombre}; solo esa persona puede dictaminar.` : acciones.TOMAR_DISPUTA.motivo}
    </p>
  )
}

export function DetalleDisputa({ partidaId }: { partidaId: string }) {
  const consulta = usePartida(partidaId)
  const { usuario } = useSesion()

  if (consulta.isPending) {
    return <Cargando etiqueta="Cargando la disputa" lineas={2} />
  }
  if (consulta.isError && !consulta.data) {
    return <ErrorDeCarga error={consulta.error} reintentar={() => void consulta.refetch()} />
  }
  const partida = consulta.data
  const [equipoA, equipoB] = partida.equipos

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <Link to="/arbitraje" className="inline-flex items-center gap-1 self-start text-sm text-texto-2 hover:text-texto xl:hidden">
        <ArrowLeft aria-hidden className="size-4" />
        Volver a la bandeja
      </Link>
      <Seccion
        titulo={`${equipoA.nombre} vs ${equipoB.nombre}`}
        descripcion={`${partida.torneoNombre} · ronda ${partida.ronda}`}
        acciones={<InsigniaPartida estado={partida.estado} />}
      >
        <Expediente partida={partida} />
        <Link to={`/partidas/${partida.id}`} className="mt-4 inline-flex items-center gap-1 text-sm text-texto-2 hover:text-texto">
          Ver la partida y su historial completo
          <ArrowUpRight aria-hidden className="size-4" />
        </Link>
      </Seccion>
      <Seccion titulo="Dictamen" descripcion="Revisa los reportes y las evidencias de los dos equipos antes de decidir.">
        <Decision partida={partida} usuario={usuario} />
      </Seccion>
    </div>
  )
}
