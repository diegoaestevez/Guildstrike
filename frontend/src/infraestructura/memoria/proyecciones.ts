import { marcadorValidado } from '../../dominio/partida'
import type {
  DisputaResumen,
  Equipo,
  EquipoRef,
  Partida,
  PartidaResumen,
  PersonaRef,
  Ronda,
  Torneo,
  TorneoResumen,
  Usuario,
} from '../../dominio/tipos'
import type { AlmacenEnMemoria, RegistroPartida, RegistroRonda, RegistroTorneo, RegistroUsuario } from './almacen'

// Convierte los registros del almacén en objetos del dominio, como lo haría el serializador
// de la API. Todo lo que sale de aquí es una copia: la interfaz nunca toca el almacén.

const copiaFecha = (fecha: Date) => new Date(fecha)
const copiaFechaONula = (fecha: Date | null) => (fecha ? new Date(fecha) : null)

function persona(almacen: AlmacenEnMemoria, usuarioId: string): PersonaRef {
  const usuario = almacen.usuario(usuarioId)
  return { id: usuario.id, nombre: usuario.nombre }
}

function equipoRef(almacen: AlmacenEnMemoria, equipoId: string): EquipoRef {
  const equipo = almacen.equipo(equipoId)
  return { id: equipo.id, nombre: equipo.nombre }
}

function parDeEquipos(almacen: AlmacenEnMemoria, partida: RegistroPartida): readonly [EquipoRef, EquipoRef] {
  return [equipoRef(almacen, partida.equipoIds[0]), equipoRef(almacen, partida.equipoIds[1])]
}

export function aUsuario(almacen: AlmacenEnMemoria, usuario: RegistroUsuario): Usuario {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    equipo: usuario.equipoId ? equipoRef(almacen, usuario.equipoId) : null,
  }
}

export function aPartidaResumen(almacen: AlmacenEnMemoria, partida: RegistroPartida): PartidaResumen {
  const equipos = parDeEquipos(almacen, partida)
  return {
    id: partida.id,
    torneoId: partida.torneoId,
    ronda: partida.ronda,
    equipos,
    estado: partida.estado,
    fechaProgramada: copiaFecha(partida.fechaProgramada),
    fechaFin: copiaFechaONula(partida.fechaFin),
    ganadorId: partida.ganadorId,
    marcador: partida.estado === 'FINALIZADA' ? marcadorValidado(equipos, partida.reportes) : null,
  }
}

export function aPartida(almacen: AlmacenEnMemoria, partida: RegistroPartida): Partida {
  const { disputa } = partida
  return {
    ...aPartidaResumen(almacen, partida),
    torneoNombre: almacen.torneo(partida.torneoId).nombre,
    reportes: partida.reportes.map((reporte) => ({ ...reporte, fecha: copiaFecha(reporte.fecha) })),
    evidencias: partida.evidencias.map((evidencia) => ({
      equipoId: evidencia.equipoId,
      nombre: evidencia.nombre,
      tipo: evidencia.tipo,
      tamanoBytes: evidencia.tamanoBytes,
      fechaCarga: copiaFecha(evidencia.fechaCarga),
      url: evidencia.url,
    })),
    disputa: disputa
      ? {
          solicitante: persona(almacen, disputa.solicitanteId),
          motivo: disputa.motivo,
          estado: disputa.estado,
          arbitro: disputa.arbitroId ? persona(almacen, disputa.arbitroId) : null,
          equipoGanadorId: disputa.equipoGanadorId,
          justificacion: disputa.justificacion,
          fechaCreacion: copiaFecha(disputa.fechaCreacion),
          fechaResolucion: copiaFechaONula(disputa.fechaResolucion),
        }
      : null,
    eventos: partida.eventos.map((evento) => ({
      tipo: evento.tipo,
      usuario: evento.usuarioId ? persona(almacen, evento.usuarioId) : null,
      descripcion: evento.descripcion,
      fecha: copiaFecha(evento.fecha),
    })),
  }
}

export function aRonda(almacen: AlmacenEnMemoria, ronda: RegistroRonda): Ronda {
  return {
    numero: ronda.numero,
    partidas: ronda.partidaIds.map((id) => aPartidaResumen(almacen, almacen.partida(id))),
    paseAutomatico: ronda.paseAutomaticoId ? equipoRef(almacen, ronda.paseAutomaticoId) : null,
  }
}

export function aTorneo(almacen: AlmacenEnMemoria, torneo: RegistroTorneo): Torneo {
  return {
    id: torneo.id,
    nombre: torneo.nombre,
    estado: torneo.estado,
    formato: torneo.formato,
    equipos: torneo.equipoIds.map((id) => {
      const equipo = almacen.equipo(id)
      return {
        id: equipo.id,
        nombre: equipo.nombre,
        capitanId: equipo.capitanId,
        totalIntegrantes: equipo.integranteIds.length,
      }
    }),
    rondas: torneo.rondas.map((ronda) => aRonda(almacen, ronda)),
  }
}

export function aTorneoResumen(torneo: RegistroTorneo): TorneoResumen {
  return {
    id: torneo.id,
    nombre: torneo.nombre,
    estado: torneo.estado,
    formato: torneo.formato,
    equiposInscritos: torneo.equipoIds.length,
    rondaActual: torneo.rondas.at(-1)?.numero ?? null,
  }
}

export function aDisputaResumen(almacen: AlmacenEnMemoria, partida: RegistroPartida): DisputaResumen | null {
  const { disputa } = partida
  if (!disputa) {
    return null
  }
  return {
    partidaId: partida.id,
    torneoId: partida.torneoId,
    torneoNombre: almacen.torneo(partida.torneoId).nombre,
    ronda: partida.ronda,
    equipos: parDeEquipos(almacen, partida),
    motivo: disputa.motivo,
    solicitante: persona(almacen, disputa.solicitanteId),
    arbitro: disputa.arbitroId ? persona(almacen, disputa.arbitroId) : null,
    estado: disputa.estado,
    fechaCreacion: copiaFecha(disputa.fechaCreacion),
  }
}

export function aEquipo(almacen: AlmacenEnMemoria, equipoId: string): Equipo {
  const equipo = almacen.equipo(equipoId)
  return {
    id: equipo.id,
    nombre: equipo.nombre,
    capitan: persona(almacen, equipo.capitanId),
    integrantes: equipo.integranteIds.map((id) => {
      const integrante = almacen.usuario(id)
      return { id: integrante.id, nombre: integrante.nombre, correo: integrante.correo }
    }),
  }
}
