import { ErrorDeConexion } from '../../aplicacion/errores'
import type {
  DisputaResumen,
  Equipo,
  Partida,
  PartidaResumen,
  Ronda,
  Torneo,
  TorneoResumen,
  Usuario,
} from '../../dominio/tipos'
import type {
  DisputaResumenDTO,
  EquipoDTO,
  PartidaDTO,
  PartidaResumenDTO,
  RondaDTO,
  TorneoDTO,
  TorneoResumenDTO,
  UsuarioDTO,
} from './dto'

// DTO -> dominio. Lo único que cambia de forma son las fechas (ISO -> Date); lo demás ya
// viene con los nombres del dominio, por eso los mapeos son cortos.

export function aFecha(iso: string): Date {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) {
    throw new ErrorDeConexion(`La API devolvió una fecha inválida: ${iso}`)
  }
  return fecha
}

const aFechaONula = (iso: string | null) => (iso === null ? null : aFecha(iso))

export const aUsuario = (dto: UsuarioDTO): Usuario => ({ ...dto, equipo: dto.equipo ? { ...dto.equipo } : null })

export const aEquipo = (dto: EquipoDTO): Equipo => ({
  id: dto.id,
  nombre: dto.nombre,
  capitan: { ...dto.capitan },
  integrantes: dto.integrantes.map((integrante) => ({ ...integrante })),
})

export const aPartidaResumen = (dto: PartidaResumenDTO): PartidaResumen => ({
  id: dto.id,
  torneoId: dto.torneoId,
  ronda: dto.ronda,
  equipos: [{ ...dto.equipos[0] }, { ...dto.equipos[1] }],
  estado: dto.estado,
  fechaProgramada: aFecha(dto.fechaProgramada),
  fechaFin: aFechaONula(dto.fechaFin),
  ganadorId: dto.ganadorId,
  marcador: dto.marcador ? { ...dto.marcador } : null,
})

export const aPartida = (dto: PartidaDTO): Partida => ({
  ...aPartidaResumen(dto),
  torneoNombre: dto.torneoNombre,
  reportes: dto.reportes.map((reporte) => ({ ...reporte, fecha: aFecha(reporte.fecha) })),
  evidencias: dto.evidencias.map((evidencia) => ({ ...evidencia, fechaCarga: aFecha(evidencia.fechaCarga) })),
  disputa: dto.disputa
    ? {
        ...dto.disputa,
        fechaCreacion: aFecha(dto.disputa.fechaCreacion),
        fechaResolucion: aFechaONula(dto.disputa.fechaResolucion),
      }
    : null,
  eventos: dto.eventos.map((evento) => ({ ...evento, fecha: aFecha(evento.fecha) })),
})

const aRonda = (dto: RondaDTO): Ronda => ({
  numero: dto.numero,
  partidas: dto.partidas.map(aPartidaResumen),
  paseAutomatico: dto.paseAutomatico ? { ...dto.paseAutomatico } : null,
})

export const aTorneo = (dto: TorneoDTO): Torneo => ({
  id: dto.id,
  nombre: dto.nombre,
  estado: dto.estado,
  formato: dto.formato,
  equipos: dto.equipos.map((equipo) => ({ ...equipo })),
  rondas: dto.rondas.map(aRonda),
})

export const aTorneoResumen = (dto: TorneoResumenDTO): TorneoResumen => ({ ...dto })

export const aDisputaResumen = (dto: DisputaResumenDTO): DisputaResumen => ({
  ...dto,
  equipos: [{ ...dto.equipos[0] }, { ...dto.equipos[1] }],
  fechaCreacion: aFecha(dto.fechaCreacion),
})
