import { ventanaDeEvidencia } from './evidencia'
import { MENSAJES_DEL_MODELO, MENSAJES_FUERA_DEL_MODELO } from './mensajes'
import type { EquipoRef, EstadoPartida, Marcador, Partida, Reporte, Usuario } from './tipos'

export type AccionPartida =
  | 'INICIAR'
  | 'TERMINAR'
  | 'SUBIR_EVIDENCIA'
  | 'REPORTAR_RESULTADO'
  | 'ABRIR_DISPUTA'
  | 'TOMAR_DISPUTA'
  | 'EMITIR_DICTAMEN'

export type Permiso = { permitida: true } | { permitida: false; motivo: string }

export type AccionesPermitidas = Record<AccionPartida, Permiso>

const permitida: Permiso = { permitida: true }
const negada = (motivo: string): Permiso => ({ permitida: false, motivo })

// Partida._exigirNoCongelada: estos tres estados ya no aceptan reportes, evidencias ni disputas.
const ESTADOS_CERRADOS: readonly EstadoPartida[] = ['CONGELADA', 'AUDITADA', 'FINALIZADA']

export function partidaAdmiteCambios(estado: EstadoPartida): boolean {
  return !ESTADOS_CERRADOS.includes(estado)
}

/** El equipo que el usuario representa en la partida, si es capitán de uno de los dos. */
export function equipoDelCapitan(partida: Pick<Partida, 'equipos'>, usuario: Usuario): EquipoRef | null {
  if (usuario.rol !== 'CAPITAN' || !usuario.equipo) {
    return null
  }
  const propio = usuario.equipo.id
  return partida.equipos.find((equipo) => equipo.id === propio) ?? null
}

export function rivalDe(partida: Pick<Partida, 'equipos'>, equipoId: string): EquipoRef {
  const [equipoA, equipoB] = partida.equipos
  return equipoA.id === equipoId ? equipoB : equipoA
}

/**
 * Qué puede hacer este usuario en esta partida ahora mismo, y si no puede, por qué.
 *
 * Replica las guardas de Partida.js y Disputa.js con sus mismos mensajes, y agrega el rol
 * que debe tener quien actúa, que el modelo no revisa (lo revisará la capa de rutas de la API).
 * Tres reglas son del flujo y no del modelo, y están anotadas como hallazgo en el contrato:
 * solo se termina una partida en curso (el modelo también deja terminar una programada, sin
 * evento de inicio), no se termina dos veces (el modelo reinicia la ventana de evidencia) y no
 * se reporta un marcador antes de terminarla.
 */
export function accionesPermitidas(partida: Partida, usuario: Usuario, ahora: Date): AccionesPermitidas {
  const equipoPropio = equipoDelCapitan(partida, usuario)
  const esAdministrador = usuario.rol === 'ADMINISTRADOR'
  const esArbitro = usuario.rol === 'ARBITRO'
  const sinPermiso = negada(MENSAJES_FUERA_DEL_MODELO.sinPermiso)
  const admiteCambios = partidaAdmiteCambios(partida.estado)

  const iniciar = (): Permiso => {
    if (!esAdministrador) return sinPermiso
    if (partida.estado !== 'PROGRAMADA') return negada(MENSAJES_DEL_MODELO.seEsperabaEstado('PROGRAMADA'))
    return permitida
  }

  const terminar = (): Permiso => {
    if (!esAdministrador && !equipoPropio) return sinPermiso
    if (partida.estado !== 'EN_CURSO') return negada(MENSAJES_DEL_MODELO.noPuedeFinalizarse)
    if (partida.fechaFin) return negada(MENSAJES_FUERA_DEL_MODELO.partidaYaTermino)
    return permitida
  }

  const subirEvidencia = (): Permiso => {
    if (!equipoPropio) return sinPermiso
    if (!admiteCambios) return negada(MENSAJES_DEL_MODELO.partidaNoAdmiteCambios)
    const ventana = ventanaDeEvidencia(partida.fechaFin, ahora)
    if (ventana.estado === 'SIN_FIN') return negada(MENSAJES_DEL_MODELO.evidenciaAntesDelFin)
    if (ventana.estado === 'CERRADA') return negada(MENSAJES_DEL_MODELO.evidenciaFueraDeTiempo)
    return permitida
  }

  const reportar = (): Permiso => {
    if (!equipoPropio) return sinPermiso
    if (!admiteCambios) return negada(MENSAJES_DEL_MODELO.partidaNoAdmiteCambios)
    if (partida.reportes.some((reporte) => reporte.equipoId === equipoPropio.id)) {
      return negada(MENSAJES_DEL_MODELO.equipoYaReporto)
    }
    if (!partida.fechaFin) return negada(MENSAJES_FUERA_DEL_MODELO.primeroTerminar)
    return permitida
  }

  const abrirDisputa = (): Permiso => {
    if (!equipoPropio) return sinPermiso
    if (!admiteCambios) return negada(MENSAJES_DEL_MODELO.partidaNoAdmiteCambios)
    if (partida.disputa) return negada(MENSAJES_DEL_MODELO.partidaYaTieneDisputa)
    return permitida
  }

  const tomarDisputa = (): Permiso => {
    if (!esArbitro) return sinPermiso
    if (!partida.disputa) return negada(MENSAJES_FUERA_DEL_MODELO.partidaSinDisputa)
    if (partida.disputa.estado !== 'ABIERTO') return negada(MENSAJES_DEL_MODELO.ticketNoDisponible)
    // El modelo deja que un segundo árbitro reasigne el ticket; la interfaz no lo ofrece.
    if (partida.disputa.arbitro) return negada(MENSAJES_DEL_MODELO.ticketNoDisponible)
    return permitida
  }

  const emitirDictamen = (): Permiso => {
    if (!esArbitro) return sinPermiso
    if (!partida.disputa) return negada(MENSAJES_FUERA_DEL_MODELO.partidaSinDisputa)
    if (partida.disputa.estado !== 'ABIERTO' || partida.disputa.arbitro?.id !== usuario.id) {
      return negada(MENSAJES_DEL_MODELO.ticketNoResoluble)
    }
    return permitida
  }

  return {
    INICIAR: iniciar(),
    TERMINAR: terminar(),
    SUBIR_EVIDENCIA: subirEvidencia(),
    REPORTAR_RESULTADO: reportar(),
    ABRIR_DISPUTA: abrirDisputa(),
    TOMAR_DISPUTA: tomarDisputa(),
    EMITIR_DICTAMEN: emitirDictamen(),
  }
}

/**
 * El marcador que escribe el capitán antes de enviarlo: dos enteros de 0 en adelante (lo que exige
 * ReporteResultado) y sin empate, que el modelo acepta pero no define ganador en eliminación simple.
 * Compara números, no texto: "01" y "1" son el mismo marcador. Devuelve el motivo o null.
 */
export function validarMarcador(marcadorPropio: number, marcadorRival: number): string | null {
  const valido = (marcador: number) => Number.isInteger(marcador) && marcador >= 0
  if (!valido(marcadorPropio) || !valido(marcadorRival)) {
    return MENSAJES_FUERA_DEL_MODELO.marcadorNoEntero
  }
  if (marcadorPropio === marcadorRival) {
    return MENSAJES_FUERA_DEL_MODELO.marcadorEmpatado
  }
  return null
}

/** Partida._validarReportes: coinciden si lo propio de uno es lo rival del otro, y viceversa. */
export function reportesCoinciden(primero: Reporte, segundo: Reporte): boolean {
  return primero.marcadorPropio === segundo.marcadorRival && primero.marcadorRival === segundo.marcadorPropio
}

/** El marcador validado por los dos capitanes, en el orden de `equipos`. */
export function marcadorValidado(
  equipos: readonly [EquipoRef, EquipoRef],
  reportes: readonly Reporte[],
): Marcador | null {
  const [primero, segundo] = reportes
  if (reportes.length !== 2 || !primero || !segundo || !reportesCoinciden(primero, segundo)) {
    return null
  }
  const primeroEsA = primero.equipoId === equipos[0].id
  return primeroEsA
    ? { equipoA: primero.marcadorPropio, equipoB: primero.marcadorRival }
    : { equipoA: primero.marcadorRival, equipoB: primero.marcadorPropio }
}

/** Una partida cuenta como completa para su ronda en estos estados (Ronda.estaCompleta). */
export function partidaCompleta(estado: EstadoPartida): boolean {
  return estado === 'FINALIZADA' || estado === 'AUDITADA'
}
