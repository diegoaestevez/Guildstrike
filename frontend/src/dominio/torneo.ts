import { MENSAJES_DEL_MODELO, MENSAJES_FUERA_DEL_MODELO } from './mensajes'
import { partidaCompleta } from './partida'
import type { EquipoRef, Ronda, Torneo } from './tipos'

export const MINIMO_EQUIPOS_PARA_CERRAR = 4

/** Torneo.cerrarInscripciones: el mismo orden de guardas y los mismos mensajes. */
export function motivoParaNoCerrar(torneo: Pick<Torneo, 'estado' | 'equipos'>): string | null {
  if (torneo.estado !== 'ACTIVO') {
    return MENSAJES_DEL_MODELO.torneoYaNoActivo
  }
  if (torneo.equipos.length < MINIMO_EQUIPOS_PARA_CERRAR) {
    return MENSAJES_DEL_MODELO.faltanEquipos
  }
  return null
}

/** Ronda.estaCompleta: tiene partidas y todas terminaron validadas o auditadas. */
export function rondaCompleta(ronda: Ronda): boolean {
  return ronda.partidas.length > 0 && ronda.partidas.every((partida) => partidaCompleta(partida.estado))
}

/**
 * Los equipos que avanzan de una ronda: el pase automático primero, para que no vuelva a quedar
 * impar dos rondas seguidas, y después los ganadores en el orden de las partidas.
 * Es la excepción a propósito frente al backend, que hoy vuelve a emparejar a todos los inscritos.
 */
export function equiposQueAvanzan(ronda: Ronda): EquipoRef[] {
  const ganadores = ronda.partidas.flatMap((partida) => {
    const ganador = partida.equipos.find((equipo) => equipo.id === partida.ganadorId)
    return ganador ? [ganador] : []
  })
  return ronda.paseAutomatico ? [ronda.paseAutomatico, ...ganadores] : ganadores
}

export function ultimaRonda(torneo: Pick<Torneo, 'rondas'>): Ronda | null {
  return torneo.rondas.at(-1) ?? null
}

/** Hay campeón cuando la última ronda está completa y de ella avanza un solo equipo. */
export function campeon(torneo: Pick<Torneo, 'rondas'>): EquipoRef | null {
  const ronda = ultimaRonda(torneo)
  if (!ronda || !rondaCompleta(ronda)) {
    return null
  }
  const avanzan = equiposQueAvanzan(ronda)
  return avanzan.length === 1 ? (avanzan[0] ?? null) : null
}

/** Torneo.generarRonda más las dos guardas de flujo que el modelo no tiene (sin rondas, con campeón). */
export function motivoParaNoGenerarRonda(torneo: Pick<Torneo, 'rondas'>): string | null {
  const ronda = ultimaRonda(torneo)
  if (!ronda) {
    return MENSAJES_FUERA_DEL_MODELO.torneoSinRondas
  }
  if (!rondaCompleta(ronda)) {
    return MENSAJES_DEL_MODELO.rondaAnteriorIncompleta
  }
  if (campeon(torneo)) {
    return MENSAJES_FUERA_DEL_MODELO.torneoConCampeon
  }
  return null
}
