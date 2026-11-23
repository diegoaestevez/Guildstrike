import type {
  EstadoDisputa,
  EstadoPartida,
  EstadoTorneo,
  FormatoTorneo,
  Rol,
  TipoEvento,
} from '../../dominio/tipos'

// Formas exactas del JSON de la API (CONTRATO-API.md). Las fechas viajan como texto ISO 8601
// y se convierten a Date en mapeos.ts. Solo ids y referencias {id, nombre}: ningún objeto
// anidado con referencias circulares como los del modelo.

export interface ErrorDTO {
  error: string
}

export interface ReferenciaDTO {
  id: string
  nombre: string
}

export interface UsuarioDTO {
  id: string
  nombre: string
  correo: string
  rol: Rol
  equipo: ReferenciaDTO | null
}

export interface IntegranteDTO {
  id: string
  nombre: string
  correo: string
}

export interface EquipoDTO {
  id: string
  nombre: string
  capitan: ReferenciaDTO
  integrantes: IntegranteDTO[]
}

export interface EquipoInscritoDTO extends ReferenciaDTO {
  capitanId: string
  totalIntegrantes: number
}

export interface PartidaResumenDTO {
  id: string
  torneoId: string
  ronda: number
  equipos: [ReferenciaDTO, ReferenciaDTO]
  estado: EstadoPartida
  fechaProgramada: string
  fechaFin: string | null
  ganadorId: string | null
  marcador: { equipoA: number; equipoB: number } | null
}

export interface RondaDTO {
  numero: number
  partidas: PartidaResumenDTO[]
  paseAutomatico: ReferenciaDTO | null
}

export interface TorneoResumenDTO {
  id: string
  nombre: string
  estado: EstadoTorneo
  formato: FormatoTorneo
  equiposInscritos: number
  rondaActual: number | null
}

export interface TorneoDTO {
  id: string
  nombre: string
  estado: EstadoTorneo
  formato: FormatoTorneo
  equipos: EquipoInscritoDTO[]
  rondas: RondaDTO[]
}

export interface ReporteDTO {
  equipoId: string
  capitanId: string
  marcadorPropio: number
  marcadorRival: number
  fecha: string
}

export interface EvidenciaDTO {
  equipoId: string
  nombre: string
  tipo: string
  tamanoBytes: number
  fechaCarga: string
  url: string | null
}

export interface DisputaDTO {
  solicitante: ReferenciaDTO
  motivo: string
  estado: EstadoDisputa
  arbitro: ReferenciaDTO | null
  equipoGanadorId: string | null
  justificacion: string | null
  fechaCreacion: string
  fechaResolucion: string | null
}

export interface EventoPartidaDTO {
  tipo: TipoEvento
  usuario: ReferenciaDTO | null
  descripcion: string
  fecha: string
}

export interface PartidaDTO extends PartidaResumenDTO {
  torneoNombre: string
  reportes: ReporteDTO[]
  evidencias: EvidenciaDTO[]
  disputa: DisputaDTO | null
  eventos: EventoPartidaDTO[]
}

export interface DisputaResumenDTO {
  partidaId: string
  torneoId: string
  torneoNombre: string
  ronda: number
  equipos: [ReferenciaDTO, ReferenciaDTO]
  motivo: string
  solicitante: ReferenciaDTO
  arbitro: ReferenciaDTO | null
  estado: EstadoDisputa
  fechaCreacion: string
}
