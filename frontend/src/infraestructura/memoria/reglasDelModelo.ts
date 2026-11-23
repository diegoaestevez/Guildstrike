import { ErrorDeRegla } from '../../aplicacion/errores'
import { estadoRoster } from '../../dominio/equipo'
import { minutosDesdeElFin, LIMITE_EVIDENCIA_MINUTOS, validarArchivoEvidencia } from '../../dominio/evidencia'
import { MENSAJES_DEL_MODELO, MENSAJES_FUERA_DEL_MODELO } from '../../dominio/mensajes'
import { partidaAdmiteCambios, reportesCoinciden } from '../../dominio/partida'
import { MINIMO_EQUIPOS_PARA_CERRAR } from '../../dominio/torneo'
import type { TipoEvento } from '../../dominio/tipos'
import type { AlmacenEnMemoria, RegistroEquipo, RegistroPartida, RegistroTorneo, RegistroUsuario } from './almacen'

// Los métodos de backend/models portados a los registros en memoria, con el mismo orden de
// guardas y los mismos mensajes. Cada función cita el método que replica. Si el modelo
// cambia, este archivo es el único que hay que tocar del lado del front.

const regla = (mensaje: string) => new ErrorDeRegla(mensaje, 400)

// ---------- Partida.js ----------

function registrar(partida: RegistroPartida, tipo: TipoEvento, usuarioId: string | null, descripcion: string, fecha: Date) {
  partida.eventos.push({ tipo, usuarioId, descripcion, fecha: new Date(fecha) })
}

function exigirNoCongelada(partida: RegistroPartida) {
  if (!partidaAdmiteCambios(partida.estado)) {
    throw regla(MENSAJES_DEL_MODELO.partidaNoAdmiteCambios)
  }
}

/** Partida.iniciar */
export function iniciar(partida: RegistroPartida, fecha: Date) {
  if (partida.estado !== 'PROGRAMADA') {
    throw regla(MENSAJES_DEL_MODELO.seEsperabaEstado('PROGRAMADA'))
  }
  partida.estado = 'EN_CURSO'
  registrar(partida, 'PARTIDA_INICIADA', null, 'La partida inició', fecha)
}

/** Partida.finalizarJuego: no registra evento y vuelve a validar reportes, igual que el modelo. */
export function finalizarJuego(partida: RegistroPartida, fecha: Date) {
  if (partida.estado !== 'EN_CURSO' && partida.estado !== 'PROGRAMADA') {
    throw regla(MENSAJES_DEL_MODELO.noPuedeFinalizarse)
  }
  partida.fechaFin = new Date(fecha)
  validarReportes(partida, fecha)
}

/** Partida.registrarResultado + ReporteResultado */
export function registrarResultado(
  almacen: AlmacenEnMemoria,
  partida: RegistroPartida,
  capitan: RegistroUsuario,
  marcadorPropio: number,
  marcadorRival: number,
  fecha: Date,
) {
  exigirNoCongelada(partida)
  const equipoId = capitan.equipoId
  if (!equipoId || !partida.equipoIds.includes(equipoId)) {
    throw regla(MENSAJES_DEL_MODELO.capitanNoParticipa)
  }
  if (partida.reportes.some((reporte) => reporte.equipoId === equipoId)) {
    throw regla(MENSAJES_DEL_MODELO.equipoYaReporto)
  }
  if (!Number.isInteger(marcadorPropio) || !Number.isInteger(marcadorRival) || marcadorPropio < 0 || marcadorRival < 0) {
    throw regla(MENSAJES_DEL_MODELO.reporteInvalido)
  }
  partida.reportes.push({ equipoId, capitanId: capitan.id, marcadorPropio, marcadorRival, fecha: new Date(fecha) })
  registrar(partida, 'RESULTADO_REPORTADO', capitan.id, `Marcador de ${almacen.equipo(equipoId).nombre}`, fecha)
  validarReportes(partida, fecha)
}

/** Partida.agregarEvidencia + Evidencia (constructor y validar) */
export function agregarEvidencia(
  partida: RegistroPartida,
  capitan: RegistroUsuario,
  archivo: { nombre: string; tipo: string; tamanoBytes: number; url: string | null },
  fecha: Date,
) {
  exigirNoCongelada(partida)
  if (!partida.fechaFin) {
    throw regla(MENSAJES_DEL_MODELO.evidenciaAntesDelFin)
  }
  if (!capitan.equipoId) {
    throw regla(MENSAJES_DEL_MODELO.evidenciaDeOtroEquipo)
  }
  if (!archivo.nombre || !archivo.tipo || !Number.isInteger(archivo.tamanoBytes) || archivo.tamanoBytes < 0) {
    throw regla(MENSAJES_DEL_MODELO.evidenciaMetadatosInvalidos)
  }
  const problema = validarArchivoEvidencia(archivo)
  if (problema) {
    throw regla(problema)
  }
  const minutos = minutosDesdeElFin(partida.fechaFin, fecha)
  if (minutos < 0 || minutos > LIMITE_EVIDENCIA_MINUTOS) {
    throw regla(MENSAJES_DEL_MODELO.evidenciaFueraDeTiempo)
  }
  partida.evidencias.push({ ...archivo, equipoId: capitan.equipoId, capitanId: capitan.id, fechaCarga: new Date(fecha) })
  registrar(partida, 'EVIDENCIA_AGREGADA', capitan.id, archivo.nombre, fecha)
}

/** Partida.abrirDisputa + constructor de Disputa */
export function abrirDisputa(partida: RegistroPartida, solicitante: RegistroUsuario, motivo: string, fecha: Date) {
  exigirNoCongelada(partida)
  if (solicitante.equipoId && !partida.equipoIds.includes(solicitante.equipoId)) {
    throw regla(MENSAJES_DEL_MODELO.solicitanteNoParticipa)
  }
  if (partida.disputa) {
    throw regla(MENSAJES_DEL_MODELO.partidaYaTieneDisputa)
  }
  if (!motivo) {
    throw regla(MENSAJES_DEL_MODELO.disputaDatosObligatorios)
  }
  congelarConDisputa(partida, solicitante.id, motivo, fecha)
}

/** Partida._validarReportes */
function validarReportes(partida: RegistroPartida, fecha: Date) {
  const [primero, segundo] = partida.reportes
  if (partida.reportes.length !== 2 || !primero || !segundo || partida.estado === 'CONGELADA') {
    return
  }
  if (reportesCoinciden(primero, segundo)) {
    // Como el modelo: con empate, el ganador queda el segundo en reportar (ver hallazgos).
    partida.ganadorId = primero.marcadorPropio > primero.marcadorRival ? primero.equipoId : segundo.equipoId
    partida.estado = 'FINALIZADA'
    registrar(partida, 'RESULTADO_VALIDADO', null, 'Los capitanes coincidieron', fecha)
    return
  }
  congelarConDisputa(partida, segundo.capitanId, 'Marcadores discrepantes', fecha)
}

/** Partida._congelarConDisputa (R-04) */
function congelarConDisputa(partida: RegistroPartida, solicitanteId: string, motivo: string, fecha: Date) {
  partida.disputa = {
    solicitanteId,
    motivo,
    estado: 'ABIERTO',
    arbitroId: null,
    equipoGanadorId: null,
    justificacion: null,
    fechaCreacion: new Date(fecha),
    fechaResolucion: null,
  }
  partida.estado = 'CONGELADA'
  registrar(partida, 'DISPUTA_ABIERTA', solicitanteId, motivo, fecha)
}

// ---------- Disputa.js ----------

function disputaDe(partida: RegistroPartida) {
  if (!partida.disputa) {
    throw new ErrorDeRegla(MENSAJES_FUERA_DEL_MODELO.partidaSinDisputa, 404)
  }
  return partida.disputa
}

/** Disputa.asignarArbitro (vía Arbitro.asignarDisputa). Como el modelo, no registra evento. */
export function asignarArbitro(partida: RegistroPartida, arbitro: RegistroUsuario) {
  const disputa = disputaDe(partida)
  if (disputa.estado !== 'ABIERTO') {
    throw regla(MENSAJES_DEL_MODELO.ticketNoDisponible)
  }
  disputa.arbitroId = arbitro.id
}

/** Disputa.resolver + Partida.aplicarDictamen */
export function resolverDisputa(
  partida: RegistroPartida,
  arbitro: RegistroUsuario,
  equipoGanadorId: string,
  justificacion: string,
  fecha: Date,
) {
  const disputa = disputaDe(partida)
  if (disputa.estado !== 'ABIERTO' || disputa.arbitroId !== arbitro.id || !justificacion) {
    throw regla(MENSAJES_DEL_MODELO.ticketNoResoluble)
  }
  if (!partida.equipoIds.includes(equipoGanadorId)) {
    throw regla(MENSAJES_DEL_MODELO.ganadorNoParticipa)
  }
  disputa.equipoGanadorId = equipoGanadorId
  disputa.justificacion = justificacion
  disputa.estado = 'RESUELTO'
  disputa.fechaResolucion = new Date(fecha)
  partida.ganadorId = equipoGanadorId
  partida.estado = 'AUDITADA'
  registrar(partida, 'DICTAMEN_EMITIDO', arbitro.id, justificacion, fecha)
}

// ---------- Torneo.js y TorneoEliminacionSimple.js ----------

/** Torneo.inscribirEquipo */
export function inscribirEquipo(torneo: RegistroTorneo, equipo: RegistroEquipo) {
  if (torneo.estado !== 'ACTIVO') {
    throw regla(MENSAJES_DEL_MODELO.torneoNoAceptaInscripciones)
  }
  if (!estadoRoster(equipo.integranteIds.length).valido) {
    throw regla(MENSAJES_DEL_MODELO.equipoFueraDeRango)
  }
  if (torneo.equipoIds.includes(equipo.id)) {
    throw regla(MENSAJES_DEL_MODELO.equipoYaInscrito)
  }
  torneo.equipoIds.push(equipo.id)
}

/** Torneo.cerrarInscripciones */
export function cerrarInscripciones(almacen: AlmacenEnMemoria, torneo: RegistroTorneo, fecha: Date) {
  if (torneo.estado !== 'ACTIVO') {
    throw regla(MENSAJES_DEL_MODELO.torneoYaNoActivo)
  }
  if (torneo.equipoIds.length < MINIMO_EQUIPOS_PARA_CERRAR) {
    throw regla(MENSAJES_DEL_MODELO.faltanEquipos)
  }
  torneo.estado = 'EN_CURSO'
  agregarRonda(almacen, torneo, torneo.equipoIds.slice(), fecha)
}

/**
 * Torneo.generarRonda + TorneoEliminacionSimple.armarEmparejamientos: empareja en orden y el
 * impar pasa directo. Como el modelo, la fecha programada es el momento en que se genera.
 * Quién juega lo decide quien llama: en la ronda 1 son los inscritos y después los que avanzan.
 */
export function agregarRonda(almacen: AlmacenEnMemoria, torneo: RegistroTorneo, equipoIds: string[], fecha: Date) {
  const numero = torneo.rondas.length + 1
  const partidaIds: string[] = []
  for (let indice = 0; indice < equipoIds.length - 1; indice += 2) {
    const id = `${torneo.id}-${numero}-${partidaIds.length + 1}`
    almacen.guardarPartida({
      id,
      torneoId: torneo.id,
      ronda: numero,
      equipoIds: [equipoIds[indice] as string, equipoIds[indice + 1] as string],
      estado: 'PROGRAMADA',
      fechaProgramada: new Date(fecha),
      fechaFin: null,
      reportes: [],
      evidencias: [],
      disputa: null,
      ganadorId: null,
      eventos: [],
    })
    partidaIds.push(id)
  }
  const paseAutomaticoId = equipoIds.length % 2 === 1 ? (equipoIds.at(-1) ?? null) : null
  torneo.rondas.push({ numero, partidaIds, paseAutomaticoId })
}

// ---------- Equipo.js ----------

/**
 * Integrante (constructor de Usuario) + Equipo.agregarIntegrante. El correo identifica a la
 * persona: si ya existe se reutiliza, y así aplican las reglas de duplicado y de otro equipo.
 */
export function agregarIntegrante(
  almacen: AlmacenEnMemoria,
  equipo: RegistroEquipo,
  datos: { nombre: string; correo: string },
  nuevoId: () => string,
): RegistroUsuario {
  const nombre = datos.nombre.trim()
  const correo = datos.correo.trim()
  if (!nombre || !correo) {
    throw regla(MENSAJES_DEL_MODELO.datosDeUsuarioObligatorios)
  }
  const existente = almacen.buscarUsuarioPorCorreo(correo)
  if (existente && existente.rol !== 'INTEGRANTE' && existente.equipoId !== equipo.id) {
    // Administrador.registrarUsuario: la cuenta ya existe con otro rol.
    throw regla(MENSAJES_DEL_MODELO.usuarioYaRegistrado)
  }
  const integrante: RegistroUsuario = existente ?? { id: nuevoId(), nombre, correo, rol: 'INTEGRANTE', equipoId: null }
  if (estadoRoster(equipo.integranteIds.length).lleno) {
    throw regla(MENSAJES_DEL_MODELO.rosterLleno)
  }
  if (equipo.integranteIds.includes(integrante.id) || equipo.capitanId === integrante.id) {
    throw regla(MENSAJES_DEL_MODELO.integranteYaEnEquipo)
  }
  if (integrante.equipoId && integrante.equipoId !== equipo.id) {
    throw regla(MENSAJES_DEL_MODELO.integranteEnOtroEquipo)
  }
  integrante.equipoId = equipo.id
  almacen.guardarUsuario(integrante)
  equipo.integranteIds.push(integrante.id)
  return integrante
}
