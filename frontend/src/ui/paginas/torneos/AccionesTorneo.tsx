import { CircleCheck, Lock, Shuffle, UserPlus, UsersRound } from 'lucide-react'
import { MENSAJES_DEL_MODELO } from '../../../dominio/mensajes'
import { MINIMO_EQUIPOS_PARA_CERRAR, motivoParaNoCerrar, motivoParaNoGenerarRonda } from '../../../dominio/torneo'
import type { Torneo, Usuario } from '../../../dominio/tipos'
import { AvisoDeError } from '../../componentes/AvisoDeError'
import { Boton, EnlaceBoton } from '../../componentes/Boton'
import { Seccion } from '../../componentes/Seccion'
import { useCerrarInscripciones, useGenerarSiguienteRonda, useInscribirEquipo } from '../../consultas/acciones'
import { mensajeDeError } from '../../errores'

function Medidor({ valor, minimo }: { valor: number; minimo: number }) {
  const completo = valor >= minimo
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-texto-2">
        <span>Equipos inscritos</span>
        <span className="font-datos tabular-nums">
          {valor} de {minimo} mínimo
        </span>
      </div>
      <div
        role="meter"
        aria-label="Equipos inscritos contra el mínimo para cerrar"
        aria-valuemin={0}
        aria-valuemax={minimo}
        aria-valuenow={Math.min(valor, minimo)}
        className="mt-1.5 grid gap-1"
        style={{ gridTemplateColumns: `repeat(${minimo}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: minimo }, (_, indice) => (
          <span key={indice} className={`h-1.5 rounded-full ${indice < valor ? (completo ? 'bg-finalizada' : 'bg-oro') : 'bg-borde'}`} />
        ))}
      </div>
    </div>
  )
}

function CerrarInscripciones({ torneo }: { torneo: Torneo }) {
  const cerrar = useCerrarInscripciones(torneo.id)
  const motivo = motivoParaNoCerrar(torneo)
  const faltan = MINIMO_EQUIPOS_PARA_CERRAR - torneo.equipos.length
  return (
    <div>
      <p className="text-sm text-texto-2">
        Al cerrar, el torneo pasa a <span className="font-datos text-texto">EN_CURSO</span> y se generan las llaves de la ronda 1:
        los equipos se emparejan en orden y, si son impares, el último pasa directo.
        {faltan > 0 && ` Se requieren al menos ${MINIMO_EQUIPOS_PARA_CERRAR} equipos: falta ${faltan === 1 ? 'uno' : faltan}.`}
      </p>
      <Medidor valor={torneo.equipos.length} minimo={MINIMO_EQUIPOS_PARA_CERRAR} />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Boton
          variante="principal"
          icono={Lock}
          cargando={cerrar.isPending}
          disabled={motivo !== null}
          aria-describedby={motivo ? 'motivo-cerrar' : undefined}
          onClick={() => cerrar.mutate()}
        >
          Cerrar inscripciones
        </Boton>
        {motivo && (
          <span id="motivo-cerrar" className="text-sm text-texto-2">
            {motivo}
          </span>
        )}
      </div>
      <AvisoDeError error={cerrar.error} className="mt-3" />
    </div>
  )
}

function GenerarRonda({ torneo }: { torneo: Torneo }) {
  const generar = useGenerarSiguienteRonda(torneo.id)
  const motivo = motivoParaNoGenerarRonda(torneo)
  return (
    <div>
      <p className="text-sm text-texto-2">
        Cuando todas las partidas de la última ronda estén finalizadas o auditadas, avanzan los ganadores y el pase automático.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Boton
          variante="principal"
          icono={Shuffle}
          cargando={generar.isPending}
          disabled={motivo !== null}
          aria-describedby={motivo ? 'motivo-ronda' : undefined}
          onClick={() => generar.mutate()}
        >
          Generar siguiente ronda
        </Boton>
        {motivo && (
          <span id="motivo-ronda" className="text-sm text-texto-2">
            {motivo}
          </span>
        )}
      </div>
      <AvisoDeError error={generar.error} className="mt-3" />
    </div>
  )
}

function InscribirMiEquipo({ torneo, usuario }: { torneo: Torneo; usuario: Usuario }) {
  const inscribir = useInscribirEquipo(torneo.id)
  const equipo = usuario.equipo
  if (!equipo) {
    return <p className="text-sm text-texto-2">Tu cuenta de capitán no tiene equipo asignado.</p>
  }
  if (torneo.equipos.some((inscrito) => inscrito.id === equipo.id)) {
    return (
      <p className="flex items-center gap-2 text-sm">
        <CircleCheck aria-hidden className="size-4 text-finalizada" />
        {equipo.nombre} ya está inscrito en este torneo.
      </p>
    )
  }
  const rosterIncompleto = mensajeDeError(inscribir.error) === MENSAJES_DEL_MODELO.equipoFueraDeRango
  return (
    <div>
      <p className="text-sm text-texto-2">
        Inscribe a <span className="text-texto">{equipo.nombre}</span>. El roster debe tener entre 4 y 9 integrantes.
      </p>
      <div className="mt-4">
        <Boton variante="principal" icono={UserPlus} cargando={inscribir.isPending} onClick={() => inscribir.mutate(equipo.id)}>
          Inscribir a mi equipo
        </Boton>
      </div>
      <AvisoDeError error={inscribir.error} className="mt-3" />
      {rosterIncompleto && (
        <EnlaceBoton to="/mi-equipo" icono={UsersRound} className="mt-3">
          Completar el roster en Mi equipo
        </EnlaceBoton>
      )}
    </div>
  )
}

/** Lo que el rol en sesión puede hacer con el torneo. Si no hay nada, no se muestra. */
export function AccionesTorneo({ torneo, usuario }: { torneo: Torneo; usuario: Usuario }) {
  let contenido = null
  if (usuario.rol === 'ADMINISTRADOR') {
    contenido = torneo.estado === 'ACTIVO' ? <CerrarInscripciones torneo={torneo} /> : <GenerarRonda torneo={torneo} />
  } else if (usuario.rol === 'CAPITAN' && torneo.estado === 'ACTIVO') {
    contenido = <InscribirMiEquipo torneo={torneo} usuario={usuario} />
  }
  if (!contenido) {
    return null
  }
  const titulo =
    usuario.rol === 'CAPITAN' ? 'Inscripción (RF-01)' : torneo.estado === 'ACTIVO' ? 'Cerrar inscripciones (RF-02)' : 'Siguiente ronda'
  return <Seccion titulo={titulo}>{contenido}</Seccion>
}
