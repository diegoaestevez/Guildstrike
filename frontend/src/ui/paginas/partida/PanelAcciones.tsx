import { CirclePlay, Gavel, Info, Square } from 'lucide-react'
import type { ReactNode } from 'react'
import { accionesPermitidas, equipoDelCapitan, type AccionesPermitidas } from '../../../dominio/partida'
import type { EquipoRef, Partida, Usuario } from '../../../dominio/tipos'
import { AvisoDeError } from '../../componentes/AvisoDeError'
import { Boton, EnlaceBoton } from '../../componentes/Boton'
import { Paso, type EstadoPaso } from '../../componentes/Paso'
import { Seccion } from '../../componentes/Seccion'
import { useIniciarPartida, useTerminarPartida } from '../../consultas/acciones'
import { useAhora } from '../../ganchos/useAhora'
import { ESTADO_PARTIDA, ROL } from '../../presentacion'
import { FormularioDisputa } from './FormularioDisputa'
import { PasoEvidencia } from './PasoEvidencia'
import { PasoReporte } from './PasoReporte'

function Nota({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm text-texto-2">
      <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

function BotonIniciar({ partida }: { partida: Partida }) {
  const iniciar = useIniciarPartida(partida.id)
  return (
    <div className="flex flex-col gap-3">
      <Nota>Al iniciarla, la partida pasa a EN_CURSO y queda el primer evento en su historial.</Nota>
      <div>
        <Boton variante="principal" icono={CirclePlay} cargando={iniciar.isPending} onClick={() => iniciar.mutate()}>
          Iniciar partida
        </Boton>
      </div>
      <AvisoDeError error={iniciar.error} />
    </div>
  )
}

function BotonTerminar({ partida, principal }: { partida: Partida; principal: boolean }) {
  const terminar = useTerminarPartida(partida.id)
  return (
    <div className="flex flex-col gap-3">
      <Nota>Terminar fija la hora de fin y abre la ventana de 5 minutos para que cada capitán suba su evidencia.</Nota>
      <div>
        <Boton variante={principal ? 'principal' : 'secundario'} icono={Square} cargando={terminar.isPending} onClick={() => terminar.mutate()}>
          Terminar la partida
        </Boton>
      </div>
      <AvisoDeError error={terminar.error} />
    </div>
  )
}

function AccionesAdministrador({ partida, acciones }: { partida: Partida; acciones: AccionesPermitidas }) {
  if (acciones.INICIAR.permitida) return <BotonIniciar partida={partida} />
  if (acciones.TERMINAR.permitida) return <BotonTerminar partida={partida} principal />
  if (partida.estado === 'EN_CURSO') {
    return <Nota>La partida ya terminó. Ahora cada capitán sube su evidencia y reporta su marcador.</Nota>
  }
  return <Nota>No hay acciones de administración para una partida {ESTADO_PARTIDA[partida.estado].etiqueta.toLowerCase()}.</Nota>
}

function estadoDelPaso(hecho: boolean, disponible: boolean): EstadoPaso {
  if (hecho) return 'hecho'
  return disponible ? 'actual' : 'pendiente'
}

function AccionesCapitan({ partida, equipo, acciones, ahora }: { partida: Partida; equipo: EquipoRef; acciones: AccionesPermitidas; ahora: Date }) {
  const subioEvidencia = partida.evidencias.some((evidencia) => evidencia.equipoId === equipo.id)
  const reporto = partida.reportes.some((reporte) => reporte.equipoId === equipo.id)
  return (
    <div className="flex flex-col gap-2">
      {acciones.TERMINAR.permitida && (
        <div className="mb-4">
          <BotonTerminar partida={partida} principal />
        </div>
      )}
      <ol>
        <Paso numero={1} titulo="Sube tu evidencia" estado={estadoDelPaso(subioEvidencia, acciones.SUBIR_EVIDENCIA.permitida)}>
          <PasoEvidencia partida={partida} equipo={equipo} permiso={acciones.SUBIR_EVIDENCIA} ahora={ahora} />
        </Paso>
        <Paso numero={2} titulo="Reporta el marcador" estado={estadoDelPaso(reporto, acciones.REPORTAR_RESULTADO.permitida)}>
          <PasoReporte partida={partida} equipo={equipo} permiso={acciones.REPORTAR_RESULTADO} ahora={ahora} />
        </Paso>
      </ol>
      {acciones.ABRIR_DISPUTA.permitida && <FormularioDisputa partidaId={partida.id} />}
    </div>
  )
}

function AccionesArbitro({ partida }: { partida: Partida }) {
  if (partida.disputa?.estado === 'ABIERTO') {
    return (
      <div className="flex flex-col gap-3">
        <Nota>Esta partida tiene una disputa abierta. Revisa los reportes y las evidencias de los dos equipos antes de dictaminar.</Nota>
        <div>
          <EnlaceBoton to={`/arbitraje/${partida.id}`} variante="principal" icono={Gavel}>
            Revisar la disputa
          </EnlaceBoton>
        </div>
      </div>
    )
  }
  return <Nota>Esta partida no tiene una disputa abierta.</Nota>
}

/** Las acciones del usuario en sesión, según su rol y el estado de la partida (dominio/partida.ts). */
export function PanelAcciones({ partida, usuario }: { partida: Partida; usuario: Usuario }) {
  // Cada segundo: la ventana de evidencia y su cuenta regresiva dependen de la hora.
  const ahora = useAhora()
  const acciones = accionesPermitidas(partida, usuario, ahora)
  const equipo = equipoDelCapitan(partida, usuario)

  let contenido: ReactNode
  if (usuario.rol === 'ADMINISTRADOR') {
    contenido = <AccionesAdministrador partida={partida} acciones={acciones} />
  } else if (usuario.rol === 'ARBITRO') {
    contenido = <AccionesArbitro partida={partida} />
  } else if (equipo) {
    contenido = <AccionesCapitan partida={partida} equipo={equipo} acciones={acciones} ahora={ahora} />
  } else {
    contenido = <Nota>Tu equipo no juega esta partida: puedes ver su historial, pero no reportar ni subir evidencia.</Nota>
  }

  return (
    <Seccion titulo="Tus acciones" descripcion={`${usuario.nombre} · ${equipo ? `capitán de ${equipo.nombre}` : ROL[usuario.rol]}`}>
      {contenido}
    </Seccion>
  )
}
